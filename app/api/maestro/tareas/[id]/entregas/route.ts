// app/api/maestro/tareas/[id]/entregas/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const session = await getSession()
    if (!session || session.tipo_usuario !== "maestro") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const tareaId = Number.parseInt(id)

    // Verificar que la tarea pertenece al maestro
    const [tarea] = await sql`
      SELECT t.id 
      FROM tareas t
      INNER JOIN cursos c ON t.curso_id = c.id
      WHERE t.id = ${tareaId} AND c.maestro_id = ${session.id}
    `
    if (!tarea) {
      return NextResponse.json({ error: "Tarea no encontrada o no autorizada" }, { status: 404 })
    }

    // Obtener entregas con información del alumno y, si existe, el archivo asociado
    const entregas = await sql`
      SELECT 
        e.id,
        e.fecha_entrega,
        e.estado,
        e.comentario,
        e.calificacion,
        a.ruta_archivo   AS archivo_ruta,
        a.nombre_archivo AS archivo_nombre,
        u.nombre,
        u.apellidos,
        u.matricula,
        u.email
      FROM entregas e
      INNER JOIN usuarios u ON e.alumno_id = u.id
      LEFT JOIN archivos a ON a.entrega_id = e.id
      WHERE e.tarea_id = ${tareaId}
      ORDER BY e.fecha_entrega DESC
    `

    return NextResponse.json(entregas)
  } catch (error) {
    console.error("Error al obtener entregas:", error)
    return NextResponse.json({ error: "Error al obtener entregas" }, { status: 500 })
  }
}
