import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { sql } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.tipo_usuario !== "alumno") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
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
