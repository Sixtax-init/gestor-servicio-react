import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/session.server"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(["pre_candidato", "alumno"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const body = await request.json()
    const { horario_id } = body

    if (!horario_id) {
      return NextResponse.json({ error: "horario_id es requerido" }, { status: 400 })
    }

    // Obtener solicitud del usuario en estado válido para seleccionar
    const [solicitud] = await sql`
      SELECT id, estado, convocatoria_id FROM solicitudes_inscripcion
      WHERE usuario_id = ${user.id}
      ORDER BY created_at DESC LIMIT 1
    `
    if (!solicitud) {
      return NextResponse.json({ error: "No tienes una solicitud registrada" }, { status: 404 })
    }
    if (!["aprobada", "en_seleccion"].includes(solicitud.estado)) {
      return NextResponse.json(
        { error: "Tu solicitud no está en estado válido para seleccionar programa" },
        { status: 422 }
      )
    }

    // Verificar que no haya seleccionado ya (definitivo)
    const [yaSeleccionado] = await sql`
      SELECT id FROM inscripciones_programa
      WHERE solicitud_id = ${solicitud.id} AND estado != 'rechazada_programa'
    `
    if (yaSeleccionado) {
      return NextResponse.json(
        { error: "Ya tienes un programa seleccionado. La selección es definitiva y no puede cambiarse." },
        { status: 409 }
      )
    }

    // Verificar turno activo
    const now = new Date()
    const [turno] = await sql`
      SELECT id, fecha_inicio, fecha_fin, estado
      FROM turnos
      WHERE solicitud_id = ${solicitud.id}
      ORDER BY created_at DESC LIMIT 1
    `
    if (!turno) {
      return NextResponse.json({ error: "No tienes un turno asignado aún" }, { status: 422 })
    }
    if (turno.estado === "usado") {
      return NextResponse.json(
        { error: "Tu turno ya fue utilizado. No puedes hacer otra selección." },
        { status: 409 }
      )
    }

    const turnoInicio = new Date(turno.fecha_inicio)
    const turnoFin   = new Date(turno.fecha_fin)

    if (now < turnoInicio) {
      return NextResponse.json(
        { error: `Tu turno aún no ha comenzado. Disponible desde: ${turnoInicio.toLocaleString("es-MX")}` },
        { status: 422 }
      )
    }
    if (now > turnoFin) {
      return NextResponse.json(
        { error: "Tu ventana de selección ha vencido. Contacta al departamento para asistencia." },
        { status: 422 }
      )
    }

    // Verificar cupo del horario con lock para evitar race condition
    const [horario] = await sql`
      SELECT
        h.id,
        h.plazas,
        h.programa_id,
        GREATEST(
          h.plazas - COUNT(ip.id) FILTER (WHERE ip.estado != 'rechazada_programa'),
          0
        ) AS cupo_disponible
      FROM horarios_programa h
      LEFT JOIN inscripciones_programa ip ON ip.horario_programa_id = h.id
      WHERE h.id = ${horario_id}
      GROUP BY h.id
    `
    if (!horario) {
      return NextResponse.json({ error: "Horario no encontrado" }, { status: 404 })
    }
    if (Number(horario.cupo_disponible) <= 0) {
      return NextResponse.json(
        { error: "No hay cupo disponible en este horario. Elige otro." },
        { status: 409 }
      )
    }

    // Punto autoritativo del filtro por carrera: el listado de programas ya
    // oculta los que no aplican, pero eso es sólo comodidad — aquí es donde el
    // alumno se queda con el programa, así que se comprueba en el servidor.
    const [restriccion] = await sql`
      SELECT
        p.nombre,
        p.carreras_permitidas,
        u.carrera_id,
        -- COALESCE porque si el alumno no tiene carrera, la comparación con
        -- ANY() da NULL y no false: sin esto la decisión quedaría indefinida.
        COALESCE(
          p.carreras_permitidas IS NULL
          OR cardinality(p.carreras_permitidas) = 0
          OR u.carrera_id = ANY(p.carreras_permitidas),
          false
        ) AS permitida
      FROM programas p
      CROSS JOIN usuarios u
      WHERE p.id = ${horario.programa_id} AND u.id = ${user.id}
    `
    if (restriccion && !restriccion.permitida) {
      const [nombres] = await sql`
        SELECT string_agg(c.nombre, ', ' ORDER BY c.nombre) AS lista
        FROM carreras c
        WHERE c.id = ANY(${restriccion.carreras_permitidas})
      `
      return NextResponse.json(
        {
          error: restriccion.carrera_id
            ? `El programa "${restriccion.nombre}" sólo admite: ${nombres?.lista ?? "otras carreras"}.`
            : "Tu cuenta no tiene una carrera asignada. Contacta a Servicio Social para corregirlo.",
        },
        { status: 422 }
      )
    }

    // Registrar selección + marcar turno como usado + actualizar solicitud
    const [inscripcion] = await sql`
      INSERT INTO inscripciones_programa (solicitud_id, convocatoria_id, horario_programa_id, estado)
      VALUES (${solicitud.id}, ${solicitud.convocatoria_id}, ${horario_id}, 'pendiente_oficio')
      RETURNING *
    `

    await sql`
      UPDATE turnos
      SET estado = 'usado'
      WHERE id = ${turno.id}
    `

    await sql`
      UPDATE solicitudes_inscripcion
      SET estado = 'programa_seleccionado', updated_at = CURRENT_TIMESTAMP
      WHERE id = ${solicitud.id}
    `

    // El alumno sigue como pre_candidato hasta que el admin procese el oficio
    // y confirme que la dependencia aceptó la carta de asignación.
    return NextResponse.json({ inscripcion }, { status: 201 })
  } catch (error) {
    console.error("[inscripcion/seleccionar] POST:", error)
    return NextResponse.json({ error: "Error al registrar la selección" }, { status: 500 })
  }
}
