import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/session"
import { sql } from "@/lib/db"
import { createUser } from "@/lib/auth"

export async function GET() {
  const user = await requireRole(["administrador"])

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const usuarios = await sql`
      SELECT id, matricula, nombre, apellidos, email, tipo_usuario, activo, created_at
      FROM usuarios
      ORDER BY created_at DESC
    `

    return NextResponse.json({ usuarios })
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
