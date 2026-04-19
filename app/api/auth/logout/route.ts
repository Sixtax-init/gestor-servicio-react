import { NextResponse } from "next/server"
import { destroySession } from "@/lib/session.server"

export async function POST() {
  try {
    await destroySession()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[auth/logout] Error:", error)
    return NextResponse.json({ error: "Error al cerrar sesión" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    await destroySession()
  } catch (error) {
    console.error("[auth/logout] GET Error:", error)
  }
  
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ""
  const incomingReq = new URL(request.url)
  const motivo = incomingReq.searchParams.get("motivo") || "expirada"
  
  const url = new URL(`${basePath}/login?motivo=${motivo}`, request.url)
  return NextResponse.redirect(url)
}
