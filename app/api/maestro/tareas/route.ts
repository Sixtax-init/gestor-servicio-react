import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireRole } from "@/lib/session.server"
import { sendNewTaskEmailsBulk } from "@/lib/email"
import { saveFile, hasBlockedExtension } from "@/lib/file-upload"

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
]
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(["maestro"])
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
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
    const session = await requireRole(["maestro"])
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
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

    const db = sql

    // 🧠 Verificar que el curso pertenece al maestro ANTES de escribir nada en disco
    const curso = await db`
      SELECT id, nombre_grupo FROM cursos WHERE id = ${Number(curso_id)} AND maestro_id = ${session.id}
    `
    if (curso.length === 0) {
      return NextResponse.json({ error: "Curso no encontrado o no autorizado" }, { status: 404 })
    }

    let archivo_instrucciones = null

    // 📂 Guardar el archivo si se adjuntó — vía saveFile, que sanea el nombre,
    // valida el tipo y escribe fuera de public/.
    if (archivo && archivo.size > 0) {
      if (archivo.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: "El archivo excede el tamaño máximo de 10 MB" }, { status: 400 })
      }
      if (!ALLOWED_MIME_TYPES.includes(archivo.type) || hasBlockedExtension(archivo.name)) {
        return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 })
      }

      archivo_instrucciones = await saveFile(archivo, Number(curso_id), "instrucciones")
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

    // 📬 4. Notificar a los alumnos (proceso asíncrono no bloqueante)
    try {
      const inscritos = await db`
        SELECT u.email 
        FROM inscripciones i
        INNER JOIN usuarios u ON i.alumno_id = u.id
        WHERE i.curso_id = ${curso_id} AND i.activo = true AND u.activo = true
      `
      const emails = inscritos.map((ins: { email: string }) => ins.email)
      
      if (emails.length > 0) {
        // Ejecución "background" simulada
        sendNewTaskEmailsBulk(emails, {
          titulo: titulo as string,
          descripcion: descripcion as string,
          cursoNombre: curso[0].nombre_grupo as string,
          prioridad: prioridad as string
        }).catch(err => console.error("Error bulk email:", err))
      }
    } catch (err) {
      console.error("Error al preparar correos de nueva tarea:", err)
    }

    return NextResponse.json(tarea, { status: 201 })
  } catch (error) {
    console.error("Error al crear tarea:", error)
    return NextResponse.json({ error: "Error al crear tarea" }, { status: 500 })
  }
}
