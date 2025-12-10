import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/session.server"

// Obtener todos los cursos
// Obtener todos los cursos
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.tipo_usuario !== "administrador") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const result = await sql`
      SELECT 
        c.id,
        c.nombre_grupo,
        c.tipo,
        c.descripcion,
        c.activo,
        c.maestro_id,
        u.nombre || ' ' || u.apellidos AS maestro_nombre,
        COUNT(DISTINCT i.alumno_id) AS total_alumnos,
        ac.ruta_archivo AS archivo_adjunto,
        ac.nombre_archivo AS archivo_nombre
      FROM cursos c
      LEFT JOIN usuarios u ON c.maestro_id = u.id
      LEFT JOIN inscripciones i ON c.id = i.curso_id AND i.activo = true
      LEFT JOIN archivos_curso ac ON ac.curso_id = c.id
      GROUP BY c.id, u.nombre, u.apellidos, ac.ruta_archivo, ac.nombre_archivo
      ORDER BY c.created_at DESC
    `

    return NextResponse.json({ cursos: result })
  } catch (error) {
    console.error("[v0] Error fetching cursos:", error)
    return NextResponse.json({ error: "Error al obtener cursos" }, { status: 500 })
  }
}


// Crear nuevo curso
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.tipo_usuario !== "administrador") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { nombre_grupo, tipo, maestro_id, descripcion, archivo_adjunto, archivo_nombre } = body

    const result = await sql`
      INSERT INTO cursos (nombre_grupo, tipo, maestro_id, descripcion, archivo_adjunto, archivo_nombre, activo)
       VALUES (${nombre_grupo}, ${tipo}, ${maestro_id}, ${descripcion}, ${archivo_adjunto || null}, ${archivo_nombre || null}, true)
       RETURNING *`

    return NextResponse.json({ curso: result[0] })
  } catch (error) {
    console.error("[v0] Error creating curso:", error)
    return NextResponse.json({ error: "Error al crear curso" }, { status: 500 })
  }
}
