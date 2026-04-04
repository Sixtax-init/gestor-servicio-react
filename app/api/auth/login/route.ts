import { type NextRequest, NextResponse } from "next/server"
import { verifyCredentials } from "@/lib/auth"
import { createSession } from "@/lib/session.server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const matricula = typeof body.matricula === "string" ? body.matricula.trim() : ""
    const password = typeof body.password === "string" ? body.password : ""

    if (!matricula || !password) {
      return NextResponse.json({ error: "Matrícula y contraseña son requeridos" }, { status: 400 })
    }

    const user = await verifyCredentials(matricula, password)

    if (!user) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    await createSession(user)

    return NextResponse.json({ user })
  } catch (error) {
    console.error("[auth/login] Error:", error)
    return NextResponse.json({ error: "Error al iniciar sesión" }, { status: 500 })
  }
}
