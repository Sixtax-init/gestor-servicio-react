import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/session.server"
import { sql } from "@/lib/db"

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(["main_admin"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const { id } = await params
    const horarioId = Number.parseInt(id)

    const [existente] = await sql`
      SELECT h.id, c.estado AS estado_convocatoria
      FROM horarios_programa h
      JOIN programas p     ON p.id = h.programa_id
      JOIN convocatorias c ON c.id = p.convocatoria_id
      WHERE h.id = ${horarioId}
    `
    if (!existente) {
      return NextResponse.json({ error: "Horario no encontrado" }, { status: 404 })
    }
    if (existente.estado_convocatoria === "cerrada") {
      return NextResponse.json({ error: "No se puede editar un horario de una convocatoria cerrada" }, { status: 422 })
    }

    const body = await request.json()
    const { dias, hora_inicio, hora_fin, plazas } = body

    if (!dias?.trim() || !hora_inicio || !hora_fin) {
      return NextResponse.json({ error: "Días y horario son requeridos" }, { status: 400 })
    }
    if (!plazas || Number(plazas) < 1) {
      return NextResponse.json({ error: "Las plazas deben ser al menos 1" }, { status: 400 })
    }

    const [inscritosActivos] = await sql`
      SELECT COUNT(*) AS total
      FROM inscripciones_programa
      WHERE horario_programa_id = ${horarioId} AND estado != 'rechazada_programa'
    `
    if (Number(plazas) < Number(inscritosActivos.total)) {
      return NextResponse.json(
        { error: `No puedes reducir las plazas por debajo de los inscritos actuales (${inscritosActivos.total})` },
        { status: 422 }
      )
    }

    const [horario] = await sql`
      UPDATE horarios_programa SET
        dias        = ${dias.trim()},
        hora_inicio = ${hora_inicio},
        hora_fin    = ${hora_fin},
        plazas      = ${Number(plazas)}
      WHERE id = ${horarioId}
      RETURNING *
    `

    return NextResponse.json({ horario })
  } catch (error) {
    console.error("[admin/horarios/id] PUT:", error)
    return NextResponse.json({ error: "Error al actualizar horario" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(["main_admin"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const { id } = await params
    const horarioId = Number.parseInt(id)

    const [existente] = await sql`SELECT id FROM horarios_programa WHERE id = ${horarioId}`
    if (!existente) {
      return NextResponse.json({ error: "Horario no encontrado" }, { status: 404 })
    }

    const [tieneInscritos] = await sql`
      SELECT COUNT(*) AS total
      FROM inscripciones_programa
      WHERE horario_programa_id = ${horarioId} AND estado != 'rechazada_programa'
    `
    if (Number(tieneInscritos.total) > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar un horario con alumnos inscritos" },
        { status: 422 }
      )
    }

    await sql`DELETE FROM horarios_programa WHERE id = ${horarioId}`

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[admin/horarios/id] DELETE:", error)
    return NextResponse.json({ error: "Error al eliminar horario" }, { status: 500 })
  }
}
