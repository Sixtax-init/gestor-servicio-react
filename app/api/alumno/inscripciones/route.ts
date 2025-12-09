//typescript
import { type NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/session.server"
import { sql } from "@/lib/db"

// 📥 Obtener inscripciones del alumno logueado

export async function GET() {
  try {
    const session = await requireRole(["alumno"])

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("🔍 Consultando inscripciones para alumno:", session.id)

    const inscripciones = await sql`
SELECT
i.id,
  i.curso_id,
  i.horas_completadas,
  i.fecha_inscripcion,
  i.activo,
  c.nombre_grupo,
  c.tipo,
  c.maestro_id
      FROM inscripciones i
      INNER JOIN cursos c ON i.curso_id = c.id
      WHERE i.alumno_id = ${session.id}
`

    return NextResponse.json(inscripciones)
  } catch (error) {
    console.error("❌ Error al obtener inscripciones:", error)
    return NextResponse.json({ error: "Error al obtener inscripciones" }, { status: 500 })
  }
}


// 📤 Mantén el POST existente (para inscribirse)
export async function POST(request: NextRequest) {
  const user = await requireRole(["alumno"])

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { curso_id } = body

    if (!curso_id) {
      return NextResponse.json({ error: "ID de curso requerido" }, { status: 400 })
    }

    const curso = await sql`
SELECT * FROM cursos WHERE id = ${curso_id} AND activo = true
  `
    if (curso.length === 0) {
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 })
    }

    const existente = await sql`
SELECT * FROM inscripciones WHERE alumno_id = ${user.id} AND curso_id = ${curso_id}
`
    if (existente.length > 0) {
      return NextResponse.json({ error: "Ya estás inscrito en este curso" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO inscripciones(alumno_id, curso_id, horas_completadas, activo)
VALUES(${user.id}, ${curso_id}, 0, true)
RETURNING *
  `

    return NextResponse.json({ inscripcion: result[0] }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creando inscripción:", error)
    return NextResponse.json({ error: "Error al inscribirse" }, { status: 500 })
  }
}
