import { NextResponse } from "next/server"
import { getSession } from "@/lib/session.server"
import { sql } from "@/lib/db"
import { sendPasswordResetEmail } from "@/lib/email"
import { randomBytes } from "crypto"
import { rateLimit, respuesta429 } from "@/lib/rate-limit"

const LIMITE_POR_USUARIO = { limite: 3, ventanaMs: 60 * 60 * 1000 }

export async function POST() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    if (!["administrador", "alumno", "maestro"].includes(session.tipo_usuario)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const limite = rateLimit(`solicitar-reset:usuario:${session.id}`, LIMITE_POR_USUARIO)
    if (!limite.permitido) {
      return respuesta429(limite.reintentarEnSeg, "Ya enviamos varios correos. Revisa tu bandeja y spam antes de pedir otro.")
    }

    const [usuario] = await sql`
      SELECT id, nombre, apellidos, email
      FROM usuarios
      WHERE id = ${session.id} AND activo = true
      LIMIT 1
    `

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Token aleatorio de 32 bytes en hex — único e impredecible
    const token = randomBytes(32).toString("hex")

    // Guardar token en BD con expiración de 1 hora
    await sql`
      UPDATE usuarios
      SET token_accion = ${token},
          token_accion_expires_at = NOW() + INTERVAL '1 hour',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${session.id}
    `

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
    const resetUrl = `${appUrl}${basePath}/reset-password?token=${token}`

    await sendPasswordResetEmail({
      nombre: usuario.nombre as string,
      apellidos: usuario.apellidos as string,
      email: usuario.email as string,
      resetUrl,
    })

    return NextResponse.json({ message: "Correo enviado." })
  } catch (error) {
    console.error("[auth/solicitar-reset-password] Error:", error)
    return NextResponse.json({ error: "Error al enviar el correo" }, { status: 500 })
  }
}
