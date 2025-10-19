import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { sql } from "@/lib/db"
import { saveFile } from "@/lib/file-upload"

export async function POST(request: NextRequest) {
  const user = await getSession()

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const entregaId = formData.get("entrega_id") as string

    if (!file || !entregaId) {
      return NextResponse.json({ error: "Archivo y ID de entrega requeridos" }, { status: 400 })
    }

    // Verificar que la entrega pertenece al usuario
    const entrega = await sql`
      SELECT * FROM entregas 
      WHERE id = ${Number.parseInt(entregaId)} AND alumno_id = ${user.id}
    `

    if (entrega.length === 0) {
      return NextResponse.json({ error: "Entrega no encontrada" }, { status: 404 })
    }

    // Guardar archivo
    const rutaArchivo = await saveFile(file, Number.parseInt(entregaId))

    // Registrar en base de datos
    const result = await sql`
      INSERT INTO archivos (entrega_id, nombre_archivo, ruta_archivo, tipo_mime, tamano_bytes)
      VALUES (
        ${Number.parseInt(entregaId)},
        ${file.name},
        ${rutaArchivo},
        ${file.type},
        ${file.size}
      )
      RETURNING *
    `

    return NextResponse.json({ archivo: result[0] }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error uploading file:", error)
    return NextResponse.json({ error: "Error al subir archivo" }, { status: 500 })
  }
}
