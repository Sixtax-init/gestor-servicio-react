import { NextResponse } from "next/server"
import { getSession, createSession } from "@/lib/session.server"
import { sql } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { passwordActual, passwordNuevo } = await request.json()

    if (!passwordActual || !passwordNuevo) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    if (passwordNuevo.length < 8) {
      return NextResponse.json({ error: "La nueva contraseña debe tener al menos 8 caracteres" }, { status: 400 })
    }

    // Verificar contraseña actual
    const [usuario] = await sql`
      SELECT password_hash FROM usuarios WHERE id = ${session.id} AND activo = true LIMIT 1
    `

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const isValid = await bcrypt.compare(passwordActual, usuario.password_hash as string)

    if (!isValid) {
      return NextResponse.json({ error: "La contraseña actual es incorrecta" }, { status: 400 })
    }

    if (passwordActual === passwordNuevo) {
      return NextResponse.json({ error: "La nueva contraseña debe ser diferente a la actual" }, { status: 400 })
    }

    // Actualizar contraseña y limpiar flag
    const nuevoHash = await bcrypt.hash(passwordNuevo, 10)

    await sql`
      UPDATE usuarios
      SET password_hash = ${nuevoHash},
          pendiente_verificacion = false,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${session.id}
    `

    // Actualizar la sesión para reflejar el cambio
    await createSession({ ...session, pendiente_verificacion: false })

    return NextResponse.json({ message: "Contraseña actualizada correctamente" })
  } catch (error) {
    console.error("[auth/cambiar-password] Error:", error)
    return NextResponse.json({ error: "Error al cambiar la contraseña" }, { status: 500 })
  }
}
