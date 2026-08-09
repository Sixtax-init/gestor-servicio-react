import { type NextRequest, NextResponse } from "next/server"
import { verifyCredentials } from "@/lib/auth"
import { createSession } from "@/lib/session.server"
import { rateLimit, limpiarLimite, getClientIp, respuesta429 } from "@/lib/rate-limit"

// Dos límites complementarios:
// - por IP: frena a quien prueba muchas matrículas desde un mismo origen
// - por matrícula: frena el ataque distribuido contra una cuenta concreta
const LIMITE_POR_IP = { limite: 10, ventanaMs: 5 * 60 * 1000 }
const LIMITE_POR_CUENTA = { limite: 5, ventanaMs: 15 * 60 * 1000 }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const matricula = typeof body.matricula === "string" ? body.matricula.trim() : ""
    const password = typeof body.password === "string" ? body.password : ""

    if (!matricula || !password) {
      return NextResponse.json({ error: "Matrícula y contraseña son requeridos" }, { status: 400 })
    }

    const ipAddress = getClientIp(request)
    const claveIp = `login:ip:${ipAddress}`
    const claveCuenta = `login:cuenta:${matricula.toUpperCase()}`

    const porIp = rateLimit(claveIp, LIMITE_POR_IP)
    if (!porIp.permitido) {
      return respuesta429(porIp.reintentarEnSeg, "Demasiados intentos. Espera un momento antes de volver a intentar.")
    }

    const porCuenta = rateLimit(claveCuenta, LIMITE_POR_CUENTA)
    if (!porCuenta.permitido) {
      return respuesta429(
        porCuenta.reintentarEnSeg,
        "Demasiados intentos fallidos para esta matrícula. Intenta más tarde o restablece tu contraseña.",
      )
    }

    const user = await verifyCredentials(matricula, password)

    if (!user) {
      // El mensaje no distingue entre matrícula inexistente y contraseña mala,
      // igual que verifyCredentials no distingue en el tiempo de respuesta.
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    // Login correcto: se liberan los contadores para no penalizar al usuario
    // legítimo que falló un par de veces antes de acertar.
    limpiarLimite(claveCuenta)
    limpiarLimite(claveIp)

    const userAgent = request.headers.get("user-agent") || "Unknown"

    await createSession(user, userAgent, ipAddress)

    return NextResponse.json({ user })
  } catch (error) {
    console.error("[auth/login] Error:", error)
    return NextResponse.json({ error: "Error al iniciar sesión" }, { status: 500 })
  }
}
