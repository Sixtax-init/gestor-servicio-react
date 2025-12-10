// app/api/alumno/[id]/route.ts
import { NextResponse } from "next/server"
import { getSession } from "@/lib/session.server"
import { sql } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params

    const alumno = await sql`
      SELECT 
        id,
        matricula,
        nombre,
        apellidos,
        horas_acumuladas
      FROM usuarios
      WHERE id = ${id}
      AND tipo_usuario = 'alumno'
      AND activo = true
    `

    if (alumno.length === 0) {
      return NextResponse.json({ error: "Alumno no encontrado" }, { status: 404 })
    }

    return NextResponse.json(alumno[0])
  } catch (error) {
    console.error("Error al obtener datos del alumno:", error)
    return NextResponse.json(
      { error: "Error al obtener los datos del alumno" },
      { status: 500 }
    )
  }
}