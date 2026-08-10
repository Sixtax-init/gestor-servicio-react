import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireRole } from "@/lib/session.server"

// Catálogo de carreras de la institución. Mismo patrón que departamentos.
export async function GET() {
  try {
    const user = await requireRole(["main_admin"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const carreras = await sql`
      SELECT
        c.id, c.nombre, c.clave, c.activo, c.created_at,
        (SELECT COUNT(*) FROM usuarios u WHERE u.carrera_id = c.id) AS total_alumnos
      FROM carreras c
      ORDER BY c.nombre ASC
    `

    return NextResponse.json({ carreras })
  } catch (error) {
    console.error("[main-admin/carreras] GET:", error)
    return NextResponse.json({ error: "Error al obtener carreras" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(["main_admin"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const { nombre, clave } = await request.json()

    if (!nombre?.trim() || !clave?.trim()) {
      return NextResponse.json({ error: "El nombre y la clave son requeridos" }, { status: 400 })
    }

    const [existente] = await sql`
      SELECT id FROM carreras
      WHERE lower(nombre) = ${nombre.trim().toLowerCase()}
         OR lower(clave)  = ${clave.trim().toLowerCase()}
    `
    if (existente) {
      return NextResponse.json({ error: "Ya existe una carrera con ese nombre o clave" }, { status: 409 })
    }

    const [carrera] = await sql`
      INSERT INTO carreras (nombre, clave)
      VALUES (${nombre.trim()}, ${clave.trim().toUpperCase()})
      RETURNING *
    `

    return NextResponse.json({ carrera }, { status: 201 })
  } catch (error) {
    console.error("[main-admin/carreras] POST:", error)
    return NextResponse.json({ error: "Error al crear la carrera" }, { status: 500 })
  }
}
