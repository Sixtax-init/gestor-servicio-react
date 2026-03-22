import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireRole } from "@/lib/session.server"

// Obtener todos los cursos
export async function GET() {
  try {
    const user = await requireRole(["main_admin", "administrador"])
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    let result
    if (user.tipo_usuario === "main_admin") {
      result = await sql`
        SELECT 
          c.id,
          c.nombre_grupo,
          c.tipo,
          c.descripcion,
          c.activo,
          c.maestro_id,
          c.departamento_id,
          d.nombre as departamento_nombre,
          u.nombre || ' ' || u.apellidos AS maestro_nombre,
          COUNT(DISTINCT i.alumno_id) AS total_alumnos,
          ac.ruta_archivo AS archivo_adjunto,
          ac.nombre_archivo AS archivo_nombre
        FROM cursos c
        LEFT JOIN departamentos d ON c.departamento_id = d.id
        LEFT JOIN usuarios u ON c.maestro_id = u.id
        LEFT JOIN inscripciones i ON c.id = i.curso_id AND i.activo = true
        LEFT JOIN archivos_curso ac ON ac.curso_id = c.id
        GROUP BY c.id, d.nombre, u.nombre, u.apellidos, ac.ruta_archivo, ac.nombre_archivo
        ORDER BY c.created_at DESC
      `
    } else {
      const deptId = user.departamento_id || -1
      result = await sql`
        SELECT 
          c.id,
          c.nombre_grupo,
          c.tipo,
          c.descripcion,
          c.activo,
          c.maestro_id,
          d.nombre as departamento_nombre,
          u.nombre || ' ' || u.apellidos AS maestro_nombre,
          COUNT(DISTINCT i.alumno_id) AS total_alumnos,
          ac.ruta_archivo AS archivo_adjunto,
          ac.nombre_archivo AS archivo_nombre
        FROM cursos c
        LEFT JOIN departamentos d ON c.departamento_id = d.id
        LEFT JOIN usuarios u ON c.maestro_id = u.id
        LEFT JOIN inscripciones i ON c.id = i.curso_id AND i.activo = true
        LEFT JOIN archivos_curso ac ON ac.curso_id = c.id
        WHERE c.departamento_id = ${deptId}
        GROUP BY c.id, d.nombre, u.nombre, u.apellidos, ac.ruta_archivo, ac.nombre_archivo
        ORDER BY c.created_at DESC
      `
    }

    return NextResponse.json({ cursos: result })
  } catch (error) {
    console.error("[v0] Error fetching cursos:", error)
    return NextResponse.json({ error: "Error al obtener cursos" }, { status: 500 })
  }
}

// Crear nuevo curso
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(["main_admin", "administrador"])
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await request.json()
    const {
      nombre_grupo,
      tipo,
      maestro_id,
      descripcion,
      archivo_adjunto,
      archivo_nombre,
      departamento_id
    } = body

    // Si es administrador local, forzar su propio departamento
    const finalDepartamentoId = user.tipo_usuario === "administrador"
      ? user.departamento_id
      : departamento_id

    const result = await sql`
      INSERT INTO cursos (
        nombre_grupo, 
        tipo, 
        maestro_id, 
        departamento_id, 
        descripcion, 
        archivo_adjunto, 
        archivo_nombre, 
        activo
      )
      VALUES (
        ${nombre_grupo}, 
        ${tipo}, 
        ${maestro_id}, 
        ${finalDepartamentoId}, 
        ${descripcion}, 
        ${archivo_adjunto || null}, 
        ${archivo_nombre || null}, 
        true
      )
      RETURNING *
    `

    return NextResponse.json({ curso: result[0] })
  } catch (error) {
    console.error("[v0] Error creating curso:", error)
    return NextResponse.json({ error: "Error al crear curso" }, { status: 500 })
  }
}
