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
            return NextResponse.json({ error: "No autorizado" }, { status: 403 })
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

        // 2. Eliminar (desactivar) la inscripción
        // Usamos borrado lógico (activo = false) o físico según la preferencia.
        // Dado que el sistema usa 'activo', haremos borrado lógico.
        // Si prefieres borrado físico: DELETE FROM inscripciones ...

        await sql`
      UPDATE inscripciones 
      SET activo = false
      WHERE curso_id = ${cursoId} AND alumno_id = ${alumnoId}
    `

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error eliminando alumno:", error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}
