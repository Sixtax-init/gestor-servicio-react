import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/session.server"
import { sql } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(["alumno"])
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Las horas se acreditan en las inscripciones a cursos, no en el usuario:
    // `usuarios.horas_acumuladas` no existe en el esquema y esta consulta
    // fallaba siempre con un 500. Se suman las de todos sus cursos activos.
    const [totales] = await sql`
      SELECT COALESCE(SUM(horas_completadas), 0) AS horas_acumuladas
      FROM inscripciones
      WHERE alumno_id = ${session.id} AND activo = true
    `

    return NextResponse.json({ horas_acumuladas: Number(totales?.horas_acumuladas ?? 0) })
  } catch (error) {
    console.error("Error al obtener horas:", error)
    return NextResponse.json({ error: "Error al obtener horas" }, { status: 500 })
  }
}
