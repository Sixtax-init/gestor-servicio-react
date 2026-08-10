import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireRole } from "@/lib/session.server"

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(["main_admin"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const { id } = await params
    const carreraId = Number(id)
    if (!Number.isInteger(carreraId) || carreraId <= 0) {
      return NextResponse.json({ error: "Identificador inválido" }, { status: 400 })
    }

    const { nombre, clave, activo } = await request.json()
    if (!nombre?.trim() || !clave?.trim()) {
      return NextResponse.json({ error: "El nombre y la clave son requeridos" }, { status: 400 })
    }

    const [duplicada] = await sql`
      SELECT id FROM carreras
      WHERE id != ${carreraId}
        AND (lower(nombre) = ${nombre.trim().toLowerCase()} OR lower(clave) = ${clave.trim().toLowerCase()})
    `
    if (duplicada) {
      return NextResponse.json({ error: "Ya existe otra carrera con ese nombre o clave" }, { status: 409 })
    }

    const [carrera] = await sql`
      UPDATE carreras
      SET nombre     = ${nombre.trim()},
          clave      = ${clave.trim().toUpperCase()},
          activo     = ${activo ?? true},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${carreraId}
      RETURNING *
    `
    if (!carrera) {
      return NextResponse.json({ error: "Carrera no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ carrera })
  } catch (error) {
    console.error("[main-admin/carreras/id] PUT:", error)
    return NextResponse.json({ error: "Error al actualizar la carrera" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(["main_admin"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const { id } = await params
    const carreraId = Number(id)
    if (!Number.isInteger(carreraId) || carreraId <= 0) {
      return NextResponse.json({ error: "Identificador inválido" }, { status: 400 })
    }

    // Borrar una carrera en uso dejaría alumnos sin carrera y programas
    // apuntando a nada, así que se desactiva: deja de ofrecerse en el registro
    // pero los expedientes existentes conservan su referencia.
    const [enUso] = await sql`
      SELECT COUNT(*) AS total FROM usuarios WHERE carrera_id = ${carreraId}
    `
    if (Number(enUso.total) > 0) {
      const [carrera] = await sql`
        UPDATE carreras SET activo = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${carreraId}
        RETURNING *
      `
      if (!carrera) return NextResponse.json({ error: "Carrera no encontrada" }, { status: 404 })
      return NextResponse.json({
        carrera,
        message: `La carrera tiene ${enUso.total} alumno(s) registrado(s), así que se desactivó en lugar de eliminarse.`,
      })
    }

    const [eliminada] = await sql`DELETE FROM carreras WHERE id = ${carreraId} RETURNING id`
    if (!eliminada) {
      return NextResponse.json({ error: "Carrera no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error("[main-admin/carreras/id] DELETE:", error)
    return NextResponse.json({ error: "Error al eliminar la carrera" }, { status: 500 })
  }
}
