import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.tipo_usuario !== "alumno") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const db = sql

    // Obtener tareas de los cursos en los que está inscrito el alumno
    const tareas = await db`
      SELECT 
        t.*,
        c.nombre_grupo as curso_nombre,
        c.tipo as curso_tipo,
        e.id as entrega_id,
        e.estado as entrega_estado,
        e.fecha_entrega,
        e.calificacion,
        e.comentario as comentario_maestro
      FROM tareas t
      INNER JOIN cursos c ON t.curso_id = c.id
      INNER JOIN inscripciones i ON c.id = i.curso_id
      LEFT JOIN entregas e ON t.id = e.tarea_id AND e.alumno_id = ${session.id}
      WHERE i.alumno_id = ${session.id} AND i.activo = true AND t.activo = true
      ORDER BY t.fecha_vencimiento ASC
    `

    return NextResponse.json(tareas)
  } catch (error) {
    console.error("Error al obtener tareas:", error)
    return NextResponse.json({ error: "Error al obtener tareas" }, { status: 500 })
  }
}