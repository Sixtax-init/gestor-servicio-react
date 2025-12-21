import { NextResponse } from "next/server"
import { requireRole } from "@/lib/session.server"
import { sql } from "@/lib/db"

export async function DELETE(
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

        // Verificar que el curso pertenece al maestro
        const curso = await sql`
      SELECT id FROM cursos
      WHERE id = ${cursoId} AND maestro_id = ${user.id} AND activo = true
    `

        if (curso.length === 0) {
            return NextResponse.json({ error: "Curso no encontrado o no autorizado" }, { status: 404 })
        }

        // ⚠️ HARD DELETE: Eliminar todo lo relacionado con el curso
        // 1. Eliminar archivos de entregas de tareas del curso
        await sql`
      DELETE FROM archivos
      WHERE entrega_id IN (
        SELECT id FROM entregas
        WHERE tarea_id IN (
          SELECT id FROM tareas
          WHERE curso_id = ${cursoId}
        )
      )
    `

        // 2. Eliminar entregas de tareas del curso
        await sql`
      DELETE FROM entregas
      WHERE tarea_id IN (
        SELECT id FROM tareas
        WHERE curso_id = ${cursoId}
      )
    `

        // 3. Eliminar tareas del curso
        await sql`
      DELETE FROM tareas
      WHERE curso_id = ${cursoId}
    `

        // 4. Eliminar inscripciones (esto borrará las horas acumuladas en este curso)
        await sql`
      DELETE FROM inscripciones
      WHERE curso_id = ${cursoId}
    `

        // 5. Finalmente, eliminar el curso
        await sql`
      DELETE FROM cursos
      WHERE id = ${cursoId}
    `

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error al eliminar curso:", error)
        return NextResponse.json({ error: "Error en el servidor" }, { status: 500 })
    }
}
