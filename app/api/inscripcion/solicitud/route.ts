import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/session.server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const user = await requireRole(["pre_candidato", "alumno"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const [solicitud] = await sql`
      SELECT
        si.*,
        c.nombre  AS convocatoria_nombre,
        c.estado  AS convocatoria_estado,
        c.fecha_platica,
        c.fecha_inicio_seleccion,
        c.fecha_fin_seleccion
      FROM solicitudes_inscripcion si
      JOIN convocatorias c ON c.id = si.convocatoria_id
      WHERE si.usuario_id = ${user.id}
      ORDER BY si.created_at DESC
      LIMIT 1
    `

    if (!solicitud) {
      return NextResponse.json({ solicitud: null })
    }

    const documentos = await sql`
      SELECT id, tipo_documento, nombre_archivo, ruta_archivo, tipo_mime, tamano_bytes, uploaded_at
      FROM documentos_solicitud
      WHERE solicitud_id = ${solicitud.id}
      ORDER BY uploaded_at ASC
    `

    const turnoRows = await sql`
      SELECT id, numero_turno, tipo, fecha_inicio, fecha_fin, estado
      FROM turnos
      WHERE solicitud_id = ${solicitud.id}
      ORDER BY created_at DESC LIMIT 1
    `

    const seleccionRows = await sql`
      SELECT
        ip.id                 AS inscripcion_id,
        ip.estado             AS inscripcion_estado,
        ip.oficio_url,
        ip.oficio_firmado_url,
        p.nombre              AS programa_nombre,
        p.descripcion         AS programa_descripcion,
        p.domicilio           AS programa_domicilio,
        p.telefono            AS programa_telefono,
        p.email_contacto,
        p.tipo_ubicacion,
        p.responsable_programa_nombre,
        d.nombre              AS departamento_nombre,
        h.dias,
        h.hora_inicio,
        h.hora_fin
      FROM inscripciones_programa ip
      JOIN horarios_programa h ON h.id = ip.horario_programa_id
      JOIN programas p         ON p.id = h.programa_id
      LEFT JOIN departamentos d ON d.id = p.departamento_id
      WHERE ip.solicitud_id = ${solicitud.id}
        AND ip.estado != 'rechazada_programa'
      LIMIT 1
    `

    return NextResponse.json({
      solicitud,
      documentos,
      turno:     turnoRows[0]     ?? null,
      seleccion: seleccionRows[0] ?? null,
    })
  } catch (error) {
    console.error("[inscripcion/solicitud] GET:", error)
    return NextResponse.json({ error: "Error al obtener solicitud" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(["pre_candidato", "alumno"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    // Verificar que no tenga ya una solicitud activa
    const [existente] = await sql`
      SELECT id FROM solicitudes_inscripcion WHERE usuario_id = ${user.id}
    `
    if (existente) {
      return NextResponse.json({ error: "Ya tienes una solicitud registrada" }, { status: 409 })
    }

    // Obtener convocatoria activa
    const [convocatoria] = await sql`
      SELECT id FROM convocatorias
      WHERE activo = true AND estado = 'activa'
      ORDER BY created_at DESC LIMIT 1
    `
    if (!convocatoria) {
      return NextResponse.json({ error: "No hay una convocatoria activa en este momento" }, { status: 422 })
    }

    const body = await request.json()
    const { semestre, periodo, horas_previas_acreditadas } = body

    const [solicitud] = await sql`
      INSERT INTO solicitudes_inscripcion (
        usuario_id, convocatoria_id, estado,
        semestre, periodo, horas_previas_acreditadas
      ) VALUES (
        ${user.id}, ${convocatoria.id}, 'borrador',
        ${semestre ?? null}, ${periodo ?? null}, ${Number(horas_previas_acreditadas) || 0}
      )
      RETURNING *
    `

    return NextResponse.json({ solicitud }, { status: 201 })
  } catch (error) {
    console.error("[inscripcion/solicitud] POST:", error)
    return NextResponse.json({ error: "Error al crear solicitud" }, { status: 500 })
  }
}
