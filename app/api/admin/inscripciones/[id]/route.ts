import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/session.server"
import { sql } from "@/lib/db"
import { sendOficioListoEmail } from "@/lib/email"

type Params = { params: Promise<{ id: string }> }

// Flow:
// 1. pendiente_oficio → oficio_enviado: admin registers numero_oficio;
//    oficio_url is auto-set to /carta-asignacion/{id} (generated on-demand)
// 2. oficio_enviado: student downloads carta, takes it to institution, uploads signed scan
//    (handled by /api/inscripcion/oficio-firmado → firmado_subido)
// 3. firmado_subido → confirmada: student becomes alumno
// 4. firmado_subido → rechazada_programa: solicitud deleted, student starts from scratch
const TRANSICIONES_VALIDAS: Record<string, string[]> = {
  pendiente_oficio:   ["oficio_enviado"],
  oficio_enviado:     [],
  firmado_subido:     ["confirmada", "rechazada_programa"],
  confirmada:         [],
  rechazada_programa: [],
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(["administrador", "main_admin"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const { id } = await params
    const inscripcionId = Number.parseInt(id)

    const [inscripcion] = await sql`
      SELECT ip.id, ip.estado, ip.solicitud_id, si.usuario_id,
             u.email, u.nombre, u.apellidos
      FROM inscripciones_programa ip
      JOIN solicitudes_inscripcion si ON si.id = ip.solicitud_id
      JOIN usuarios u                ON u.id  = si.usuario_id
      WHERE ip.id = ${inscripcionId}
    `
    if (!inscripcion) {
      return NextResponse.json({ error: "Inscripción no encontrada" }, { status: 404 })
    }

    const body = await request.json()
    const { estado, numero_oficio, fecha_inicio_actividades, fecha_fin_actividades } = body

    if (!estado) {
      return NextResponse.json({ error: "El campo 'estado' es requerido" }, { status: 400 })
    }
    if (!TRANSICIONES_VALIDAS[inscripcion.estado]?.includes(estado)) {
      return NextResponse.json(
        { error: `No se puede pasar de '${inscripcion.estado}' a '${estado}'` },
        { status: 422 }
      )
    }

    if (estado === "oficio_enviado" && !numero_oficio?.trim()) {
      return NextResponse.json({ error: "El número de oficio es requerido" }, { status: 400 })
    }
    if (estado === "confirmada" && !fecha_inicio_actividades) {
      return NextResponse.json({ error: "La fecha de inicio de actividades es requerida" }, { status: 400 })
    }

    // Rejected: delete entire solicitud (cascades to everything), student starts from scratch
    if (estado === "rechazada_programa") {
      await sql`DELETE FROM solicitudes_inscripcion WHERE id = ${inscripcion.solicitud_id}`
      return NextResponse.json({ deleted: true })
    }

    // When registering the oficio, auto-generate the carta URL (served as a print page)
    const oficio_url = estado === "oficio_enviado"
      ? `/carta-asignacion/${inscripcionId}`
      : null

    const [actualizada] = await sql`
      UPDATE inscripciones_programa SET
        estado                   = ${estado},
        numero_oficio            = COALESCE(${numero_oficio?.trim() ?? null}, numero_oficio),
        oficio_url               = COALESCE(${oficio_url}, oficio_url),
        fecha_inicio_actividades = COALESCE(${fecha_inicio_actividades ?? null}, fecha_inicio_actividades),
        fecha_fin_actividades    = COALESCE(${fecha_fin_actividades ?? null}, fecha_fin_actividades),
        confirmado_por           = CASE WHEN ${estado} = 'confirmada' THEN ${user.id} ELSE confirmado_por END,
        fecha_confirmacion       = CASE WHEN ${estado} = 'confirmada' THEN CURRENT_TIMESTAMP ELSE fecha_confirmacion END,
        updated_at               = CURRENT_TIMESTAMP
      WHERE id = ${inscripcionId}
      RETURNING *
    `

    if (estado === "confirmada") {
      await sql`
        UPDATE usuarios
        SET tipo_usuario = 'alumno', updated_at = CURRENT_TIMESTAMP
        WHERE id = ${inscripcion.usuario_id} AND tipo_usuario = 'pre_candidato'
      `
      await sql`
        UPDATE solicitudes_inscripcion
        SET estado = 'confirmada', updated_at = CURRENT_TIMESTAMP
        WHERE id = ${inscripcion.solicitud_id}
      `
    }

    if (estado === "oficio_enviado") {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
      const base = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
      sendOficioListoEmail({
        nombre: inscripcion.nombre,
        apellidos: inscripcion.apellidos,
        email: inscripcion.email,
        numero_oficio: numero_oficio.trim(),
        cartaUrl: `${appUrl}${base}/carta-asignacion/${inscripcionId}`,
      }).catch((err) => console.error("[email] oficio listo:", err))
    }

    return NextResponse.json({ inscripcion: actualizada })
  } catch (error) {
    console.error("[admin/inscripciones/id] PATCH:", error)
    return NextResponse.json({ error: "Error al actualizar la inscripción" }, { status: 500 })
  }
}
