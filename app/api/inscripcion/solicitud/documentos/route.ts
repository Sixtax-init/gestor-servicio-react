import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/session.server"
import { sql } from "@/lib/db"
import { saveFile } from "@/lib/file-upload"
import type { TipoDocumento } from "@/lib/db"

const TIPOS_VALIDOS: TipoDocumento[] = [
  "kardex",
  "horario",
  "solicitud_prestador",
  "fotografia",
  "constancia_laboral",
  "propuesta_formato",
]

const MIME_PERMITIDOS = ["application/pdf", "image/jpeg", "image/png", "application/octet-stream"]
const EXT_PERMITIDAS = [".pdf", ".jpg", ".jpeg", ".png"]
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(["pre_candidato"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const [solicitud] = await sql`
      SELECT id, estado FROM solicitudes_inscripcion
      WHERE usuario_id = ${user.id}
      ORDER BY created_at DESC LIMIT 1
    `
    if (!solicitud) {
      return NextResponse.json({ error: "No tienes una solicitud activa" }, { status: 404 })
    }
    if (!["borrador", "rechazada"].includes(solicitud.estado)) {
      return NextResponse.json(
        { error: "No puedes modificar documentos en el estado actual de tu solicitud" },
        { status: 422 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const tipo_documento = formData.get("tipo_documento") as TipoDocumento

    if (!file) {
      return NextResponse.json({ error: "Archivo requerido" }, { status: 400 })
    }
    if (!tipo_documento || !TIPOS_VALIDOS.includes(tipo_documento)) {
      return NextResponse.json(
        { error: `Tipo de documento inválido. Valores permitidos: ${TIPOS_VALIDOS.join(", ")}` },
        { status: 400 }
      )
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "El archivo excede el máximo de 10 MB" }, { status: 400 })
    }
    const ext = "." + file.name.split(".").pop()?.toLowerCase()
    const mimeValido = MIME_PERMITIDOS.includes(file.type)
    const extValida = EXT_PERMITIDAS.includes(ext)
    if (!mimeValido && !extValida) {
      return NextResponse.json({ error: "Solo se aceptan archivos PDF, JPG y PNG" }, { status: 400 })
    }

    const rutaArchivo = await saveFile(file, solicitud.id, "solicitudes")

    // Upsert: reemplaza si ya existe el mismo tipo
    const [documento] = await sql`
      INSERT INTO documentos_solicitud (solicitud_id, tipo_documento, nombre_archivo, ruta_archivo, tipo_mime, tamano_bytes)
      VALUES (${solicitud.id}, ${tipo_documento}, ${file.name}, ${rutaArchivo}, ${file.type}, ${file.size})
      ON CONFLICT (solicitud_id, tipo_documento)
      DO UPDATE SET
        nombre_archivo = EXCLUDED.nombre_archivo,
        ruta_archivo   = EXCLUDED.ruta_archivo,
        tipo_mime      = EXCLUDED.tipo_mime,
        tamano_bytes   = EXCLUDED.tamano_bytes,
        uploaded_at    = CURRENT_TIMESTAMP
      RETURNING *
    `

    return NextResponse.json({ documento }, { status: 201 })
  } catch (error) {
    console.error("[inscripcion/solicitud/documentos] POST:", error)
    return NextResponse.json({ error: "Error al subir documento" }, { status: 500 })
  }
}
