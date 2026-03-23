import { NextResponse } from "next/server"
import { requireRole } from "@/lib/session.server"
import { sql } from "@/lib/db"

export async function GET(req: Request) {
    try {
        const user = await requireRole(["maestro"])
        if (!user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 })
        }

        const { searchParams } = new URL(req.url)
        const query = searchParams.get("q")

        if (!query || query.length < 3) {
            return NextResponse.json({ alumnos: [] })
        }

        const searchPattern = `%${query}%`

        const alumnos = await sql`
      SELECT id, nombre, apellidos, matricula, email
      FROM usuarios
      WHERE tipo_usuario = 'alumno'
      AND activo = true
      AND (
        nombre ILIKE ${searchPattern} OR
        apellidos ILIKE ${searchPattern} OR
        matricula ILIKE ${searchPattern} OR
        email ILIKE ${searchPattern}
      )
      LIMIT 10
    `

        return NextResponse.json({ alumnos })
    } catch (error) {
        console.error("Error buscando alumnos:", error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}
