import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required but not set")
}

const SECRET_KEY = new TextEncoder().encode(process.env.SESSION_SECRET)
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ""

const PUBLIC_PATHS = ["/login", "/api/auth/login"]
const CHANGE_PASSWORD_PATH = "/cambiar-password"
const CHANGE_PASSWORD_API = "/api/auth/cambiar-password"

function redirectTo(path: string, request: NextRequest) {
  return NextResponse.redirect(new URL(BASE_PATH + path, request.url))
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas públicas — no requieren sesión
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const token = request.cookies.get("session")?.value

  if (!token) {
    return redirectTo("/login", request)
  }

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY)
    const user = payload.user as {
      tipo_usuario: string
      debe_cambiar_password: boolean
    }

    // Si el usuario debe cambiar su contraseña, solo puede acceder a esa página/API
    if (user.debe_cambiar_password) {
      const allowedWhilePending = [CHANGE_PASSWORD_PATH, CHANGE_PASSWORD_API, "/api/auth/logout"]
      if (!allowedWhilePending.some((p) => pathname.startsWith(p))) {
        return redirectTo(CHANGE_PASSWORD_PATH, request)
      }
      return NextResponse.next()
    }

    // Protección por rol
    if (pathname.startsWith("/main-admin") && user.tipo_usuario !== "main_admin") {
      return redirectTo("/login", request)
    }

    if (pathname.startsWith("/admin") && user.tipo_usuario !== "administrador" && user.tipo_usuario !== "main_admin") {
      return redirectTo("/login", request)
    }

    if (pathname.startsWith("/maestro") && user.tipo_usuario !== "maestro") {
      return redirectTo("/login", request)
    }

    if (pathname.startsWith("/alumno") && user.tipo_usuario !== "alumno") {
      return redirectTo("/login", request)
    }

    return NextResponse.next()
  } catch {
    return redirectTo("/login", request)
  }
}

export const config = {
  matcher: [
    "/main-admin/:path*",
    "/admin/:path*",
    "/maestro/:path*",
    "/alumno/:path*",
    "/cambiar-password",
    "/api/main-admin/:path*",
    "/api/admin/:path*",
    "/api/maestro/:path*",
    "/api/alumno/:path*",
    "/api/auth/cambiar-password",
  ],
}
