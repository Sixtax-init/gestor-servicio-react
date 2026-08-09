import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import bcrypt from "bcryptjs"
import { rateLimit, getClientIp, respuesta429 } from "@/lib/rate-limit"

const LIMITE_POR_IP = { limite: 10, ventanaMs: 15 * 60 * 1000 }

// Verificar si un token sigue siendo válido (para validación al cargar la página)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")

  if (!token) {
    return NextResponse.json({ valid: false })
  }

  const [usuario] = await sql`
    SELECT id FROM usuarios
    WHERE token_accion = ${token}
      AND token_accion_expires_at > NOW()
      AND activo = true
    LIMIT 1
  `

  return NextResponse.json({ valid: !!usuario })
}

export async function POST(request: Request) {
  try {
    // El token es el único secreto que protege el cambio de contraseña:
    // sin límite, se puede intentar adivinar a volumen.
    const porIp = rateLimit(`reset:ip:${getClientIp(request)}`, LIMITE_POR_IP)
    if (!porIp.permitido) {
      return respuesta429(porIp.reintentarEnSeg, "Demasiados intentos. Espera unos minutos.")
    }

    const { token, passwordNuevo } = await request.json()

    if (!token || !passwordNuevo) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    if (passwordNuevo.length < 8) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 })
    }

    // Buscar usuario con ese token que no haya expirado
    const [usuario] = await sql`
      SELECT id FROM usuarios
      WHERE token_accion = ${token}
        AND token_accion_expires_at > NOW()
        AND activo = true
      LIMIT 1
    `

    if (!usuario) {
      return NextResponse.json({ error: "El enlace es inválido o ha expirado" }, { status: 400 })
    }

    // Actualizar contraseña y borrar el token (uso único)
    const nuevoHash = await bcrypt.hash(passwordNuevo, 10)

    await sql`
      UPDATE usuarios
      SET password_hash = ${nuevoHash},
          token_accion = NULL,
          token_accion_expires_at = NULL,
          pendiente_verificacion = false,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${usuario.id}
    `

    return NextResponse.json({ message: "Contraseña actualizada correctamente" })
  } catch (error) {
    console.error("[auth/reset-password] Error:", error)
    return NextResponse.json({ error: "Error al restablecer la contraseña" }, { status: 500 })
  }
}
