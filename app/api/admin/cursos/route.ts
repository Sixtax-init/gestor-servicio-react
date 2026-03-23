import { type NextRequest, NextResponse } from "next/server"
import { sql, pool } from "@/lib/db"
import { requireRole } from "@/lib/session.server"

// Obtener cursos con paginación y búsqueda
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(["main_admin", "administrador"])
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get("page")) || 1)
    const limit = Math.min(20, Number(searchParams.get("limit")) || 10)
    const search = searchParams.get("search") || ""
    const offset = (page - 1) * limit

    const params: unknown[] = []
    let paramIdx = 1

    const deptFilter = user.tipo_usuario === "administrador"
      ? `AND c.departamento_id = $${paramIdx++}`
      : ""
    if (user.tipo_usuario === "administrador") params.push(user.departamento_id || -1)

    const searchFilter = search
      ? `AND (c.nombre_grupo ILIKE $${paramIdx} OR u.nombre ILIKE $${paramIdx} OR u.apellidos ILIKE $${paramIdx})`
      : ""
    if (search) { params.push(`%${search}%`); paramIdx++ }

    const dataParams = [...params, limit, offset]
    const countParams = [...params]

    const baseQuery = `
      FROM cursos c
      LEFT JOIN departamentos d ON c.departamento_id = d.id
      LEFT JOIN usuarios u ON c.maestro_id = u.id
      LEFT JOIN inscripciones i ON c.id = i.curso_id AND i.activo = true
      LEFT JOIN archivos_curso ac ON ac.curso_id = c.id
      WHERE 1=1 ${deptFilter} ${searchFilter}
    `

    const [cursosResult, countResult] = await Promise.all([
      pool.query(
        `SELECT c.id, c.nombre_grupo, c.tipo, c.descripcion, c.activo, c.maestro_id, c.departamento_id,
                d.nombre as departamento_nombre,
                u.nombre || ' ' || u.apellidos AS maestro_nombre,
                COUNT(DISTINCT i.alumno_id) AS total_alumnos,
                ac.ruta_archivo AS archivo_adjunto, ac.nombre_archivo AS archivo_nombre
         ${baseQuery}
         GROUP BY c.id, d.nombre, u.nombre, u.apellidos, ac.ruta_archivo, ac.nombre_archivo
         ORDER BY c.created_at DESC
         LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        dataParams
      ),
      pool.query(`SELECT COUNT(DISTINCT c.id) as total ${baseQuery}`, countParams),
    ])

    const total = Number(countResult.rows[0].total)
    return NextResponse.json({
      cursos: cursosResult.rows,
      total,
      pages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("[admin/cursos] Error fetching:", error)
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
    console.error("[admin/cursos] Error creating:", error)
    return NextResponse.json({ error: "Error al crear curso" }, { status: 500 })
  }
}
