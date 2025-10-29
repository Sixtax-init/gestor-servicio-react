import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.tipo_usuario !== "alumno") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // ✅ Leer el parámetro curso_id de la URL
    const { searchParams } = new URL(request.url)
    const cursoId = searchParams.get("curso_id")

    if (!cursoId) {
      return NextResponse.json({ error: "Falta el parámetro curso_id" }, { status: 400 })
    }

    // ✅ Consultar solo las tareas de ese curso
    const tareas = await sql`
      SELECT 
        t.id,
        t.titulo,
        t.descripcion,
        t.fecha_vencimiento,
        t.prioridad,
        t.asignacion_horas,
        c.nombre_grupo AS curso_nombre,
        c.tipo AS curso_tipo,
        e.id AS entrega_id,
        e.estado AS entrega_estado,
        e.fecha_entrega,
        e.calificacion,
        e.comentario AS comentario_maestro
      FROM tareas t
      INNER JOIN cursos c ON t.curso_id = c.id
      INNER JOIN inscripciones i ON c.id = i.curso_id
      LEFT JOIN entregas e ON t.id = e.tarea_id AND e.alumno_id = ${session.id}
      WHERE i.alumno_id = ${session.id} 
        AND i.activo = true 
        AND t.activo = true
        AND t.curso_id = ${cursoId}  -- 👈 Filtra por curso
      ORDER BY t.fecha_vencimiento ASC
    `

    return NextResponse.json(tareas)
  } catch (error) {
    console.error("Error al obtener tareas:", error)
    return NextResponse.json({ error: "Error al obtener tareas" }, { status: 500 })
  }
}
