import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/session.server"
import { normalizarDepartamento, validarResponsableHoras, normalizarCarreras } from "@/lib/programas"
import { sql, withTransaction } from "@/lib/db"

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(["main_admin"])
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
    const user = await requireRole(["main_admin"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const { id } = await params
    const programaId = Number.parseInt(id)

    const [existente] = await sql`
      SELECT p.id, p.curso_id, c.estado AS estado_convocatoria
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
      maestro_id,
      activo,
    } = body

    if (!nombre?.trim()) {
      return NextResponse.json({ error: "El nombre del programa es requerido" }, { status: 400 })
    }
    if (!tipo_ubicacion || !["interno", "externo"].includes(tipo_ubicacion)) {
      return NextResponse.json({ error: "El tipo de ubicación debe ser 'interno' o 'externo'" }, { status: 400 })
    }

    // Mismo invariante que al crear: interno lleva departamento del Tec,
    // externo sólo el texto libre. Nunca los dos.
    const { departamentoId, departamentoExterno, error: errorDepto } = normalizarDepartamento(
      tipo_ubicacion,
      departamento_id,
      departamento_externo,
    )
    if (errorDepto) {
      return NextResponse.json({ error: errorDepto }, { status: 400 })
    }

    const { maestroId, error: errorMaestro } = await validarResponsableHoras(sql, maestro_id)
    if (errorMaestro) {
      return NextResponse.json({ error: errorMaestro }, { status: 400 })
    }

    const { carreras, error: errorCarreras } = await normalizarCarreras(sql, carreras_permitidas)
    if (errorCarreras) {
      return NextResponse.json({ error: errorCarreras }, { status: 400 })
    }

    const programa = await withTransaction(async (tx) => {
      // El curso sigue al programa: si cambia el nombre, el departamento o el
      // responsable, el curso de servicio social refleja lo mismo. Los programas
      // creados antes de este cambio no tienen curso, así que se les crea aquí.
      let cursoId = existente.curso_id
      if (cursoId) {
        await tx`
          UPDATE cursos
          SET nombre_grupo    = ${nombre.trim()},
              maestro_id      = ${maestroId},
              departamento_id = ${departamentoId},
              updated_at      = CURRENT_TIMESTAMP
          WHERE id = ${cursoId}
        `
      } else {
        const [cursoCreado] = await tx`
          INSERT INTO cursos (nombre_grupo, tipo, maestro_id, departamento_id, descripcion, activo)
          VALUES (
            ${nombre.trim()}, 'servicio_social', ${maestroId}, ${departamentoId},
            ${`Curso de servicio social del programa "${nombre.trim()}"`}, true
          )
          RETURNING id
        `
        cursoId = cursoCreado.id
      }

      const [actualizado] = await tx`
      UPDATE programas SET
        departamento_id                 = ${departamentoId},
        departamento_externo            = ${departamentoExterno},
        curso_id                        = ${cursoId},
        nombre                          = ${nombre.trim()},
        nombre_dependencia              = ${nombre_dependencia ?? null},
        descripcion                     = ${descripcion ?? null},
        objetivo                        = ${objetivo ?? null},
        tipo_ubicacion                  = ${tipo_ubicacion},
        actividades                     = ${actividades ?? null},
        carreras_permitidas             = ${carreras},
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
      return actualizado
    })

    return NextResponse.json({ programa })
  } catch (error) {
    console.error("[admin/programas/id] PUT:", error)
    return NextResponse.json({ error: "Error al actualizar programa" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(["main_admin"])
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
