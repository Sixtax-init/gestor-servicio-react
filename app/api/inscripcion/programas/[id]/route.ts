import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/session.server"
import { sql } from "@/lib/db"

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(["pre_candidato", "alumno", "administrador", "main_admin"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const { id } = await params
    const programaId = Number.parseInt(id)

    const [programa] = await sql`
      SELECT
        p.*,
        d.nombre AS departamento_nombre,
        c.nombre AS convocatoria_nombre,
        c.estado AS convocatoria_estado
      FROM programas p
      LEFT JOIN departamentos d ON d.id = p.departamento_id
      LEFT JOIN convocatorias c ON c.id = p.convocatoria_id
      WHERE p.id = ${programaId} AND p.activo = true
    `
    if (!programa) {
      return NextResponse.json({ error: "Programa no encontrado" }, { status: 404 })
    }

    const horarios = await sql`
      SELECT
        h.id,
        h.dias,
        h.hora_inicio,
        h.hora_fin,
        h.plazas,
        GREATEST(
          h.plazas - COUNT(ip.id) FILTER (WHERE ip.estado != 'rechazada_programa'),
          0
        ) AS cupo_disponible
      FROM horarios_programa h
      LEFT JOIN inscripciones_programa ip ON ip.horario_programa_id = h.id
      WHERE h.programa_id = ${programaId}
      GROUP BY h.id
      ORDER BY h.hora_inicio ASC
    `

    return NextResponse.json({ programa, horarios })
  } catch (error) {
    console.error("[inscripcion/programas/id] GET:", error)
    return NextResponse.json({ error: "Error al obtener programa" }, { status: 500 })
  }
}
