import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.tipo_usuario !== "alumno") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { tarea_id, comentario, archivo_entrega } = body

    // Verificar que el alumno está inscrito en el curso de la tarea
    const [verificacion] = await sql`
      SELECT t.id, t.asignacion_horas
      FROM tareas t
      INNER JOIN cursos c ON t.curso_id = c.id
      INNER JOIN inscripciones i ON c.id = i.curso_id
      WHERE t.id = ${tarea_id} AND i.alumno_id = ${session.id} AND i.activo = true
    `

    if (!verificacion) {
      return NextResponse.json({ error: "No estás inscrito en este curso" }, { status: 403 })
    }

    // 🔹 Verificar si ya existe un avance final (no rechazado)
    const [avanceFinalExistente] = await sql`
      SELECT ea.id 
      FROM entregas_avances ea
      LEFT JOIN entregas e ON ea.tarea_id = e.tarea_id AND ea.alumno_id = e.alumno_id
      WHERE ea.tarea_id = ${tarea_id} 
        AND ea.alumno_id = ${session.id} 
        AND ea.es_final = true
        AND (e.estado IS NULL OR e.estado != 'rechazada')
    `

    if (avanceFinalExistente) {
      return NextResponse.json(
        { error: "Ya has marcado un avance como final. No puedes enviar otra entrega directa." },
        { status: 400 }
      )
    }

    // Verificar si ya existe una entrega
    const [entregaExistente] = await sql`
      SELECT id FROM entregas WHERE tarea_id = ${tarea_id} AND alumno_id = ${session.id}
    `

    let entrega
    if (entregaExistente) {
      // Actualizar entrega existente
      ;[entrega] = await sql`
        UPDATE entregas
        SET comentario = ${comentario},
            fecha_entrega = CURRENT_TIMESTAMP,
            estado = 'pendiente'
        WHERE id = ${entregaExistente.id}
        RETURNING *
      `
    } else {
      // Crear nueva entrega
      ;[entrega] = await sql`
        INSERT INTO entregas (tarea_id, alumno_id, comentario, horas_registradas)
        VALUES (${tarea_id}, ${session.id}, ${comentario}, ${verificacion.asignacion_horas || 0})
        RETURNING *
      `
    }

    // Si hay archivo, guardarlo en la tabla de archivos
    if (archivo_entrega) {
      await sql`
        INSERT INTO archivos (entrega_id, nombre_archivo, ruta_archivo, tipo_mime)
        VALUES (${entrega.id}, ${archivo_entrega.nombre}, ${archivo_entrega.ruta}, ${archivo_entrega.tipo})
      `
    }

    // 🔹 Crear automáticamente un avance marcado como final
    // Verificar si ya existe un avance para esta entrega
    const [avanceExistente] = await sql`
      SELECT id FROM entregas_avances 
      WHERE entrega_id = ${entrega.id} AND tarea_id = ${tarea_id} AND alumno_id = ${session.id}
    `

    if (avanceExistente) {
      // Actualizar el avance existente
      await sql`
        UPDATE entregas_avances
        SET es_final = true, comentario = 'Entrega directa', estado = 'pendiente'
        WHERE id = ${avanceExistente.id}
      `
    } else {
      // Crear nuevo avance marcado como final
      await sql`
        INSERT INTO entregas_avances (entrega_id, tarea_id, alumno_id, es_final, comentario, estado)
        VALUES (${entrega.id}, ${tarea_id}, ${session.id}, true, 'Entrega directa', 'pendiente')
      `
    }

    return NextResponse.json(entrega, { status: 201 })
  } catch (error) {
    console.error("Error al crear entrega:", error)
    return NextResponse.json({ error: "Error al crear entrega" }, { status: 500 })
  }
}
