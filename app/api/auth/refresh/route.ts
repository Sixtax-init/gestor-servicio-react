import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { SignJWT } from "jose"
import { sql } from "@/lib/db"
import crypto from "crypto"

const COOKIE_NAME = "session"
const REFRESH_COOKIE_NAME = "refresh_token"
const ISSUER = "gestor-servicio"
const AUDIENCE = "gestor-servicio-api"

async function performRefresh(request: NextRequest) {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value

  if (!refreshToken) {
    return { error: "No refresh token", status: 401 }
  }

  try {
    // Buscar la sesión ligada a este refresh token
    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex")
    const sessions = await sql`
        SELECT s.id, s.usuario_id, s.activo, u.tipo_usuario, u.departamento_id, u.pendiente_verificacion
        FROM sesiones s
        JOIN usuarios u ON s.usuario_id = u.id
        WHERE s.refresh_token = ${refreshTokenHash} AND s.expires_at > NOW()
    `

    if (sessions.length === 0) {
        cookieStore.delete(COOKIE_NAME)
        cookieStore.delete(REFRESH_COOKIE_NAME)
        return { error: "Sesión inválida o expirada", status: 401 }
    }

    const session = sessions[0]

    // Ghost token: si la sesión fue desactivada por un admin, rechazamos
    if (!session.activo) {
        cookieStore.delete(COOKIE_NAME)
        cookieStore.delete(REFRESH_COOKIE_NAME)
        return { error: "Sesión revocada remotamente", status: 401 }
    }

    const secret = process.env.SESSION_SECRET
    if (!secret) throw new Error("SESSION_SECRET is required")
    const secretKey = new TextEncoder().encode(secret)

    // Generamos el NUEVO Access Token (15 minutos)
    const token = await new SignJWT({
        session_id: session.id,
        tipo_usuario: session.tipo_usuario,
        departamento_id: session.departamento_id ?? null,
        pendiente_verificacion: session.pendiente_verificacion,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(String(session.usuario_id))
      .setIssuedAt()
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setExpirationTime("15m")
      .sign(secretKey)

    // Actualizamos únicamente la cookie corta
    const COOKIE_OPTIONS = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
        maxAge: 15 * 60, // 15 minutos
    }

    cookieStore.set(COOKIE_NAME, token, COOKIE_OPTIONS)

    return { success: true }
  } catch (error) {
    console.error("[auth/refresh] Error:", error)
    return { error: "Error al renovar sesión", status: 500 }
  }
}

export async function POST(request: NextRequest) {
  const result = await performRefresh(request)
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }
  return NextResponse.json(result)
}

/**
 * Sólo se acepta una ruta interna. Sin esto, `?continue=//evil.com` produce
 * `new URL("//evil.com", origen)` = `https://evil.com`, y el sitio redirige a
 * un dominio ajeno tras autenticar (open redirect → phishing).
 */
function rutaInternaSegura(valor: string | null): string {
  if (!valor) return "/"
  // Debe empezar por una sola barra y no ser "//" ni "/\", que el navegador
  // interpreta como URL protocol-relative hacia otro host.
  if (!valor.startsWith("/") || valor.startsWith("//") || valor.startsWith("/\\")) return "/"
  // Descarta cualquier cosa con esquema o credenciales embebidas
  if (/^\/[^/]*:/.test(valor)) return "/"
  return valor
}

export async function GET(request: NextRequest) {
  const result = await performRefresh(request)
  const continueUrl = rutaInternaSegura(request.nextUrl.searchParams.get("continue"))
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ""

  if (result.error) {
    return NextResponse.redirect(new URL(`${basePath}/login?motivo=expirada`, request.url))
  }

  return NextResponse.redirect(new URL(`${basePath}${continueUrl}`, request.url))
}
