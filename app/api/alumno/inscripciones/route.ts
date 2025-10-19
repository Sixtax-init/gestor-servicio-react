import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/session"
import { sql } from "@/lib/db"

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

    // Verificar que el curso existe y está activo
    const curso = await sql`
      SELECT * FROM cursos WHERE id = ${curso_id} AND activo = true
    `

    if (curso.length === 0) {
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 })
    }

    // Verificar si ya está inscrito
    const existente = await sql`
      SELECT * FROM inscripciones 
      WHERE alumno_id = ${user.id} AND curso_id = ${curso_id}
    `

    if (existente.length > 0) {
      return NextResponse.json({ error: "Ya estás inscrito en este curso" }, { status: 400 })
    }

    // Crear inscripción
    const result = await sql`
      INSERT INTO inscripciones (alumno_id, curso_id, horas_completadas, activo)
      VALUES (${user.id}, ${curso_id}, 0, true)
      RETURNING *
    `

    return NextResponse.json({ inscripcion: result[0] }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating inscripcion:", error)
    return NextResponse.json({ error: "Error al inscribirse" }, { status: 500 })
  }
}
