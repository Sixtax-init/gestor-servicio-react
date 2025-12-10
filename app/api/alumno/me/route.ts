import { NextResponse } from "next/server"
import { getSession } from "@/lib/session.server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.tipo_usuario !== "alumno") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Primero obtenemos los datos básicos del usuario
    const [usuario] = await sql`
      SELECT 
        id,
        matricula,
        nombre,
        apellidos,
        email,
        tipo_usuario,
        activo
      FROM usuarios
      WHERE id = ${session.id}
      AND tipo_usuario = 'alumno'
      AND activo = true
    `

    if (!usuario) {
      return NextResponse.json({ error: "Alumno no encontrado" }, { status: 404 })
    }

    // Luego obtenemos la carrera del alumno de la tabla de inscripciones
    const [inscripcion] = await sql`
      SELECT 
        c.nombre AS nombre_curso,
        c.tipo,
        i.horas_completadas
      FROM inscripciones i
      INNER JOIN cursos c ON i.curso_id = c.id
      WHERE i.alumno_id = ${session.id}
      AND i.activo = true
      LIMIT 1
    `

    // Construimos el objeto de respuesta con los datos combinados
    const response = {
      id: usuario.id,
      matricula: usuario.matricula,
      nombre: usuario.nombre,
      apellidos: usuario.apellidos,
      email: usuario.email,
      tipo_usuario: usuario.tipo_usuario,
      carrera: inscripcion?.nombre_curso || 'No especificada',
      horas_acumuladas: inscripcion?.horas_completadas || 0
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error al obtener datos del alumno:", error)
    return NextResponse.json(
      { error: "Error al obtener los datos del alumno" },
      { status: 500 }
    )
  }
}
