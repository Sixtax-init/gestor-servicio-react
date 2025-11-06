import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireRole } from "@/lib/session"
import bcrypt from "bcryptjs"

// Actualizar usuario
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole(["administrador"])

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { matricula, nombre, apellidos, email, tipo_usuario, activo, password } = body

    let hashedPass = null
    if (password && password.trim() != "") {
      hashedPass = await bcrypt.hash(password, 10)
    }

    let result

    if (hashedPass) {
      result = await sql`
    UPDATE usuarios
      SET matricula = ${matricula},
          nombre = ${nombre},
          apellidos = ${apellidos},
          email = ${email},
          tipo_usuario = ${tipo_usuario},
          activo = ${activo},
          password_hash = ${hashedPass}
    WHERE id = ${id}
    RETURNING id, matricula, nombre, apellidos, email, tipo_usuario, activo`
    } else {
      result = await sql`
    UPDATE usuarios
      SET matricula = ${matricula},
          nombre = ${nombre},
          apellidos = ${apellidos},
          email = ${email},
          tipo_usuario = ${tipo_usuario},
          activo = ${activo}
    WHERE id = ${id}
    RETURNING id, matricula, nombre, apellidos, email, tipo_usuario, activo`
    }


    if (result.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ usuario: result[0] })
  } catch (error) {
    console.error("[v0] Error updating usuario:", error)
    return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 })
  }
}

// Desactivar usuario (borrado lógico)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole(["administrador"])

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = params

    const result = await sql`
      UPDATE usuarios SET activo = false WHERE id = ${id} RETURNING id`

    if (result.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting usuario:", error)
    return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 })
  }
}
