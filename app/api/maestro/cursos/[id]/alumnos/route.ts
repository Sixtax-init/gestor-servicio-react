import { NextResponse } from "next/server"
import { requireRole } from "@/lib/session"
import { sql } from "@/lib/db"

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["maestro"])

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const cursoId = Number((await context.params).id)

    if (isNaN(cursoId)) {
      return NextResponse.json({ error: "ID de curso inválido" }, { status: 400 })
    }

    // 🔍 Verificar que el curso pertenece al maestro
    const curso = await sql`
      SELECT id
      FROM cursos
      WHERE id = ${cursoId}
      AND maestro_id = ${user.id}
      AND activo = true
      LIMIT 1
    `

    if (curso.length === 0) {
      return NextResponse.json({ error: "Curso no encontrado o no autorizado" }, { status: 404 })
    }

    // 👨‍🎓 Obtener alumnos inscritos
    const alumnos = await sql`
      SELECT 
        u.id, 
        u.nombre, 
        u.apellidos, 
        u.matricula, 
        u.email
      FROM inscripciones i
      INNER JOIN usuarios u ON u.id = i.alumno_id
      WHERE i.curso_id = ${cursoId}
      ORDER BY u.apellidos ASC, u.nombre ASC
    `

    return NextResponse.json({ alumnos }, { status: 200 })
  } catch (error) {
    console.error("[v0] Error al obtener alumnos:", error)
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 })
  }
}
