import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireRole } from "@/lib/session.server"

// Actualizar departamento
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await requireRole(["main_admin"])
        if (!user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()
        const { nombre, codigo, descripcion, activo } = body

        const result = await sql`
      UPDATE departamentos
      SET nombre = ${nombre},
          codigo = ${codigo},
          descripcion = ${descripcion},
          activo = ${activo},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

        if (result.length === 0) {
            return NextResponse.json({ error: "Departamento no encontrado" }, { status: 404 })
        }

        return NextResponse.json({ departamento: result[0] })
    } catch (error) {
        console.error("[main-admin] Error updating departamento:", error)
        return NextResponse.json({ error: "Error al actualizar departamento" }, { status: 500 })
    }
}

// Eliminar departamento (solo si no tiene usuarios o cursos)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await requireRole(["main_admin"])
        if (!user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const { id } = await params
        const deptId = Number(id)

        // 1. Verificar si tiene usuarios
        const [usuarios] = await sql`SELECT COUNT(*) as total FROM usuarios WHERE departamento_id = ${deptId}`
        if (Number(usuarios.total) > 0) {
            return NextResponse.json({ error: "No se puede eliminar un departamento con usuarios asociados" }, { status: 400 })
        }

        // 2. Verificar si tiene cursos
        const [cursos] = await sql`SELECT COUNT(*) as total FROM cursos WHERE departamento_id = ${deptId}`
        if (Number(cursos.total) > 0) {
            return NextResponse.json({ error: "No se puede eliminar un departamento con cursos asociados" }, { status: 400 })
        }

        const result = await sql`DELETE FROM departamentos WHERE id = ${deptId} RETURNING id`

        if (result.length === 0) {
            return NextResponse.json({ error: "Departamento no encontrado" }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[main-admin] Error deleting departamento:", error)
        return NextResponse.json({ error: "Error al eliminar departamento" }, { status: 500 })
    }
}
