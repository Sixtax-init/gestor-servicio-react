import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/session.server"
import { sql } from "@/lib/db"
import { sendSolicitudAprobadaEmail, sendSolicitudRechazadaEmail } from "@/lib/email"

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(["main_admin"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const { id } = await params
    const solicitudId = Number.parseInt(id)

    const [solicitud] = await sql`
      SELECT s.id, s.estado, s.usuario_id, c.nombre AS convocatoria_nombre
      FROM solicitudes_inscripcion s
      JOIN convocatorias c ON c.id = s.convocatoria_id
      WHERE s.id = ${solicitudId}
    `
    if (!solicitud) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })
    }
    if (solicitud.estado !== "pendiente") {
      return NextResponse.json({ error: "Solo se pueden revisar solicitudes en estado pendiente" }, { status: 422 })
    }

    const body = await request.json()
    const { decision, motivo_rechazo } = body

    if (!["aprobada", "rechazada"].includes(decision)) {
      return NextResponse.json({ error: "La decisión debe ser 'aprobada' o 'rechazada'" }, { status: 400 })
    }
    if (decision === "rechazada" && !motivo_rechazo?.trim()) {
      return NextResponse.json({ error: "El motivo de rechazo es requerido" }, { status: 400 })
    }

    const [actualizada] = await sql`
      UPDATE solicitudes_inscripcion SET
        estado         = ${decision},
        motivo_rechazo = ${decision === "rechazada" ? motivo_rechazo.trim() : null},
        revisado_por   = ${user.id},
        fecha_revision = CURRENT_TIMESTAMP
      WHERE id = ${solicitudId}
      RETURNING *
    `

    const [usuario] = await sql`
      SELECT nombre, apellidos, email FROM usuarios WHERE id = ${solicitud.usuario_id}
    `
    if (usuario) {
      const emailData = {
        nombre: usuario.nombre,
        apellidos: usuario.apellidos,
        email: usuario.email,
        convocatoriaNombre: solicitud.convocatoria_nombre,
        motivo_rechazo: decision === "rechazada" ? motivo_rechazo.trim() : undefined,
      }
      const sendFn = decision === "aprobada" ? sendSolicitudAprobadaEmail : sendSolicitudRechazadaEmail
      sendFn(emailData).catch((err) =>
        console.error("[revisar] Error enviando email de notificación:", err)
      )
    }

    return NextResponse.json({ solicitud: actualizada })
  } catch (error) {
    console.error("[admin/solicitudes/id/revisar] PATCH:", error)
    return NextResponse.json({ error: "Error al revisar solicitud" }, { status: 500 })
  }
}
