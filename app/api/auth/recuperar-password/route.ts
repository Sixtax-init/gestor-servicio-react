import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { sendPasswordResetEmail } from "@/lib/email"
import { randomBytes } from "crypto"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 })
    }

    // 1. Buscar al usuario por correo electrónico
    const [usuario] = await sql`
      SELECT id, nombre, apellidos, email
      FROM usuarios
      WHERE email = ${email} AND activo = true
      LIMIT 1
    `

    // Seguridad: Si el usuario no existe, devolvemos éxito igualmente
    // para prevenir la enumeración de correos registrados ("User Enumeration").
    if (!usuario) {
      return NextResponse.json({ message: "Si el correo está registrado, recibirás un enlace de recuperación." })
    }

    // 2. Generar token aleatorio de 32 bytes
    const token = randomBytes(32).toString("hex")

    // 3. Guardar token con expiración de 1 hora
    await sql`
      UPDATE usuarios
      SET reset_token = ${token},
          reset_token_expires_at = NOW() + INTERVAL '1 hour',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${usuario.id}
    `

    // 4. Preparar URL de reset
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
    const resetUrl = `${appUrl}${basePath}/reset-password?token=${token}`

    // 5. Enviar el correo
    await sendPasswordResetEmail({
      nombre: usuario.nombre as string,
      apellidos: usuario.apellidos as string,
      email: usuario.email as string,
      resetUrl,
    })

    return NextResponse.json({ message: "Si el correo está registrado, recibirás un enlace de recuperación." })
  } catch (error) {
    console.error("[auth/recuperar-password] Error:", error)
    return NextResponse.json({ error: "Error procesando la solicitud" }, { status: 500 })
  }
}
