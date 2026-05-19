import { NextResponse } from "next/server"
import { requireRole } from "@/lib/session.server"
import { sql } from "@/lib/db"

const DOCS_REQUERIDOS = ["kardex", "horario", "solicitud_prestador", "fotografia"]

export async function PATCH() {
  try {
    const user = await requireRole(["pre_candidato"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const [solicitud] = await sql`
      SELECT s.id, s.estado, c.estado AS convocatoria_estado
      FROM solicitudes_inscripcion s
      JOIN convocatorias c ON c.id = s.convocatoria_id
      WHERE s.usuario_id = ${user.id}
      ORDER BY s.created_at DESC LIMIT 1
    `
    if (!solicitud) {
      return NextResponse.json({ error: "No tienes una solicitud registrada" }, { status: 404 })
    }
    if (!["borrador", "rechazada"].includes(solicitud.estado)) {
      return NextResponse.json(
        { error: "Tu solicitud ya fue enviada o no puede modificarse en este momento" },
        { status: 422 }
      )
    }
    if (solicitud.convocatoria_estado !== "activa") {
      return NextResponse.json(
        { error: "El período de registro de la convocatoria ya ha cerrado. No es posible enviar o reenviar solicitudes." },
        { status: 422 }
      )
    }

    // Verificar que estén los 4 documentos requeridos
    const docs = await sql`
      SELECT tipo_documento FROM documentos_solicitud
      WHERE solicitud_id = ${solicitud.id}
        AND tipo_documento = ANY(${DOCS_REQUERIDOS})
    `
    const tiposSubidos = docs.map((d: { tipo_documento: string }) => d.tipo_documento)
    const faltantes = DOCS_REQUERIDOS.filter((t) => !tiposSubidos.includes(t))

    if (faltantes.length > 0) {
      return NextResponse.json(
        { error: `Faltan los siguientes documentos: ${faltantes.join(", ")}` },
        { status: 422 }
      )
    }

    const [actualizada] = await sql`
      UPDATE solicitudes_inscripcion
      SET estado = 'pendiente', updated_at = CURRENT_TIMESTAMP
      WHERE id = ${solicitud.id}
      RETURNING *
    `

    return NextResponse.json({ solicitud: actualizada })
  } catch (error) {
    console.error("[inscripcion/solicitud/enviar] PATCH:", error)
    return NextResponse.json({ error: "Error al enviar la solicitud" }, { status: 500 })
  }
}
