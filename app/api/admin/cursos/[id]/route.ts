import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/session.server"

// Actualizar curso
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || session.tipo_usuario !== "administrador") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { nombre_grupo, tipo, maestro_id, descripcion, activo, archivo_adjunto, archivo_nombre } = body

    const result = await sql`
      UPDATE cursos 
       SET nombre_grupo = ${nombre_grupo}, tipo = ${tipo}, maestro_id = ${maestro_id}, descripcion = ${descripcion}, activo = ${activo}, 
           archivo_adjunto = ${archivo_adjunto || null}, archivo_nombre = ${archivo_nombre || null}
       WHERE id = ${id} 
       RETURNING *`

    if (result.length === 0) {
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ curso: result[0] })
  } catch (error) {
    console.error("[v0] Error updating curso:", error)
    return NextResponse.json({ error: "Error al actualizar curso" }, { status: 500 })
  }
}

// Eliminar curso
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || session.tipo_usuario !== "administrador") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params

    const result = await sql`DELETE FROM cursos WHERE id = ${id} RETURNING id`

    if (result.length === 0) {
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting curso:", error)
    return NextResponse.json({ error: "Error al eliminar curso" }, { status: 500 })
  }
}
