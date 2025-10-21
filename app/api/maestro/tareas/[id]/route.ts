import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session || session.tipo_usuario !== "maestro") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const db = sql
    const tareaId = Number.parseInt(params.id)

    const [tarea] = await db`
      SELECT t.*, c.nombre_grupo as curso_nombre
      FROM tareas t
      INNER JOIN cursos c ON t.curso_id = c.id
      WHERE t.id = ${tareaId} AND c.maestro_id = ${session.id}
    `

    if (!tarea) {
      return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 })
    }

    return NextResponse.json(tarea)
  } catch (error) {
    console.error("Error al obtener tarea:", error)
    return NextResponse.json({ error: "Error al obtener tarea" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session || session.tipo_usuario !== "maestro") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const {
      titulo,
      descripcion,
      prioridad,
      fecha_vencimiento,
      asignacion_horas,
      limite_alumnos,
      archivo_instrucciones,
      activo,
    } = body
    const db = sql
    const tareaId = Number.parseInt(params.id)

    // Verificar que la tarea pertenece a un curso del maestro
    const [tareaExistente] = await db`
      SELECT t.id FROM tareas t
      INNER JOIN cursos c ON t.curso_id = c.id
      WHERE t.id = ${tareaId} AND c.maestro_id = ${session.id}
    `

    if (!tareaExistente) {
      return NextResponse.json({ error: "Tarea no encontrada o no autorizado" }, { status: 404 })
    }

    const [tarea] = await db`
      UPDATE tareas
      SET titulo = ${titulo},
          descripcion = ${descripcion},
          prioridad = ${prioridad},
          fecha_vencimiento = ${fecha_vencimiento},
          asignacion_horas = ${asignacion_horas || null},
          limite_alumnos = ${limite_alumnos || null},
          archivo_instrucciones = ${archivo_instrucciones || null},
          activo = ${activo !== undefined ? activo : true}
      WHERE id = ${tareaId}
      RETURNING *
    `

    return NextResponse.json(tarea)
  } catch (error) {
    console.error("Error al actualizar tarea:", error)
    return NextResponse.json({ error: "Error al actualizar tarea" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session || session.tipo_usuario !== "maestro") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const db = sql
    const tareaId = Number.parseInt(params.id)

    // Verificar que la tarea pertenece a un curso del maestro
    const [tareaExistente] = await db`
      SELECT t.id FROM tareas t
      INNER JOIN cursos c ON t.curso_id = c.id
      WHERE t.id = ${tareaId} AND c.maestro_id = ${session.id}
    `

    if (!tareaExistente) {
      return NextResponse.json({ error: "Tarea no encontrada o no autorizado" }, { status: 404 })
    }

    await db`DELETE FROM tareas WHERE id = ${tareaId}`

    return NextResponse.json({ message: "Tarea eliminada exitosamente" })
  } catch (error) {
    console.error("Error al eliminar tarea:", error)
    return NextResponse.json({ error: "Error al eliminar tarea" }, { status: 500 })
  }
}
