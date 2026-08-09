import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session.server"
import { sql } from "@/lib/db"
import { saveFile, isUploadType, hasBlockedExtension } from "@/lib/file-upload"

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

  const user = await getSession()
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }


  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    // ✅ Nuevos parámetros (opcionales)
    const rawType = (formData.get("type") as string) || "entregas"
    const referenceId =
      (formData.get("referenceId") as string) || (formData.get("entregaId") as string) || "0"

    // El tipo llega del cliente y se usa para construir una ruta en disco:
    // se valida contra la lista blanca antes de tocar el sistema de archivos.
    if (!isUploadType(rawType)) {
      return NextResponse.json({ error: "Tipo de subida no permitido" }, { status: 400 })
    }
    const type = rawType

    const parsedReferenceId = Number(referenceId)
    if (!Number.isInteger(parsedReferenceId) || parsedReferenceId < 0) {
      return NextResponse.json({ error: "referenceId inválido" }, { status: 400 })
    }

    if (!file) {
      return NextResponse.json({ error: "Archivo requerido" }, { status: 400 })
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "El archivo excede el tamaño máximo de 10 MB" }, { status: 400 })
    }

    // Validar tipo de archivo
    if (!ALLOWED_MIME_TYPES.includes(file.type) || hasBlockedExtension(file.name)) {
      return NextResponse.json({ error: "Tipo de archivo no permitido. Solo se aceptan PDF, imágenes, Word, Excel y PowerPoint" }, { status: 400 })
    }

    // ✅ Validación de propiedad para ENTREGAS y AVANCES ligados a una entrega
    if (type === "entregas" || (type === "avances" && parsedReferenceId !== 0)) {
      if (type === "entregas" && parsedReferenceId === 0) {
        return NextResponse.json({ error: "Falta entregaId" }, { status: 400 })
      }

      const entrega = await sql`
        SELECT id FROM entregas
        WHERE id = ${parsedReferenceId}
          AND (${user.tipo_usuario} != 'alumno' OR alumno_id = ${user.id})
      `
      if (entrega.length === 0) {
        return NextResponse.json({ error: "Entrega no encontrada o sin permisos" }, { status: 404 })
      }
    }

    // Los materiales de curso/tarea sólo los sube el personal docente
    if (["cursos", "tareas", "instrucciones"].includes(type) &&
        !["maestro", "administrador", "main_admin"].includes(user.tipo_usuario)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // 💾 Guardar archivo según tipo (agregamos 'avances')
    // Solo main_admin puede subir logos institucionales
    if (type === "institucion" && user.tipo_usuario !== "main_admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const rutaArchivo = await saveFile(file, parsedReferenceId, type)

    // 🧾 Registrar en DB solo si es entrega
    if (type === "entregas" && parsedReferenceId !== 0) {
      await sql`
        INSERT INTO archivos (entrega_id, nombre_archivo, ruta_archivo, tipo_mime, tamano_bytes)
        VALUES (${parsedReferenceId}, ${file.name}, ${rutaArchivo}, ${file.type}, ${file.size})
      `
    }

    // ⚠️ Si es 'avances', solo guardamos físicamente el archivo y devolvemos la ruta
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
