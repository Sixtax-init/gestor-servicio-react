import { NextResponse } from "next/server"
import { getSession } from "@/lib/session.server"
import { sql } from "@/lib/db"
import { sendEmailVerificationEmail } from "@/lib/email"
import { randomBytes } from "crypto"

export async function POST() {
  try {
    const session = await getSession()

    if (!session || session.tipo_usuario !== "pre_candidato") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const [usuario] = await sql`
      SELECT id, nombre, apellidos, email, pendiente_verificacion
      FROM usuarios
      WHERE id = ${session.id} AND activo = true
      LIMIT 1
    `

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    if (!usuario.pendiente_verificacion) {
      return NextResponse.json({ error: "Tu correo ya está verificado" }, { status: 409 })
    }

    const token = randomBytes(32).toString("hex")

    await sql`
      UPDATE usuarios
      SET token_accion            = ${token},
          token_accion_expires_at = NOW() + INTERVAL '24 hours',
          updated_at              = CURRENT_TIMESTAMP
      WHERE id = ${session.id}
    `

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
    const verifyUrl = `${appUrl}${basePath}/api/auth/verificar-email?token=${token}`

    await sendEmailVerificationEmail({
      nombre: usuario.nombre as string,
      apellidos: usuario.apellidos as string,
      email: usuario.email as string,
      verifyUrl,
    })

    return NextResponse.json({ message: "Correo de verificación reenviado." })
  } catch (error) {
    console.error("[auth/reenviar-verificacion] POST:", error)
    return NextResponse.json({ error: "Error al reenviar el correo" }, { status: 500 })
  }
}
