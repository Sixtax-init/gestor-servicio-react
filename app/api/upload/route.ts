import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session.server"
import { sql } from "@/lib/db"
import { saveFile } from "@/lib/file-upload"

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
]
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export async function POST(request: NextRequest) {
  console.log("[upload] Request received")

  const user = await getSession()
  if (!user) {
    console.log("[upload] ❌ No user session found")
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  console.log("[upload] ✅ User authenticated:", { id: user.id, tipo_usuario: user.tipo_usuario })

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    // ✅ Nuevos parámetros (opcionales)
    const type = (formData.get("type") as string) || "entregas"
    const referenceId =
      (formData.get("referenceId") as string) || (formData.get("entregaId") as string) || "0"

    console.log("[upload] Form data received:", {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      type,
      referenceId,
    })

    if (!file) {
      return NextResponse.json({ error: "Archivo requerido" }, { status: 400 })
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "El archivo excede el tamaño máximo de 10 MB" }, { status: 400 })
    }

    // Validar tipo de archivo
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Tipo de archivo no permitido. Solo se aceptan PDF, imágenes, Word, Excel y PowerPoint" }, { status: 400 })
    }

    // ✅ Validación solo para ENTREGAS (no para AVANCES)
    if (type === "entregas") {
      if (!referenceId || referenceId === "0") {
        return NextResponse.json({ error: "Falta entregaId" }, { status: 400 })
      }

      const entrega = await sql`
        SELECT * FROM entregas
        WHERE id = ${Number(referenceId)} 
          AND (${user.tipo_usuario} != 'alumno' OR alumno_id = ${user.id})
      `
      if (entrega.length === 0) {
        console.log("[upload] ❌ Entrega not found or no permission")
        return NextResponse.json({ error: "Entrega no encontrada o sin permisos" }, { status: 404 })
      }
    }

    // 💾 Guardar archivo según tipo (agregamos 'avances')
    console.log(`[upload] Saving file to uploads/${type}`)
    const rutaArchivo = await saveFile(
      file,
      Number(referenceId) || 0,
      type as "entregas" | "tareas" | "cursos" | "avances"
    )
    console.log("[upload] File saved at:", rutaArchivo)

    // 🧾 Registrar en DB solo si es entrega
    if (type === "entregas" && referenceId !== "0") {
      await sql`
        INSERT INTO archivos (entrega_id, nombre_archivo, ruta_archivo, tipo_mime, tamano_bytes)
        VALUES (${Number(referenceId)}, ${file.name}, ${rutaArchivo}, ${file.type}, ${file.size})
      `
    }

    // ⚠️ Si es 'avances', solo guardamos físicamente el archivo y devolvemos la ruta
    console.log("[upload] ✅ File uploaded successfully")
    return NextResponse.json(
      {
        nombre: file.name,
        ruta: rutaArchivo,
        tipo: file.type,
        size: file.size,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[upload] 💥 Error uploading file:", error)
    return NextResponse.json(
      {
        error: "Error al subir archivo",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    )
  }
}
