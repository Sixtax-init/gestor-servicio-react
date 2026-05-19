import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/session.server"
import { sql } from "@/lib/db"

type Params = { params: Promise<{ id: string; horarioId: string }> }

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(["main_admin"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const { id, horarioId } = await params
    const programaId = Number.parseInt(id)
    const hId = Number.parseInt(horarioId)

    const [horario] = await sql`
      SELECT h.id FROM horarios_programa h WHERE h.id = ${hId} AND h.programa_id = ${programaId}
    `
    if (!horario) {
      return NextResponse.json({ error: "Horario no encontrado" }, { status: 404 })
    }

    const [tieneInscripciones] = await sql`
      SELECT COUNT(ip.id) AS total
      FROM inscripciones_programa ip
      WHERE ip.horario_programa_id = ${hId} AND ip.estado != 'rechazada_programa'
    `
    if (Number(tieneInscripciones.total) > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar un horario con inscripciones activas" },
        { status: 422 }
      )
    }

    await sql`DELETE FROM horarios_programa WHERE id = ${hId}`

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[admin/programas/id/horarios/horarioId] DELETE:", error)
    return NextResponse.json({ error: "Error al eliminar horario" }, { status: 500 })
  }
}
