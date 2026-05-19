import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const [convocatoria] = await sql`
      SELECT id, nombre, estado,
             fecha_inicio_registro, fecha_fin_registro,
             fecha_platica, fecha_inicio_seleccion, fecha_fin_seleccion
      FROM convocatorias
      WHERE activo = true AND estado IN ('activa', 'en_seleccion', 'repechaje')
      ORDER BY created_at DESC LIMIT 1
    `

    if (!convocatoria) {
      return NextResponse.json({ programas: [], convocatoria: null })
    }

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
        p.nombre_dependencia,
        p.responsable_programa_nombre,
        p.responsable_programa_puesto,
        p.domicilio,
        p.telefono,
        p.email_contacto,
        p.tipo_programa,
        d.nombre                                                                  AS departamento_nombre,
        COALESCE(SUM(h.plazas), 0)                                               AS plazas_total,
        GREATEST(
          COALESCE(SUM(h.plazas), 0) - COUNT(ip.id) FILTER (WHERE ip.estado != 'rechazada_programa'),
          0
        )                                                                         AS cupo_disponible,
        COUNT(DISTINCT h.id)                                                      AS total_horarios
      FROM programas p
      LEFT JOIN departamentos d           ON d.id = p.departamento_id
      LEFT JOIN horarios_programa h       ON h.programa_id = p.id
      LEFT JOIN inscripciones_programa ip ON ip.horario_programa_id = h.id
      WHERE p.convocatoria_id = ${convocatoria.id} AND p.activo = true
      GROUP BY p.id, d.nombre
      ORDER BY cupo_disponible DESC, p.nombre ASC
    `

    return NextResponse.json({ programas, convocatoria })
  } catch (error) {
    console.error("[public/programas] GET:", error)
    return NextResponse.json({ error: "Error al obtener programas" }, { status: 500 })
  }
}
