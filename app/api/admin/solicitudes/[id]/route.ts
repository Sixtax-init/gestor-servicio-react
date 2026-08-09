import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/session.server"
import { sql } from "@/lib/db"

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(["main_admin"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const { id } = await params
    const solicitudId = Number.parseInt(id)

    const [solicitud] = await sql`
      SELECT
        si.*,
        u.matricula,
        u.nombre     AS alumno_nombre,
        u.apellidos  AS alumno_apellidos,
        u.email      AS alumno_email,
        u.carrera,
        u.sexo,
        u.telefono   AS alumno_telefono,
        u.domicilio  AS alumno_domicilio,
        c.nombre     AS convocatoria_nombre,
        c.estado     AS convocatoria_estado,
        rv.nombre    AS revisado_por_nombre
      FROM solicitudes_inscripcion si
      JOIN usuarios u         ON u.id = si.usuario_id
      JOIN convocatorias c    ON c.id = si.convocatoria_id
      LEFT JOIN usuarios rv   ON rv.id = si.revisado_por
      WHERE si.id = ${solicitudId}
    `
    if (!solicitud) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })
    }

    const documentos = await sql`
      SELECT id, tipo_documento, nombre_archivo, ruta_archivo, tipo_mime, tamano_bytes, uploaded_at
      FROM documentos_solicitud
      WHERE solicitud_id = ${solicitudId}
      ORDER BY uploaded_at ASC
    `

    const [propuesta] = await sql`
      SELECT * FROM propuestas_programa WHERE solicitud_id = ${solicitudId}
    `

    const [inscripcion] = await sql`
      SELECT
        ip.id,
        ip.estado             AS inscripcion_estado,
        ip.numero_oficio,
        ip.oficio_url,
        ip.oficio_firmado_url,
        ip.fecha_inicio_actividades,
        ip.fecha_fin_actividades,
        ip.fecha_confirmacion,
        p.nombre              AS programa_nombre,
        p.domicilio           AS programa_domicilio,
        d.nombre              AS departamento_nombre,
        hp.dias,
        hp.hora_inicio,
        hp.hora_fin
      FROM inscripciones_programa ip
      JOIN horarios_programa hp ON hp.id = ip.horario_programa_id
      JOIN programas p          ON p.id  = hp.programa_id
      LEFT JOIN departamentos d ON d.id  = p.departamento_id
      WHERE ip.solicitud_id = ${solicitudId}
      LIMIT 1
    `

    return NextResponse.json({ solicitud, documentos, propuesta: propuesta ?? null, inscripcion: inscripcion ?? null })
  } catch (error) {
    console.error("[admin/solicitudes/id] GET:", error)
    return NextResponse.json({ error: "Error al obtener solicitud" }, { status: 500 })
  }
}
