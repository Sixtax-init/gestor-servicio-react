import { NextResponse } from "next/server"
import { requireRole } from "@/lib/session.server"
import { sql } from "@/lib/db"

export async function POST(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireRole(["maestro"])
        if (!user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const cursoId = Number((await context.params).id)
        const body = await req.json()
        const { alumnoId } = body

        if (!alumnoId) {
            return NextResponse.json({ error: "ID de alumno requerido" }, { status: 400 })
        }

        // 1. Verificar que el curso pertenece al maestro
        const curso = await sql`
      SELECT id FROM cursos 
      WHERE id = ${cursoId} AND maestro_id = ${user.id} AND activo = true
    `

        if (curso.length === 0) {
            return NextResponse.json({ error: "Curso no encontrado o no autorizado" }, { status: 404 })
        }

        // 2. Verificar si ya está inscrito
        const existente = await sql`
      SELECT id FROM inscripciones
      WHERE curso_id = ${cursoId} AND alumno_id = ${alumnoId} AND activo = true
    `

        if (existente.length > 0) {
            return NextResponse.json({ error: "El alumno ya está inscrito en este curso" }, { status: 400 })
        }

        // 3. Inscribir al alumno
        await sql`
      INSERT INTO inscripciones (alumno_id, curso_id, fecha_inscripcion, horas_completadas, activo)
      VALUES (${alumnoId}, ${cursoId}, NOW(), 0, true)
    `

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error agregando alumno:", error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}
