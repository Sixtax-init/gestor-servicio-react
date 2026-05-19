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

  const isApiRoute = pathname.startsWith("/api/")
  const token = request.cookies.get("session")?.value

  if (!token) {
    if (request.cookies.has("refresh_token")) {
      if (isApiRoute) return NextResponse.json({ error: "token_expired" }, { status: 401 })
      return redirectTo(`/api/auth/refresh?continue=${encodeURIComponent(pathname)}`, request)
    }
    if (isApiRoute) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    return redirectTo("/login?motivo=expirada", request)
  }

  try {
    // Validar con issuer y audience para consistencia con session.server.ts
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      issuer: "gestor-servicio",
      audience: "gestor-servicio-api",
    })

    // Los claims ahora están en la RAÍZ del payload (no en payload.user)
    const tipo_usuario = payload.tipo_usuario as string | undefined
    const pendiente_verificacion = Boolean(payload.pendiente_verificacion)

    if (!tipo_usuario) {
      // Token malformado — no tiene tipo_usuario
      if (isApiRoute) {
        return NextResponse.json({ error: "Sesión inválida" }, { status: 401 })
      }
      return redirectTo("/login", request)
    }

    // Bloqueo por acción pendiente — diferencia el rol para redirigir correctamente
    if (pendiente_verificacion) {
      if (tipo_usuario === "pre_candidato") {
        // Pre-candidato: debe verificar su correo antes de continuar
        const VERIFY_PATHS = ["/pendiente-verificacion", "/api/auth/verificar-email", "/api/auth/reenviar-verificacion", "/api/auth/logout"]
        if (!VERIFY_PATHS.some((p) => pathname.startsWith(p))) {
          if (isApiRoute) return NextResponse.json({ error: "Debes verificar tu correo electrónico" }, { status: 403 })
          return redirectTo("/pendiente-verificacion", request)
        }
      } else {
        // Otros roles (admin, maestro, alumno): deben cambiar su contraseña temporal
        const allowedWhilePending = [CHANGE_PASSWORD_PATH, CHANGE_PASSWORD_API, "/api/auth/logout"]
        if (!allowedWhilePending.some((p) => pathname.startsWith(p))) {
          if (isApiRoute) return NextResponse.json({ error: "Debes cambiar tu contraseña" }, { status: 403 })
          return redirectTo(CHANGE_PASSWORD_PATH, request)
        }
      }
      return NextResponse.next()
    }

    // Protección por rol
    if (pathname.startsWith("/main-admin") && tipo_usuario !== "main_admin") {
      return redirectTo("/login", request)
    }

    if (pathname.startsWith("/admin") && tipo_usuario !== "administrador" && tipo_usuario !== "main_admin") {
      return redirectTo("/login", request)
    }

    if (pathname.startsWith("/maestro") && tipo_usuario !== "maestro") {
      return redirectTo("/login", request)
    }

    if (pathname.startsWith("/alumno") && tipo_usuario !== "alumno") {
      return redirectTo("/login", request)
    }

    if (
      pathname.startsWith("/inscripcion") &&
      tipo_usuario !== "pre_candidato" &&
      tipo_usuario !== "alumno" &&
      tipo_usuario !== "administrador" &&
      tipo_usuario !== "main_admin"
    ) {
      return redirectTo("/login", request)
    }

    return NextResponse.next()
  } catch {
    if (request.cookies.has("refresh_token")) {
      if (isApiRoute) return NextResponse.json({ error: "token_expired" }, { status: 401 })
      return redirectTo(`/api/auth/refresh?continue=${encodeURIComponent(pathname)}`, request)
    }
    if (isApiRoute) {
      return NextResponse.json({ error: "Sesión inválida o expirada" }, { status: 401 })
    }
    return redirectTo("/login?motivo=expirada", request)
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
    "/inscripcion/:path*",
    "/api/inscripcion/:path*",
  ],
}
