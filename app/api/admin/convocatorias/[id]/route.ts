import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/session.server"
import { sql } from "@/lib/db"

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(["main_admin"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const { id } = await params
    const convocatoriaId = Number.parseInt(id)

    const [convocatoria] = await sql`
      SELECT
        c.*,
        COUNT(si.id) FILTER (WHERE si.estado = 'pendiente')           AS solicitudes_pendientes,
        COUNT(si.id) FILTER (WHERE si.estado = 'aprobada')            AS solicitudes_aprobadas,
        COUNT(si.id) FILTER (WHERE si.estado = 'rechazada')           AS solicitudes_rechazadas,
        COUNT(si.id) FILTER (WHERE si.estado = 'confirmada')          AS solicitudes_confirmadas,
        COUNT(si.id)                                                   AS total_solicitudes,
        COUNT(DISTINCT p.id)                                           AS total_programas
      FROM convocatorias c
      LEFT JOIN solicitudes_inscripcion si ON si.convocatoria_id = c.id
      LEFT JOIN programas p ON p.convocatoria_id = c.id AND p.activo = true
      WHERE c.id = ${convocatoriaId}
      GROUP BY c.id
    `

    if (!convocatoria) {
      return NextResponse.json({ error: "Convocatoria no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ convocatoria })
  } catch (error) {
    console.error("[admin/convocatorias/id] GET:", error)
    return NextResponse.json({ error: "Error al obtener convocatoria" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(["main_admin"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const { id } = await params
    const convocatoriaId = Number.parseInt(id)

    const [existente] = await sql`
      SELECT id, estado FROM convocatorias WHERE id = ${convocatoriaId}
    `
    if (!existente) {
      return NextResponse.json({ error: "Convocatoria no encontrada" }, { status: 404 })
    }
    if (existente.estado !== "borrador") {
      return NextResponse.json(
        { error: "Solo se pueden editar convocatorias en estado borrador" },
        { status: 422 }
      )
    }

    const body = await request.json()
    const {
      nombre,
      descripcion,
      fecha_inicio_registro,
      fecha_fin_registro,
      fecha_platica,
      fecha_inicio_seleccion,
      fecha_fin_seleccion,
      fecha_inicio_repechaje,
      fecha_fin_repechaje,
    } = body

    if (!nombre?.trim()) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
    }
    if (!fecha_inicio_registro || !fecha_fin_registro) {
      return NextResponse.json({ error: "Las fechas de registro son requeridas" }, { status: 400 })
    }
    if (new Date(fecha_inicio_registro) >= new Date(fecha_fin_registro)) {
      return NextResponse.json({ error: "La fecha de inicio debe ser anterior a la fecha fin" }, { status: 400 })
    }

    const [convocatoria] = await sql`
      UPDATE convocatorias SET
        nombre                  = ${nombre.trim()},
        descripcion             = ${descripcion ?? null},
        fecha_inicio_registro   = ${fecha_inicio_registro},
        fecha_fin_registro      = ${fecha_fin_registro},
        fecha_platica           = ${fecha_platica ?? null},
        fecha_inicio_seleccion  = ${fecha_inicio_seleccion ?? null},
        fecha_fin_seleccion     = ${fecha_fin_seleccion ?? null},
        fecha_inicio_repechaje  = ${fecha_inicio_repechaje ?? null},
        fecha_fin_repechaje     = ${fecha_fin_repechaje ?? null}
      WHERE id = ${convocatoriaId}
      RETURNING *
    `

    return NextResponse.json({ convocatoria })
  } catch (error) {
    console.error("[admin/convocatorias/id] PUT:", error)
    return NextResponse.json({ error: "Error al actualizar convocatoria" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(["main_admin"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const { id } = await params
    const convocatoriaId = Number.parseInt(id)

    const [existente] = await sql`
      SELECT id, estado FROM convocatorias WHERE id = ${convocatoriaId}
    `
    if (!existente) {
      return NextResponse.json({ error: "Convocatoria no encontrada" }, { status: 404 })
    }
    if (existente.estado !== "borrador") {
      return NextResponse.json(
        { error: "Solo se pueden eliminar convocatorias en estado borrador" },
        { status: 422 }
      )
    }

    const [tieneSolicitudes] = await sql`
      SELECT COUNT(*) AS total FROM solicitudes_inscripcion WHERE convocatoria_id = ${convocatoriaId}
    `
    if (Number(tieneSolicitudes.total) > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar una convocatoria con solicitudes registradas" },
        { status: 422 }
      )
    }

    await sql`DELETE FROM convocatorias WHERE id = ${convocatoriaId}`

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[admin/convocatorias/id] DELETE:", error)
    return NextResponse.json({ error: "Error al eliminar convocatoria" }, { status: 500 })
  }
}
