import { NextResponse } from "next/server"
import { requireRole } from "@/lib/session.server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const user = await requireRole(["pre_candidato", "alumno", "administrador", "main_admin"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const [convocatoria] = await sql`
      SELECT id FROM convocatorias
      WHERE activo = true AND estado IN ('activa', 'en_seleccion', 'repechaje')
      ORDER BY created_at DESC LIMIT 1
    `
    if (!convocatoria) {
      return NextResponse.json({ programas: [], convocatoria_id: null })
    }

    // Carrera del solicitante: los programas que restringen carreras sólo se
    // le muestran si la suya está entre las permitidas. Antes carreras_permitidas
    // se devolvía como dato pero no filtraba nada, ni aquí ni al seleccionar.
    const [solicitante] = await sql`SELECT carrera_id FROM usuarios WHERE id = ${user.id}`
    const carreraId = solicitante?.carrera_id ?? null

    const programas = await sql`
      SELECT
        p.id,
        p.nombre,
        p.descripcion,
        p.objetivo,
        p.tipo_ubicacion,
        p.actividades,
        p.carreras_permitidas,
        p.requiere_constancia_laboral,
        p.requisitos_adicionales,
        p.responsable_programa_nombre,
        p.responsable_programa_puesto,
        p.domicilio,
        p.telefono,
        p.email_contacto,
        p.tipo_programa,
        d.nombre                                                              AS departamento_nombre,
        COALESCE(SUM(h.plazas), 0)                                           AS plazas_total,
        COALESCE(
          SUM(h.plazas) - COUNT(ip.id) FILTER (WHERE ip.estado != 'rechazada_programa'),
          0
        )                                                                     AS cupo_disponible,
        COUNT(DISTINCT h.id)                                                  AS total_horarios
      FROM programas p
      LEFT JOIN departamentos d           ON d.id = p.departamento_id
      LEFT JOIN horarios_programa h       ON h.programa_id = p.id
      LEFT JOIN inscripciones_programa ip ON ip.horario_programa_id = h.id
      WHERE p.convocatoria_id = ${convocatoria.id}
        AND p.activo = true
        AND (
          -- Sin restricción (NULL o vacío) = abierto a todas las carreras
          p.carreras_permitidas IS NULL
          OR cardinality(p.carreras_permitidas) = 0
          -- Al personal se le muestran todos, para poder revisarlos
          OR ${user.tipo_usuario} IN ('administrador', 'main_admin')
          OR ${carreraId}::int = ANY(p.carreras_permitidas)
        )
      GROUP BY p.id, d.nombre
      ORDER BY p.nombre ASC
    `

    return NextResponse.json({ programas, convocatoria_id: convocatoria.id })
  } catch (error) {
    console.error("[inscripcion/programas] GET:", error)
    return NextResponse.json({ error: "Error al obtener programas" }, { status: 500 })
  }
}
