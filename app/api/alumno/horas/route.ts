import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/session.server"
import { sql } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(["alumno"])
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const [usuario] = await sql`
      SELECT horas_acumuladas
      FROM usuarios
      WHERE id = ${session.id}
    `

    return NextResponse.json({ horas_acumuladas: usuario?.horas_acumuladas || 0 })
  } catch (error) {
    console.error("Error al obtener horas:", error)
    return NextResponse.json({ error: "Error al obtener horas" }, { status: 500 })
  }
}
