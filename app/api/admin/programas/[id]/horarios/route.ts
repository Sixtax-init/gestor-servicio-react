import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/session.server"
import { sql } from "@/lib/db"

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(["administrador", "main_admin"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const { id } = await params
    const programaId = Number.parseInt(id)

    const horarios = await sql`
      SELECT
        h.*,
        h.plazas - COUNT(ip.id) FILTER (WHERE ip.estado != 'rechazada_programa') AS cupo_disponible
      FROM horarios_programa h
      LEFT JOIN inscripciones_programa ip ON ip.horario_programa_id = h.id
      WHERE h.programa_id = ${programaId}
      GROUP BY h.id
      ORDER BY h.hora_inicio ASC
    `

    return NextResponse.json({ horarios })
  } catch (error) {
    console.error("[admin/programas/id/horarios] GET:", error)
    return NextResponse.json({ error: "Error al obtener horarios" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(["administrador", "main_admin"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const { id } = await params
    const programaId = Number.parseInt(id)

    const [programa] = await sql`
      SELECT p.id, c.estado AS estado_convocatoria
      FROM programas p
      JOIN convocatorias c ON c.id = p.convocatoria_id
      WHERE p.id = ${programaId}
    `
    if (!programa) {
      return NextResponse.json({ error: "Programa no encontrado" }, { status: 404 })
    }
    if (programa.estado_convocatoria === "cerrada") {
      return NextResponse.json({ error: "No se pueden agregar horarios a una convocatoria cerrada" }, { status: 422 })
    }

    const body = await request.json()
    const { dias, hora_inicio, hora_fin, plazas } = body

    if (!dias?.trim()) {
      return NextResponse.json({ error: "Los días son requeridos" }, { status: 400 })
    }
    if (!hora_inicio || !hora_fin) {
      return NextResponse.json({ error: "El horario de inicio y fin son requeridos" }, { status: 400 })
    }
    if (!plazas || Number(plazas) < 1) {
      return NextResponse.json({ error: "Las plazas deben ser al menos 1" }, { status: 400 })
    }

    const [horario] = await sql`
      INSERT INTO horarios_programa (programa_id, dias, hora_inicio, hora_fin, plazas)
      VALUES (${programaId}, ${dias.trim()}, ${hora_inicio}, ${hora_fin}, ${Number(plazas)})
      RETURNING *
    `

    return NextResponse.json({ horario }, { status: 201 })
  } catch (error) {
    console.error("[admin/programas/id/horarios] POST:", error)
    return NextResponse.json({ error: "Error al crear horario" }, { status: 500 })
  }
}
