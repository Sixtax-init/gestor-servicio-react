import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/session.server"
import { sql } from "@/lib/db"
import { saveFile } from "@/lib/file-upload"

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(["pre_candidato"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Archivo requerido" }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "El archivo no puede superar los 10 MB" }, { status: 400 })
    }

    const [inscripcion] = await sql`
      SELECT ip.id, ip.solicitud_id
      FROM inscripciones_programa ip
      JOIN solicitudes_inscripcion si ON si.id = ip.solicitud_id
      WHERE si.usuario_id = ${user.id}
        AND ip.estado = 'oficio_enviado'
      LIMIT 1
    `
    if (!inscripcion) {
      return NextResponse.json(
        { error: "No hay una carta de asignación pendiente de firma para tu cuenta" },
        { status: 422 }
      )
    }

    const fileUrl = await saveFile(file, inscripcion.id, "solicitudes")

    const [updated] = await sql`
      UPDATE inscripciones_programa
      SET oficio_firmado_url = ${fileUrl},
          estado             = 'firmado_subido',
          updated_at         = CURRENT_TIMESTAMP
      WHERE id = ${inscripcion.id}
      RETURNING *
    `

    return NextResponse.json({ inscripcion: updated })
  } catch (error) {
    console.error("[inscripcion/oficio-firmado] POST:", error)
    return NextResponse.json({ error: "Error al subir la carta firmada" }, { status: 500 })
  }
}
