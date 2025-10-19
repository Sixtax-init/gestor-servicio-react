import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const SECRET_KEY = new TextEncoder().encode(process.env.SESSION_SECRET || "default-secret-key-change-in-production")

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas públicas que no requieren autenticación
  const publicPaths = ["/login", "/api/auth/login"]
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Verificar sesión
  const token = request.cookies.get("session")?.value

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY)
    const user = payload.user as { tipo_usuario: string }

    // Verificar acceso según rol
    if (pathname.startsWith("/admin") && user.tipo_usuario !== "administrador") {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    if (pathname.startsWith("/maestro") && user.tipo_usuario !== "maestro") {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    if (pathname.startsWith("/alumno") && user.tipo_usuario !== "alumno") {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    return NextResponse.next()
  } catch (error) {
    console.error("[v0] Middleware auth error:", error)
    return NextResponse.redirect(new URL("/login", request.url))
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/maestro/:path*",
    "/alumno/:path*",
    "/api/admin/:path*",
    "/api/maestro/:path*",
    "/api/alumno/:path*",
  ],
}
