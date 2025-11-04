import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/session"
import { sql } from "@/lib/db"

// ✅ Obtener los cursos del maestro
export async function GET() {
  try {
    const user = await requireRole(["maestro"])

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const cursos = await sql`
      SELECT id, nombre_grupo
      FROM cursos
      WHERE maestro_id = ${user.id} AND activo = true
      ORDER BY nombre_grupo ASC
    `

    return NextResponse.json({ cursos })
  } catch (error) {
    console.error("[v0] Error fetching cursos del maestro:", error)
    return NextResponse.json({ error: "Error al obtener cursos" }, { status: 500 })
  }
}

// ✅ Crear nuevo curso
export async function POST(request: NextRequest) {
  const user = await requireRole(["maestro"])

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { nombre_grupo, tipo, descripcion } = body

    if (!nombre_grupo || !tipo) {
      return NextResponse.json({ error: "Nombre y tipo son requeridos" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO cursos (nombre_grupo, tipo, maestro_id, descripcion, activo)
      VALUES (${nombre_grupo}, ${tipo}, ${user.id}, ${descripcion || null}, true)
      RETURNING *
    `

    return NextResponse.json({ curso: result[0] }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating curso:", error)
    return NextResponse.json({ error: "Error al crear curso" }, { status: 500 })
  }
}
