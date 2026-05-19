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

    const [programa] = await sql`
      SELECT
        p.*,
        d.nombre AS departamento_nombre,
        c.nombre AS convocatoria_nombre
      FROM programas p
      LEFT JOIN departamentos d   ON d.id = p.departamento_id
      LEFT JOIN convocatorias c   ON c.id = p.convocatoria_id
      WHERE p.id = ${programaId}
    `
    if (!programa) {
      return NextResponse.json({ error: "Programa no encontrado" }, { status: 404 })
    }

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

    return NextResponse.json({ programa, horarios })
  } catch (error) {
    console.error("[admin/programas/id] GET:", error)
    return NextResponse.json({ error: "Error al obtener programa" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(["administrador", "main_admin"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const { id } = await params
    const programaId = Number.parseInt(id)

    const [existente] = await sql`
      SELECT p.id, c.estado AS estado_convocatoria
      FROM programas p
      JOIN convocatorias c ON c.id = p.convocatoria_id
      WHERE p.id = ${programaId}
    `
    if (!existente) {
      return NextResponse.json({ error: "Programa no encontrado" }, { status: 404 })
    }
    if (existente.estado_convocatoria === "cerrada") {
      return NextResponse.json({ error: "No se puede editar un programa de una convocatoria cerrada" }, { status: 422 })
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
      activo,
    } = body

    if (!nombre?.trim()) {
      return NextResponse.json({ error: "El nombre del programa es requerido" }, { status: 400 })
    }

    const [programa] = await sql`
      UPDATE programas SET
        departamento_id                 = ${departamento_id ?? null},
        departamento_externo            = ${departamento_externo ?? null},
        curso_id                        = ${curso_id ?? null},
        nombre                          = ${nombre.trim()},
        nombre_dependencia              = ${nombre_dependencia ?? null},
        descripcion                     = ${descripcion ?? null},
        objetivo                        = ${objetivo ?? null},
        tipo_ubicacion                  = ${tipo_ubicacion},
        actividades                     = ${actividades ?? null},
        carreras_permitidas             = ${carreras_permitidas ?? null},
        requiere_constancia_laboral     = ${requiere_constancia_laboral ?? false},
        requisitos_adicionales          = ${requisitos_adicionales ?? null},
        responsable_dependencia_nombre  = ${responsable_dependencia_nombre ?? null},
        responsable_dependencia_puesto  = ${responsable_dependencia_puesto ?? null},
        responsable_programa_nombre     = ${responsable_programa_nombre ?? null},
        responsable_programa_puesto     = ${responsable_programa_puesto ?? null},
        domicilio                       = ${domicilio ?? null},
        telefono                        = ${telefono ?? null},
        email_contacto                  = ${email_contacto ?? null},
        tipo_programa                   = ${tipo_programa ?? null},
        activo                          = ${activo ?? true}
      WHERE id = ${programaId}
      RETURNING *
    `

    return NextResponse.json({ programa })
  } catch (error) {
    console.error("[admin/programas/id] PUT:", error)
    return NextResponse.json({ error: "Error al actualizar programa" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(["administrador", "main_admin"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const { id } = await params
    const programaId = Number.parseInt(id)

    const [existente] = await sql`
      SELECT p.id FROM programas p WHERE p.id = ${programaId}
    `
    if (!existente) {
      return NextResponse.json({ error: "Programa no encontrado" }, { status: 404 })
    }

    const [tieneInscripciones] = await sql`
      SELECT COUNT(ip.id) AS total
      FROM inscripciones_programa ip
      JOIN horarios_programa h ON h.id = ip.horario_programa_id
      WHERE h.programa_id = ${programaId}
        AND ip.estado != 'rechazada_programa'
    `
    if (Number(tieneInscripciones.total) > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar un programa con inscripciones activas" },
        { status: 422 }
      )
    }

    await sql`DELETE FROM programas WHERE id = ${programaId}`

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[admin/programas/id] DELETE:", error)
    return NextResponse.json({ error: "Error al eliminar programa" }, { status: 500 })
  }
}
