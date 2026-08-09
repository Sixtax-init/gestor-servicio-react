import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { sendPasswordResetEmail } from "@/lib/email"
import { randomBytes } from "crypto"
import { rateLimit, getClientIp, respuesta429 } from "@/lib/rate-limit"

// Endpoint público que dispara un envío de correo: sin límite sirve para
// bombardear el buzón de un tercero y para quemar la cuota del SMTP.
const LIMITE_POR_IP = { limite: 5, ventanaMs: 15 * 60 * 1000 }
const LIMITE_POR_EMAIL = { limite: 3, ventanaMs: 60 * 60 * 1000 }

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 })
    }

    const porIp = rateLimit(`recuperar:ip:${getClientIp(request)}`, LIMITE_POR_IP)
    if (!porIp.permitido) {
      return respuesta429(porIp.reintentarEnSeg, "Demasiadas solicitudes. Espera unos minutos.")
    }

    const porEmail = rateLimit(`recuperar:email:${String(email).toLowerCase().trim()}`, LIMITE_POR_EMAIL)
    if (!porEmail.permitido) {
      return respuesta429(porEmail.reintentarEnSeg, "Ya se enviaron varios correos a esta dirección. Revisa tu bandeja o intenta más tarde.")
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
      SET token_accion = ${token},
          token_accion_expires_at = NOW() + INTERVAL '1 hour',
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
