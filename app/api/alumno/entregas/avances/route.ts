import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"
import { toast } from "sonner";


export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.tipo_usuario !== "alumno") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const tareaId = Number(request.nextUrl.searchParams.get("tarea_id"));
    if (!tareaId) {
      return NextResponse.json([], { status: 200 });
    }

    const avances = await sql`
      SELECT 
        ea.id, 
        ea.comentario, 
        ea.archivo_url, 
        ea.estado, 
        ea.es_final, 
        ea.fecha_entrega,
        e.estado AS estado_entrega_principal
      FROM entregas_avances ea
      LEFT JOIN entregas e ON ea.tarea_id = e.tarea_id AND ea.alumno_id = e.alumno_id
      WHERE ea.tarea_id = ${tareaId} AND ea.alumno_id = ${session.id}
      ORDER BY ea.fecha_entrega DESC
    `;

    return NextResponse.json(avances, { status: 200 });
  } catch (error) {
    console.error("Error al obtener avances:", error);
    return NextResponse.json({ error: "Error al obtener avances" }, { status: 500 });
  }
}
// 🟢 Subir un avance (entrega parcial)
// 🟢 Subir un avance (entrega parcial)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.tipo_usuario !== "alumno") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { tarea_id, comentario, archivo_url } = body

    // Validar que el alumno esté inscrito
    const [valido] = await sql`
      SELECT i.id
      FROM inscripciones i
      INNER JOIN cursos c ON i.curso_id = c.id
      INNER JOIN tareas t ON c.id = t.curso_id
      WHERE t.id = ${tarea_id} AND i.alumno_id = ${session.id} AND i.activo = true
    `
    if (!valido) {
      return NextResponse.json({ error: "No estás inscrito en este curso" }, { status: 403 })
    }

    // 🔹 Buscar o crear la entrega principal
    const [entrega] = await sql`
      INSERT INTO entregas (tarea_id, alumno_id, estado)
      VALUES (${tarea_id}, ${session.id}, 'pendiente')
      ON CONFLICT (tarea_id, alumno_id)
      DO UPDATE SET fecha_entrega = CURRENT_TIMESTAMP
      RETURNING id
    `

    const [finalExistente] = await sql`
      SELECT ea.id FROM entregas_avances ea
      LEFT JOIN entregas e ON ea.tarea_id = e.tarea_id AND ea.alumno_id = e.alumno_id
      WHERE ea.tarea_id = ${tarea_id} AND ea.alumno_id = ${session.id} AND ea.es_final = true
      AND (e.estado IS NULL OR e.estado != 'rechazada')
    `
    if (finalExistente) {
      //Se avisa al usuario que ya no puede subir las entregas
      return NextResponse.json(
        { error: "Ya has marcado un avance final, no puedes subir más avances." },
        { status: 400 }
      )
    }
    // 🔹 Insertar el avance, ligándolo a esa entrega
    const [avance] = await sql`
      INSERT INTO entregas_avances (entrega_id, tarea_id, alumno_id, archivo_url, comentario)
      VALUES (${entrega.id}, ${tarea_id}, ${session.id}, ${archivo_url || null}, ${comentario})
      RETURNING *
    `

    return NextResponse.json(avance, { status: 201 })
  } catch (error) {
    console.error("Error al subir avance:", error)
    return NextResponse.json({ error: "Error al subir avance" }, { status: 500 })
  }
}


// 🟡 Marcar un avance como entrega final
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.tipo_usuario !== "alumno") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { avance_id } = body

    // Verificar que el avance pertenece al alumno
    const [avance] = await sql`
      SELECT tarea_id FROM entregas_avances WHERE id = ${avance_id} AND alumno_id = ${session.id}
    `
    if (!avance) {
      return NextResponse.json({ error: "Avance no encontrado o no pertenece al alumno" }, { status: 404 })
    }

    // Desmarcar otros avances como finales (solo uno puede ser final)
    await sql`
      UPDATE entregas_avances
      SET es_final = false
      WHERE alumno_id = ${session.id} AND tarea_id = ${avance.tarea_id}
    `

    // Marcar este avance como final
    await sql`
      UPDATE entregas_avances
      SET es_final = true
      WHERE id = ${avance_id}
    `

    // Crear o actualizar la entrega principal
    await sql`
      INSERT INTO entregas (tarea_id, alumno_id, comentario, estado, fecha_entrega)
      VALUES (${avance.tarea_id}, ${session.id}, 'Entrega final marcada desde avances', 'pendiente', CURRENT_TIMESTAMP)
      ON CONFLICT (tarea_id, alumno_id)
      DO UPDATE SET estado = 'pendiente', fecha_entrega = CURRENT_TIMESTAMP
    `

    return NextResponse.json({ message: "Entrega final marcada correctamente" })
  } catch (error) {
    console.error("Error al marcar avance como final:", error)
    return NextResponse.json({ error: "Error al marcar avance como final" }, { status: 500 })
  }
}
