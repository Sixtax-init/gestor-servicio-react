import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/session.server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const user = await requireRole(["main_admin"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const convocatorias = await sql`
      SELECT
        c.*,
        COUNT(si.id) FILTER (WHERE si.estado = 'pendiente')          AS solicitudes_pendientes,
        COUNT(si.id) FILTER (WHERE si.estado = 'aprobada')           AS solicitudes_aprobadas,
        COUNT(si.id)                                                  AS total_solicitudes,
        COUNT(DISTINCT p.id) FILTER (WHERE p.activo = true)          AS total_programas,
        COUNT(t.id)  FILTER (WHERE t.tipo = 'normal')                AS turnos_normal,
        COUNT(t.id)  FILTER (WHERE t.tipo = 'repechaje')             AS turnos_repechaje
      FROM convocatorias c
      LEFT JOIN solicitudes_inscripcion si ON si.convocatoria_id = c.id
      LEFT JOIN programas p                ON p.convocatoria_id  = c.id
      LEFT JOIN turnos t                   ON t.convocatoria_id  = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `

    return NextResponse.json({ convocatorias })
  } catch (error) {
    console.error("[admin/convocatorias] GET:", error)
    return NextResponse.json({ error: "Error al obtener convocatorias" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(["main_admin"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

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
      INSERT INTO convocatorias (
        nombre, descripcion,
        fecha_inicio_registro, fecha_fin_registro,
        fecha_platica,
        fecha_inicio_seleccion, fecha_fin_seleccion,
        fecha_inicio_repechaje, fecha_fin_repechaje,
        estado, activo
      ) VALUES (
        ${nombre.trim()}, ${descripcion ?? null},
        ${fecha_inicio_registro}, ${fecha_fin_registro},
        ${fecha_platica ?? null},
        ${fecha_inicio_seleccion ?? null}, ${fecha_fin_seleccion ?? null},
        ${fecha_inicio_repechaje ?? null}, ${fecha_fin_repechaje ?? null},
        'borrador', true
      )
      RETURNING *
    `

    return NextResponse.json({ convocatoria }, { status: 201 })
  } catch (error) {
    console.error("[admin/convocatorias] POST:", error)
    return NextResponse.json({ error: "Error al crear convocatoria" }, { status: 500 })
  }
}
