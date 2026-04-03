import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireRole } from "@/lib/session.server"
import { sendTaskReviewedEmail } from "@/lib/email"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; entregaId: string }> },
) {
  try {
    const session = await requireRole(["maestro"])
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id, entregaId: entregaIdParam } = await params
    const tareaId = Number(id)
    const entregaId = Number(entregaIdParam)
    const { estado, comentario, calificacion } = await request.json()

    // ✅ Verificar que la entrega pertenece a una tarea del maestro
    const [entrega] = await sql`
      SELECT e.*, t.asignacion_horas, t.curso_id, c.maestro_id
      FROM entregas e
      INNER JOIN tareas t ON e.tarea_id = t.id
      INNER JOIN cursos c ON t.curso_id = c.id
      WHERE e.id = ${entregaId} AND t.id = ${tareaId} AND c.maestro_id = ${session.id}
    `

    if (!entrega) {
      return NextResponse.json({ error: "Entrega no encontrada o no autorizada" }, { status: 404 })
    }

    // 🛑 Validar que el alumno haya marcado un avance final
    const [finalAvance] = await sql`
      SELECT id
      FROM entregas_avances
      WHERE tarea_id = ${tareaId}
        AND alumno_id = ${entrega.alumno_id}
        AND es_final = true
    `

    if (!finalAvance) {
      return NextResponse.json(
        { error: "No se puede revisar la tarea: el alumno aún no ha marcado un avance final." },
        { status: 400 },
      )
    }

    // ✅ Actualizar la entrega con los nuevos datos
    const [actualizada] = await sql`
      UPDATE entregas
      SET estado = ${estado},
          comentario_revision = ${comentario},
          calificacion = ${calificacion},
          fecha_entrega = fecha_entrega, -- conservar fecha original
          fecha_revision = CURRENT_TIMESTAMP
      WHERE id = ${entregaId}
      RETURNING *
    `

    // ✅ Si fue aprobada, aumentar horas completadas al alumno
    if (estado === "aprobada" && entrega.asignacion_horas && entrega.asignacion_horas > 0) {
      // Buscar la inscripción del alumno en ese curso
      const [inscripcion] = await sql`
        SELECT id, horas_completadas
        FROM inscripciones
        WHERE alumno_id = ${entrega.alumno_id}
        AND curso_id = ${entrega.curso_id}
      `

      if (inscripcion) {
        const nuevasHoras = (inscripcion.horas_completadas || 0) + entrega.asignacion_horas

        await sql`
          UPDATE inscripciones
          SET horas_completadas = ${nuevasHoras}
          WHERE id = ${inscripcion.id}
        `
      }
    }

    // 📬 5. Notificar al alumno (Background)
    try {
      const [notifData] = await sql`
        SELECT 
          u.nombre as nombre_alumno, u.email as email_alumno,
          t.titulo as titulo_tarea
        FROM entregas e
        INNER JOIN usuarios u ON e.alumno_id = u.id
        INNER JOIN tareas t ON e.tarea_id = t.id
        WHERE e.id = ${entregaId}
      `
      if (notifData) {
        sendTaskReviewedEmail({
          nombreAlumno: notifData.nombre_alumno as string,
          tituloTarea: notifData.titulo_tarea as string,
          estado: estado as string,
          comentario: comentario as string,
          horasAsignadas: (estado === "aprobada" && entrega.asignacion_horas) ? Number(entrega.asignacion_horas) : undefined,
          emailAlumno: notifData.email_alumno as string
        }).catch(e => console.error("Error al enviar correo de revision final:", e))
      }
    } catch (err) {
      console.error("Error al preparar notificacion de revision final:", err)
    }

    return NextResponse.json({
      message: "Entrega revisada correctamente y horas actualizadas",
      entrega: actualizada,
    })
  } catch (error) {
    console.error("Error al revisar entrega:", error)
    return NextResponse.json({ error: "Error al revisar entrega" }, { status: 500 })
  }
}
