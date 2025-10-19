import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import type { SessionUser } from "./auth"

const SECRET_KEY = new TextEncoder().encode(process.env.SESSION_SECRET || "default-secret-key-change-in-production")

const COOKIE_NAME = "session"
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7, // 7 días
  path: "/",
}

// Crear sesión
export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY)

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, COOKIE_OPTIONS)
}

// Obtener sesión actual
export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value

    if (!token) {
      return null
    }

    const { payload } = await jwtVerify(token, SECRET_KEY)
    return payload.user as SessionUser
  } catch (error) {
    console.error("[v0] Error getting session:", error)
    return null
  }
}

// Destruir sesión
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

// Verificar si el usuario tiene un rol específico
export async function requireRole(
  allowedRoles: Array<"administrador" | "maestro" | "alumno">,
): Promise<SessionUser | null> {
  const user = await getSession()

  if (!user || !allowedRoles.includes(user.tipo_usuario)) {
    return null
  }

  return user
}
