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
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id } = await params
    const alumnoId = Number(id)
    if (!Number.isInteger(alumnoId) || alumnoId <= 0) {
      return NextResponse.json({ error: "Identificador inválido" }, { status: 400 })
    }

    // Las horas viven en las inscripciones a cursos; `usuarios.horas_acumuladas`
    // no existe en el esquema y hacía que esta ruta devolviera 500 siempre.
    const alumno = await sql`
      SELECT
        u.id,
        u.matricula,
        u.nombre,
        u.apellidos,
        u.departamento_id,
        COALESCE((
          SELECT SUM(i.horas_completadas)
          FROM inscripciones i
          WHERE i.alumno_id = u.id AND i.activo = true
        ), 0) AS horas_acumuladas
      FROM usuarios u
      WHERE u.id = ${alumnoId}
      AND u.tipo_usuario = 'alumno'
      AND u.activo = true
    `

    if (alumno.length === 0) {
      return NextResponse.json({ error: "Alumno no encontrado" }, { status: 404 })
    }

    // Antes bastaba con tener sesión para leer a cualquier alumno: un alumno
    // podía recorrer los ids y sacar matrícula, nombre y horas de todos.
    // Ahora sólo pasan quienes tienen una relación real con ese alumno.
    const esElMismo = session.id === alumnoId
    const esMainAdmin = session.tipo_usuario === "main_admin"
    const esAdminDeSuDepto =
      session.tipo_usuario === "administrador" &&
      session.departamento_id != null &&
      session.departamento_id === alumno[0].departamento_id

    let esSuMaestro = false
    if (!esElMismo && !esMainAdmin && !esAdminDeSuDepto && session.tipo_usuario === "maestro") {
      const [vinculo] = await sql`
        SELECT 1
        FROM inscripciones i
        JOIN cursos c ON c.id = i.curso_id
        WHERE i.alumno_id = ${alumnoId}
          AND c.maestro_id = ${session.id}
          AND i.activo = true
        LIMIT 1
      `
      esSuMaestro = Boolean(vinculo)
    }

    if (!esElMismo && !esMainAdmin && !esAdminDeSuDepto && !esSuMaestro) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { departamento_id, ...datos } = alumno[0]
    return NextResponse.json(datos)
  } catch (error) {
    console.error("Error al obtener datos del alumno:", error)
    return NextResponse.json(
      { error: "Error al obtener los datos del alumno" },
      { status: 500 }
    )
  }
}
