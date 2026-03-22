import { NextResponse } from "next/server"
import { requireRole } from "@/lib/session.server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const session = await requireRole(["alumno"])

    if (!session) {
      return NextResponse.json({
        error: "No autorizado",
        details: "Sesión inválida o usuario no es alumno"
      }, { status: 403 })
    }

    // Obtener títulos y descripciones de las actividades del alumno
    const actividades = await sql`
      SELECT
        t.titulo AS actividad,
        t.descripcion
      FROM tareas t
      INNER JOIN cursos c ON t.curso_id = c.id
      INNER JOIN inscripciones i ON c.id = i.curso_id
      WHERE i.alumno_id = ${session.id}
      ORDER BY t.titulo ASC
    `

    return NextResponse.json(actividades)
  } catch (error) {
    console.error("[alumno/actividades] Error:", error)
    return NextResponse.json(
      {
        error: "Error al obtener las actividades del alumno",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
