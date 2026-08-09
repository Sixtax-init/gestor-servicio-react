import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/session.server"
import { sql } from "@/lib/db"

type Params = { params: Promise<{ inscripcionId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    // La carta lleva datos personales del alumno: sólo él mismo y main_admin.
    // El administrador no gestiona servicio social (ver PRODUCCION.md / roles).
    const user = await requireRole(["main_admin", "pre_candidato", "alumno"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const { inscripcionId } = await params

    const [row] = await sql`
      SELECT
        ip.id,
        ip.numero_oficio,
        u.nombre,
        u.apellidos,
        u.matricula,
        u.carrera,
        si.horas_previas_acreditadas,
        si.usuario_id,
        p.nombre              AS programa_nombre,
        p.telefono            AS dependencia_telefono,
        p.nombre_dependencia,
        p.responsable_dependencia_nombre,
        p.responsable_dependencia_puesto,
        COALESCE(d.nombre, p.departamento_externo) AS departamento_nombre,
        h.dias,
        h.hora_inicio,
        h.hora_fin
      FROM inscripciones_programa ip
      JOIN solicitudes_inscripcion si ON si.id = ip.solicitud_id
      JOIN usuarios u                ON u.id  = si.usuario_id
      JOIN horarios_programa h       ON h.id  = ip.horario_programa_id
      JOIN programas p               ON p.id  = h.programa_id
      LEFT JOIN departamentos d      ON d.id  = p.departamento_id
      WHERE ip.id = ${Number(inscripcionId)}
    `

    if (!row) return NextResponse.json({ error: "Carta no encontrada" }, { status: 404 })

    if (user.tipo_usuario !== "main_admin" && row.usuario_id !== user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { usuario_id, ...carta } = row
    return NextResponse.json({ carta })
  } catch (error) {
    console.error("[inscripcion/carta-asignacion/id] GET:", error)
    return NextResponse.json({ error: "Error al obtener la carta" }, { status: 500 })
  }
}
