import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { createSession } from "@/lib/session.server"
import { getUserById } from "@/lib/auth"

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ""

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token")

    if (!token || token.length < 32) {
      return NextResponse.redirect(new URL(`${BASE_PATH}/login?motivo=token_invalido`, request.url))
    }

    const [usuario] = await sql`
      SELECT id FROM usuarios
      WHERE token_accion = ${token}
        AND token_accion_expires_at > NOW()
        AND tipo_usuario = 'pre_candidato'
        AND activo = true
      LIMIT 1
    `

    if (!usuario) {
      return NextResponse.redirect(new URL(`${BASE_PATH}/login?motivo=token_invalido`, request.url))
    }

    // Marcar como verificado y limpiar el token
    await sql`
      UPDATE usuarios
      SET pendiente_verificacion  = false,
          token_accion            = NULL,
          token_accion_expires_at = NULL,
          updated_at              = CURRENT_TIMESTAMP
      WHERE id = ${usuario.id}
    `

    // Crear nueva sesión con pendiente_verificacion=false para que el proxy permita el acceso
    const fullUser = await getUserById(usuario.id)
    if (fullUser) {
      const userAgent = request.headers.get("user-agent") ?? ""
      const ip = request.headers.get("x-forwarded-for") ?? ""
      await createSession(fullUser, userAgent, ip)
    }

    return NextResponse.redirect(new URL(`${BASE_PATH}/inscripcion`, request.url))
  } catch (error) {
    console.error("[auth/verificar-email] GET:", error)
    return NextResponse.redirect(new URL(`${BASE_PATH}/login?motivo=token_invalido`, request.url))
  }
}
