import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireRole } from "@/lib/session.server"
import { sendTaskReviewedEmail } from "@/lib/email"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ avanceId: string }> },
) {
  try {
    const session = await requireRole(["maestro"])
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { avanceId: avanceIdParam } = await params
    const avanceId = Number(avanceIdParam)
    const { comentario, horas_asignadas } = await request.json()

    // 1. Obtener datos del avance y verificar pertenencia al maestro
    const [avance] = await sql`
      SELECT ea.*, t.curso_id, c.maestro_id, e.id as entrega_id
      FROM entregas_avances ea
      INNER JOIN tareas t ON ea.tarea_id = t.id
      INNER JOIN cursos c ON t.curso_id = c.id
      INNER JOIN entregas e ON ea.entrega_id = e.id
      WHERE ea.id = ${avanceId} AND c.maestro_id = ${session.id}
    `

    if (!avance) {
      return NextResponse.json({ error: "Avance no encontrado o no autorizado" }, { status: 404 })
    }

    // 2. Actualizar el avance específico
    await sql`
      UPDATE entregas_avances
      SET estado = 'revisada',
          comentario_revision = ${comentario || avance.comentario_revision},
          horas_asignadas = ${horas_asignadas || 0}
      WHERE id = ${avanceId}
    `

    // 3. Actualizar la entrega principal a 'revisada'
    // Esto es CLAVE para que el alumno pueda enviar más avances
    await sql`
      UPDATE entregas
      SET estado = 'revisada'
      WHERE id = ${avance.entrega_id}
    `

    // 4. Si se asignaron horas, impactar en inscripciones
    if (horas_asignadas && horas_asignadas > 0) {
      const [inscripcion] = await sql`
        SELECT id, horas_completadas
        FROM inscripciones
        WHERE alumno_id = ${avance.alumno_id}
        AND curso_id = ${avance.curso_id}
      `

      if (inscripcion) {
        const nuevasHoras = (inscripcion.horas_completadas || 0) + Number(horas_asignadas)
        await sql`
          UPDATE inscripciones
          SET horas_completadas = ${nuevasHoras}
          WHERE id = ${inscripcion.id}
        `
      }
    }

    // 📬 5. Notificar al alumno
    try {
        const [notifData] = await sql`
            SELECT 
                u.nombre as nombre_alumno, u.email as email_alumno,
                t.titulo as titulo_tarea
            FROM entregas_avances ea
            INNER JOIN usuarios u ON ea.alumno_id = u.id
            INNER JOIN tareas t ON ea.tarea_id = t.id
            WHERE ea.id = ${avanceId}
        `
        if (notifData) {
            sendTaskReviewedEmail({
                nombreAlumno: notifData.nombre_alumno as string,
                tituloTarea: notifData.titulo_tarea as string,
                estado: 'revisada',
                comentario: comentario as string,
                horasAsignadas: horas_asignadas ? Number(horas_asignadas) : undefined,
                emailAlumno: notifData.email_alumno as string
            }).catch(e => console.error("Error al enviar correo de revision:", e))
        }
    } catch (err) {
        console.error("Error al preparar notificacion de revision:", err)
    }

    return NextResponse.json({
      message: "Avance revisado correctamente",
      success: true
    })
  } catch (error) {
    console.error("Error al revisar avance:", error)
    return NextResponse.json({ error: "Error al revisar avance" }, { status: 500 })
  }
}
