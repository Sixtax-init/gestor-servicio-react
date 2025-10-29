import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"

export async function PUT(request: NextRequest, { params }: { params: { id: string; entregaId: string } }) {
  try {
    const session = await getSession()
    if (!session || session.tipo_usuario !== "maestro") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const tareaId = Number(params.id)
    const entregaId = Number(params.entregaId)
    const { estado, comentario, calificacion } = await request.json()

    // Verificar que la entrega pertenece a una tarea del maestro
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

    // Actualizar la entrega con los nuevos datos
    const [actualizada] = await sql`
      UPDATE entregas
      SET estado = ${estado},
          comentario = ${comentario},
          calificacion = ${calificacion},
          fecha_entrega = fecha_entrega, -- se conserva la fecha original
          fecha_revision = CURRENT_TIMESTAMP
      WHERE id = ${entregaId}
      RETURNING *
    `

    // ✅ Si fue aprobada, aumentar horas acumuladas al alumno
    // ✅ Si fue aprobada, aumentar horas en la tabla de inscripciones
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


    return NextResponse.json({
      message: "Entrega revisada correctamente y horas actualizadas",
      entrega: actualizada,
    })
  } catch (error) {
    console.error("Error al revisar entrega:", error)
    return NextResponse.json({ error: "Error al revisar entrega" }, { status: 500 })
  }
}
