import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/session.server"
import { sql } from "@/lib/db"

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(["administrador", "main_admin"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const { id } = await params
    const convocatoriaId = Number.parseInt(id)

    const [convocatoria] = await sql`
      SELECT id FROM convocatorias WHERE id = ${convocatoriaId}
    `
    if (!convocatoria) {
      return NextResponse.json({ error: "Convocatoria no encontrada" }, { status: 404 })
    }

    const programas = await sql`
      SELECT
        p.*,
        d.nombre                                                            AS departamento_nombre,
        COALESCE(SUM(h.plazas), 0)                                         AS plazas_total,
        COALESCE(
          SUM(h.plazas) - COUNT(ip.id) FILTER (WHERE ip.estado != 'rechazada_programa'),
          0
        )                                                                   AS cupo_disponible,
        COUNT(DISTINCT h.id)                                                AS total_horarios
      FROM programas p
      LEFT JOIN departamentos d        ON d.id = p.departamento_id
      LEFT JOIN horarios_programa h    ON h.programa_id = p.id
      LEFT JOIN inscripciones_programa ip ON ip.horario_programa_id = h.id
      WHERE p.convocatoria_id = ${convocatoriaId} AND p.activo = true
      GROUP BY p.id, d.nombre
      ORDER BY p.nombre ASC
    `

    return NextResponse.json({ programas })
  } catch (error) {
    console.error("[admin/convocatorias/id/programas] GET:", error)
    return NextResponse.json({ error: "Error al obtener programas" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(["administrador", "main_admin"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const { id } = await params
    const convocatoriaId = Number.parseInt(id)

    const [convocatoria] = await sql`
      SELECT id, estado FROM convocatorias WHERE id = ${convocatoriaId}
    `
    if (!convocatoria) {
      return NextResponse.json({ error: "Convocatoria no encontrada" }, { status: 404 })
    }
    if (convocatoria.estado === "cerrada") {
      return NextResponse.json({ error: "No se pueden agregar programas a una convocatoria cerrada" }, { status: 422 })
    }

    const body = await request.json()
    const {
      nombre,
      nombre_dependencia,
      descripcion,
      objetivo,
      tipo_ubicacion,
      actividades,
      carreras_permitidas,
      requiere_constancia_laboral,
      requisitos_adicionales,
      responsable_dependencia_nombre,
      responsable_dependencia_puesto,
      responsable_programa_nombre,
      responsable_programa_puesto,
      domicilio,
      telefono,
      email_contacto,
      tipo_programa,
      departamento_id,
      departamento_externo,
      curso_id,
    } = body

    if (!nombre?.trim()) {
      return NextResponse.json({ error: "El nombre del programa es requerido" }, { status: 400 })
    }
    if (!tipo_ubicacion || !["interno", "externo"].includes(tipo_ubicacion)) {
      return NextResponse.json({ error: "El tipo de ubicación debe ser 'interno' o 'externo'" }, { status: 400 })
    }

    const [programa] = await sql`
      INSERT INTO programas (
        convocatoria_id, departamento_id, departamento_externo, curso_id,
        nombre, nombre_dependencia, descripcion, objetivo,
        tipo_ubicacion, actividades, carreras_permitidas,
        requiere_constancia_laboral, requisitos_adicionales,
        responsable_dependencia_nombre, responsable_dependencia_puesto,
        responsable_programa_nombre, responsable_programa_puesto,
        domicilio, telefono, email_contacto,
        tipo_programa, activo
      ) VALUES (
        ${convocatoriaId}, ${departamento_id ?? null}, ${departamento_externo ?? null}, ${curso_id ?? null},
        ${nombre.trim()}, ${nombre_dependencia ?? null}, ${descripcion ?? null}, ${objetivo ?? null},
        ${tipo_ubicacion}, ${actividades ?? null}, ${carreras_permitidas ?? null},
        ${requiere_constancia_laboral ?? false}, ${requisitos_adicionales ?? null},
        ${responsable_dependencia_nombre ?? null}, ${responsable_dependencia_puesto ?? null},
        ${responsable_programa_nombre ?? null}, ${responsable_programa_puesto ?? null},
        ${domicilio ?? null}, ${telefono ?? null}, ${email_contacto ?? null},
        ${tipo_programa ?? null}, true
      )
      RETURNING *
    `

    return NextResponse.json({ programa }, { status: 201 })
  } catch (error) {
    console.error("[admin/convocatorias/id/programas] POST:", error)
    return NextResponse.json({ error: "Error al crear programa" }, { status: 500 })
  }
}
