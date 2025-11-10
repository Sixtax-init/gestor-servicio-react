// app/api/maestro/tareas/[id]/avances/route.ts
import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const session = await getSession()

    if (!session || session.tipo_usuario !== "maestro") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const tareaId = Number(id)

    // ✅ Verificar que la tarea pertenece al maestro
    const [tarea] = await sql`
      SELECT t.id 
      FROM tareas t
      INNER JOIN cursos c ON t.curso_id = c.id
      WHERE t.id = ${tareaId} AND c.maestro_id = ${session.id}
    `

    if (!tarea) {
      return NextResponse.json({ error: "Tarea no encontrada o no autorizada" }, { status: 404 })
    }

    // ✅ Obtener los avances asociados a la tarea
    const avances = await sql`
      SELECT 
        ea.id,
        ea.comentario,
        ea.archivo_url,
        ea.horas_asignadas,
        ea.estado,
        ea.fecha_entrega,
        ea.es_final,
        u.nombre,
        u.apellidos,
        u.matricula,
        u.email
      FROM entregas_avances ea
      INNER JOIN usuarios u ON ea.alumno_id = u.id
      WHERE ea.tarea_id = ${tareaId}
      ORDER BY ea.fecha_entrega DESC
    `

    return NextResponse.json(avances)
  } catch (error) {
    console.error("[maestro/avances] Error:", error)
    return NextResponse.json({ error: "Error al obtener avances" }, { status: 500 })
  }
}
