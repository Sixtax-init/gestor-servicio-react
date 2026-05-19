import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/session.server"
import { sql } from "@/lib/db"

type Params = { params: Promise<{ tipo: string }> }

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(["pre_candidato"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const { tipo } = await params

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
        { error: "No puedes eliminar documentos en el estado actual de tu solicitud" },
        { status: 422 }
      )
    }

    const [documento] = await sql`
      DELETE FROM documentos_solicitud
      WHERE solicitud_id = ${solicitud.id} AND tipo_documento = ${tipo}
      RETURNING id
    `
    if (!documento) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[inscripcion/solicitud/documentos/tipo] DELETE:", error)
    return NextResponse.json({ error: "Error al eliminar documento" }, { status: 500 })
  }
}
