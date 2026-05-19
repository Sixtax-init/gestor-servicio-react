import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/session.server"
import { pool } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(["administrador", "main_admin"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const estado = searchParams.get("estado") ?? ""
    const convocatoria_id = searchParams.get("convocatoria_id") ?? ""
    const search = searchParams.get("search") ?? ""
    const page = Math.max(1, Number(searchParams.get("page")) || 1)
    const limit = Math.min(100, Number(searchParams.get("limit")) || 20)
    const offset = (page - 1) * limit

    const conditions: string[] = []
    const queryParams: unknown[] = []
    let p = 1

    // Borrador = no enviada aún, el admin no la ve
    conditions.push(`si.estado != 'borrador'`)

    if (estado) {
      conditions.push(`si.estado = $${p++}`)
      queryParams.push(estado)
    }
    if (convocatoria_id) {
      conditions.push(`si.convocatoria_id = $${p++}`)
      queryParams.push(Number(convocatoria_id))
    }
    if (search) {
      conditions.push(`(u.matricula ILIKE $${p} OR u.nombre ILIKE $${p} OR u.apellidos ILIKE $${p})`)
      queryParams.push(`%${search}%`)
      p++
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""

    const dataQuery = `
      SELECT
        si.id, si.estado, si.created_at, si.updated_at,
        si.motivo_rechazo, si.fecha_revision,
        si.semestre, si.periodo, si.horas_previas_acreditadas,
        u.id         AS usuario_id,
        u.matricula,
        u.nombre     AS alumno_nombre,
        u.apellidos  AS alumno_apellidos,
        u.email      AS alumno_email,
        u.carrera,
        c.nombre     AS convocatoria_nombre,
        c.id         AS convocatoria_id,
        rv.nombre    AS revisado_por_nombre,
        COUNT(d.id)  AS total_documentos,
        EXISTS (SELECT 1 FROM propuestas_programa pp WHERE pp.solicitud_id = si.id) AS tiene_propuesta,
        ip.estado AS inscripcion_estado
      FROM solicitudes_inscripcion si
      JOIN usuarios u         ON u.id = si.usuario_id
      JOIN convocatorias c    ON c.id = si.convocatoria_id
      LEFT JOIN usuarios rv   ON rv.id = si.revisado_por
      LEFT JOIN documentos_solicitud d ON d.solicitud_id = si.id
      LEFT JOIN inscripciones_programa ip ON ip.solicitud_id = si.id
      ${where}
      GROUP BY si.id, u.id, c.id, rv.nombre, ip.estado
      ORDER BY si.created_at DESC
      LIMIT $${p} OFFSET $${p + 1}
    `

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM solicitudes_inscripcion si
      JOIN usuarios u      ON u.id = si.usuario_id
      JOIN convocatorias c ON c.id = si.convocatoria_id
      ${where}
    `

    const [dataResult, countResult] = await Promise.all([
      pool.query(dataQuery, [...queryParams, limit, offset]),
      pool.query(countQuery, queryParams),
    ])

    const total = Number(countResult.rows[0].total)

    return NextResponse.json({
      solicitudes: dataResult.rows,
      total,
      pages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("[admin/solicitudes] GET:", error)
    return NextResponse.json({ error: "Error al obtener solicitudes" }, { status: 500 })
  }
}
