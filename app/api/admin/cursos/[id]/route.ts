import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireRole } from "@/lib/session.server"

// Actualizar curso
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole(["main_admin", "administrador"])
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const {
      nombre_grupo,
      tipo,
      maestro_id,
      descripcion,
      activo,
      archivo_adjunto,
      archivo_nombre,
      departamento_id
    } = body

    // 1. Verificar si el admin tiene acceso a este curso
    const [targetCurso] = await sql`SELECT departamento_id FROM cursos WHERE id = ${id}`

    if (!targetCurso) {
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 })
    }

    if (user.tipo_usuario === "administrador" && targetCurso.departamento_id !== user.departamento_id) {
      return NextResponse.json({ error: "No tienes permiso para editar cursos de otro departamento" }, { status: 403 })
    }

    // Si es administrador local, forzamos que el departamento_id no cambie o sea el suyo
    const finalDepartamentoId = user.tipo_usuario === "administrador" ? user.departamento_id : departamento_id

    const result = await sql`
      UPDATE cursos 
      SET 
        nombre_grupo = ${nombre_grupo}, 
        tipo = ${tipo}, 
        maestro_id = ${maestro_id}, 
        departamento_id = ${finalDepartamentoId},
        descripcion = ${descripcion}, 
        activo = ${activo}, 
        archivo_adjunto = ${archivo_adjunto || null}, 
        archivo_nombre = ${archivo_nombre || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} 
      RETURNING *
    `

    return NextResponse.json({ curso: result[0] })
  } catch (error) {
    console.error("[v0] Error updating curso:", error)
    return NextResponse.json({ error: "Error al actualizar curso" }, { status: 500 })
  }
}

// Eliminar curso
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole(["main_admin", "administrador"])
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id } = await params
    const cursoId = Number(id)

    // 1. Verificar si el admin tiene acceso a este curso
    const [targetCurso] = await sql`SELECT departamento_id FROM cursos WHERE id = ${cursoId}`

    if (!targetCurso) {
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 })
    }

    if (user.tipo_usuario === "administrador" && targetCurso.departamento_id !== user.departamento_id) {
      return NextResponse.json({ error: "No tienes permiso para eliminar cursos de otro departamento" }, { status: 403 })
    }

    const result = await sql`DELETE FROM cursos WHERE id = ${cursoId} RETURNING id`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting curso:", error)
    return NextResponse.json({ error: "Error al eliminar curso" }, { status: 500 })
  }
}
