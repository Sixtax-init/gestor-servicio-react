import { NextResponse } from "next/server"
import { getSession } from "@/lib/session.server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    console.log('Iniciando GET /api/alumno/actividades')

    // Obtener la sesión
    const session = await getSession()
    console.log('Sesión obtenida en actividades:', {
      hasSession: !!session,
      userId: session?.id,
      userType: session?.tipo_usuario
    })

    if (!session || session.tipo_usuario !== "alumno") {
      console.log('Acceso no autorizado - Sesión inválida o no es alumno')
      return NextResponse.json({
        error: "No autorizado",
        details: "Sesión inválida o usuario no es alumno"
      }, { status: 401 })
    }

    console.log(`Buscando entregas para el alumno ID: ${session.id}`)

    // Obtener títulos y descripciones de las actividades del alumno
    const actividades = await sql`
      SELECT 
        t.titulo AS actividad,
        t.descripcion
      FROM tareas t
      INNER JOIN cursos c ON t.curso_id = c.id
      INNER JOIN inscripciones i ON c.id = i.curso_id
      WHERE i.alumno_id = ${session.id}
      ORDER BY t.titulo ASC
    `

    console.log(`Total de títulos de actividades encontrados: ${actividades.length}`)
    return NextResponse.json(actividades)
  } catch (error) {
    console.error("Error al obtener actividades del alumno:", error)
    return NextResponse.json(
      {
        error: "Error al obtener las actividades del alumno",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
