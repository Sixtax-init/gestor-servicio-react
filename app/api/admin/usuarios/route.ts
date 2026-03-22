import { type NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/session.server"
import { sql, pool } from "@/lib/db"
import { createUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const user = await requireRole(["main_admin", "administrador"])

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const tipo = searchParams.get("tipo")
  const page = Number(searchParams.get("page")) || 1
  const limit = Number(searchParams.get("limit")) || 10
  const search = searchParams.get("search") || ""
  const offset = (page - 1) * limit

  try {
    let whereClauses = "WHERE 1=1"
    const queryParams: any[] = []
    let paramCount = 1

    if (status === "active") {
      whereClauses += ` AND u.activo = true`
    } else if (status === "inactive") {
      whereClauses += ` AND u.activo = false`
    }

    if (tipo) {
      whereClauses += ` AND u.tipo_usuario = $${paramCount}`
      queryParams.push(tipo)
      paramCount++
    }

    if (search) {
      whereClauses += ` AND (u.matricula ILIKE $${paramCount} OR u.nombre ILIKE $${paramCount} OR u.apellidos ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`
      queryParams.push(`%${search}%`)
      paramCount++
    }

    if (user.tipo_usuario === "administrador") {
      whereClauses += ` AND u.departamento_id = $${paramCount}`
      queryParams.push(user.departamento_id || -1) // -1 ensures no records match if null
      paramCount++
    }

    const queryText = `
      SELECT u.id, u.matricula, u.nombre, u.apellidos, u.email, u.tipo_usuario, u.activo, u.created_at, u.departamento_id, d.nombre as departamento_nombre
      FROM usuarios u
      LEFT JOIN departamentos d ON u.departamento_id = d.id
      ${whereClauses}
      ORDER BY u.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `

    const countQueryText = `
      SELECT COUNT(*) as total 
      FROM usuarios u 
      LEFT JOIN departamentos d ON u.departamento_id = d.id
      ${whereClauses}
    `

    // Parámetros para la query de datos (incluye limit y offset)
    const dataParams = [...queryParams, limit, offset]
    // Parámetros para el count (solo filtros)
    const countParams = queryParams

    const [usuariosResult, countResult] = await Promise.all([
      pool.query(queryText, dataParams),
      pool.query(countQueryText, countParams)
    ])

    const usuarios = usuariosResult.rows
    const total = Number(countResult.rows[0].total)
    const pages = Math.ceil(total / limit)

    return NextResponse.json({ usuarios, total, pages })
  } catch (error) {
    console.error("[admin/usuarios] Error fetching:", error)
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await requireRole(["main_admin", "administrador"])

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { matricula, nombre, apellidos, email, password, tipo_usuario, departamento_id } = body

    if (!matricula || !nombre || !apellidos || !email || !password || !tipo_usuario) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    const newUser = await createUser({
      matricula,
      nombre,
      apellidos,
      email,
      password,
      tipo_usuario,
      // Si es admin local, forzar su propio departamento
      // Si es main_admin, usar el departamento proporcionado
      departamento_id: user.tipo_usuario === "administrador" ? user.departamento_id : departamento_id,
    })

    if (!newUser) {
      return NextResponse.json({ error: "Error al crear usuario. La matrícula o email ya existe." }, { status: 400 })
    }

    return NextResponse.json({ usuario: newUser }, { status: 201 })
  } catch (error) {
    console.error("[admin/usuarios] Error creating:", error)
    return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 })
  }
}
