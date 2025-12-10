import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession, requireRole } from "@/lib/session.server"
import bcrypt from "bcryptjs"

// Actualizar usuario
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole(["administrador"])

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
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

// Desactivar usuario (borrado lógico) o Eliminar permanentemente (si ya está inactivo)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireRole(["administrador"])

    if (!admin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const userId = Number(id)

    // 1. Verificar estado actual del usuario
    const [usuario] = await sql`SELECT activo, tipo_usuario FROM usuarios WHERE id = ${userId}`

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    if (usuario.activo) {
      // 🟢 Si está activo -> Soft Delete (Desactivar)
      await sql`UPDATE usuarios SET activo = false WHERE id = ${userId}`
      return NextResponse.json({ message: "Usuario desactivado exitosamente" })
    } else {
      // 🔴 Si ya está inactivo -> Hard Delete (Borrado permanente)

      // Eliminar datos relacionados (Cascada manual)

      // 1. Archivos de entregas
      await sql`
        DELETE FROM archivos 
        WHERE entrega_id IN (SELECT id FROM entregas WHERE alumno_id = ${userId})
      `

      // 2. Avances de entregas
      await sql`DELETE FROM entregas_avances WHERE alumno_id = ${userId}`

      // 3. Entregas
      await sql`DELETE FROM entregas WHERE alumno_id = ${userId}`

      // 4. Inscripciones
      await sql`DELETE FROM inscripciones WHERE alumno_id = ${userId}`

      // 5. Si es maestro, desvincular de cursos (set null)
      if (usuario.tipo_usuario === 'maestro') {
        await sql`UPDATE cursos SET maestro_id = NULL WHERE maestro_id = ${userId}`
      }

      // 6. Finalmente, eliminar usuario
      await sql`DELETE FROM usuarios WHERE id = ${userId}`

      return NextResponse.json({ message: "Usuario y sus datos eliminados permanentemente" })
    }

  } catch (error) {
    console.error("[v0] Error deleting usuario:", error)
    return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 })
  }
}
