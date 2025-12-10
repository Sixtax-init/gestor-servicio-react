import { type NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/session.server"
import { sql, pool } from "@/lib/db"
import { createUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const user = await requireRole(["administrador"])

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const tipo = searchParams.get("tipo") // Nuevo filtro
  const page = Number(searchParams.get("page")) || 1
  const limit = Number(searchParams.get("limit")) || 10
  const search = searchParams.get("search") || ""
  const offset = (page - 1) * limit

  try {
    // Construir query dinámicamente
    let queryText = `
      SELECT id, matricula, nombre, apellidos, email, tipo_usuario, activo, created_at
      FROM usuarios
      WHERE 1=1
    `
    const queryParams: any[] = []
    let paramCount = 1

    if (status === "active") {
      queryText += ` AND activo = true`
    } else if (status === "inactive") {
      queryText += ` AND activo = false`
    }

    if (tipo) {
      queryText += ` AND tipo_usuario = $${paramCount}`
      queryParams.push(tipo)
      paramCount++
    }

    if (search) {
      queryText += ` AND (matricula ILIKE $${paramCount} OR nombre ILIKE $${paramCount} OR apellidos ILIKE $${paramCount} OR email ILIKE $${paramCount})`
      queryParams.push(`%${search}%`)
      paramCount++
    }

    // Query para total (antes de agregar limit/offset)
    const countQueryText = `SELECT COUNT(*) as total FROM usuarios WHERE 1=1` + queryText.split("WHERE 1=1")[1]

    // Agregar ordenamiento y paginación
    queryText += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`
    queryParams.push(limit, offset)

    // Ejecutar queries usando pool directamente para soportar string dinámico

    const [usuariosResult, countResult] = await Promise.all([
      pool.query(queryText, queryParams),
      pool.query(countQueryText, queryParams.slice(0, paramCount - 1)) // Usar solo params de filtro para count
    ])

    const usuarios = usuariosResult.rows
    const total = Number(countResult.rows[0].total)
    const pages = Math.ceil(total / limit)

    return NextResponse.json({ usuarios, total, pages })
  } catch (error) {
    console.error("[v0] Error fetching usuarios:", error)
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await requireRole(["administrador"])

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { matricula, nombre, apellidos, email, password, tipo_usuario } = body

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
    })

    if (!newUser) {
      return NextResponse.json({ error: "Error al crear usuario. La matrícula o email ya existe." }, { status: 400 })
    }

    return NextResponse.json({ usuario: newUser }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating usuario:", error)
    return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 })
  }
}
