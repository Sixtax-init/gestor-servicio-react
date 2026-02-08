import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireRole } from "@/lib/session.server"

// Obtener todos los departamentos
export async function GET() {
    try {
        const user = await requireRole(["main_admin"])
        if (!user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const result = await sql`
      SELECT id, nombre, codigo, descripcion, activo, created_at, 
      (SELECT COUNT(*) FROM usuarios WHERE departamento_id = departamentos.id) as total_usuarios,
      (SELECT COUNT(*) FROM cursos WHERE departamento_id = departamentos.id) as total_cursos
      FROM departamentos
      ORDER BY nombre ASC
    `

        return NextResponse.json({ departamentos: result })
    } catch (error) {
        console.error("[main-admin] Error fetching departamentos:", error)
        return NextResponse.json({ error: "Error al obtener departamentos" }, { status: 500 })
    }
}

// Crear nuevo departamento
export async function POST(request: NextRequest) {
    try {
        const user = await requireRole(["main_admin"])
        if (!user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const body = await request.json()
        const { nombre, codigo, descripcion } = body

        if (!nombre || !codigo) {
            return NextResponse.json({ error: "Nombre y código son requeridos" }, { status: 400 })
        }

        const result = await sql`
      INSERT INTO departamentos (nombre, codigo, descripcion, activo)
      VALUES (${nombre}, ${codigo}, ${descripcion || null}, true)
      RETURNING *
    `

        return NextResponse.json({ departamento: result[0] }, { status: 201 })
    } catch (error) {
        console.error("[main-admin] Error creating departamento:", error)
        return NextResponse.json({ error: "Error al crear departamento. El nombre o código ya existe." }, { status: 400 })
    }
}
