import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/session.server"
import path from "path"
import fs from "fs/promises"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.tipo_usuario !== "maestro") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const db = sql
    const tareas = await db`
      SELECT 
        t.*,
        c.nombre_grupo as curso_nombre,
        c.tipo as curso_tipo,
        COUNT(DISTINCT e.id) as total_entregas,
        COUNT(DISTINCT CASE WHEN e.estado = 'pendiente' THEN e.id END) as entregas_pendientes
      FROM tareas t
      INNER JOIN cursos c ON t.curso_id = c.id
      LEFT JOIN entregas e ON t.id = e.tarea_id
      WHERE c.maestro_id = ${session.id}
      GROUP BY t.id, c.nombre_grupo, c.tipo
      ORDER BY t.created_at DESC
    `

    return NextResponse.json(tareas)
  } catch (error) {
    console.error("Error al obtener tareas:", error)
    return NextResponse.json({ error: "Error al obtener tareas" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.tipo_usuario !== "maestro") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // 🧩 Procesar FormData en lugar de JSON
    const formData = await request.formData()
    const curso_id = formData.get("curso_id")
    const titulo = formData.get("titulo")
    const descripcion = formData.get("descripcion")
    const prioridad = formData.get("prioridad")
    const asignacion_horas = formData.get("asignacion_horas")
    const limite_alumnos = formData.get("limite_alumnos")
    const archivo = formData.get("archivo_instrucciones") as File | null

    let archivo_instrucciones = null

    // 📂 Guardar el archivo si se adjuntó
    if (archivo) {
      const uploadDir = path.join(process.cwd(), "public/uploads/curso")
      await fs.mkdir(uploadDir, { recursive: true })

      const filePath = path.join(uploadDir, archivo.name)
      const buffer = Buffer.from(await archivo.arrayBuffer())
      await fs.writeFile(filePath, buffer)

      // Ruta accesible desde el navegador
      archivo_instrucciones = `/uploads/curso/${archivo.name}`
    }

    const db = sql

    // 🧠 Verificar que el curso pertenece al maestro
    const curso = await db`
      SELECT id FROM cursos WHERE id = ${curso_id} AND maestro_id = ${session.id}
    `
    if (curso.length === 0) {
      return NextResponse.json({ error: "Curso no encontrado o no autorizado" }, { status: 404 })
    }

    // 🗄️ Guardar la tarea en la base de datos
    const [tarea] = await db`
      INSERT INTO tareas (
        curso_id,
        titulo,
        descripcion,
        prioridad,
        asignacion_horas,
        limite_alumnos,
        archivo_instrucciones
      ) VALUES (
        ${curso_id},
        ${titulo},
        ${descripcion},
        ${prioridad},
        ${asignacion_horas || null},
        ${limite_alumnos || null},
        ${archivo_instrucciones || null}
      )
      RETURNING *
    `

    return NextResponse.json(tarea, { status: 201 })
  } catch (error) {
    console.error("Error al crear tarea:", error)
    return NextResponse.json({ error: "Error al crear tarea" }, { status: 500 })
  }
}
