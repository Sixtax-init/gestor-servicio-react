import { NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/session.server"
import { sql } from "@/lib/db"
import { REQUIRED_SERVICE_HOURS } from "@/lib/config"

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["maestro"])

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const cursoId = Number((await context.params).id)

    if (isNaN(cursoId)) {
      return NextResponse.json({ error: "ID de curso inválido" }, { status: 400 })
    }

    // 🔍 Verificar que el curso pertenece al maestro
    const curso = await sql`
      SELECT id
      FROM cursos
      WHERE id = ${cursoId}
      AND maestro_id = ${user.id}
      AND activo = true
      LIMIT 1
  `

    if (curso.length === 0) {
      return NextResponse.json({ error: "Curso no encontrado o no autorizado" }, { status: 404 })
    }

    const horasRequeridas = REQUIRED_SERVICE_HOURS

    // 👨‍🎓 Obtener alumnos inscritos con horas de la inscripción
    const alumnos = await sql`
      SELECT
        u.id,
        u.nombre,
        u.apellidos,
        u.matricula,
        u.email,
        (
          SELECT COALESCE(SUM(i2.horas_completadas), 0)
          FROM inscripciones i2
          WHERE i2.alumno_id = u.id AND i2.activo = true
        ) as horas_acumuladas
      FROM inscripciones i
      INNER JOIN usuarios u ON u.id = i.alumno_id
      WHERE i.curso_id = ${cursoId}
      AND i.activo = true
      ORDER BY u.apellidos ASC, u.nombre ASC
    `

    // Add progress calculation to each student
    const alumnosConProgreso = alumnos.map((alumno: any) => {
      const horasAcumuladas = alumno.horas_acumuladas || 0
      const progresoPorcentaje = Math.min(
        Math.round((horasAcumuladas / horasRequeridas) * 100),
        100
      )

      // Determine status
      let estado = "on_track"
      if (progresoPorcentaje >= 100) {
        estado = "completed"
      } else if (progresoPorcentaje < 50) {
        estado = "at_risk"
      }

      return {
        ...alumno,
        horas_acumuladas: horasAcumuladas,
        horas_requeridas: horasRequeridas,
        progreso_porcentaje: progresoPorcentaje,
        estado,
      }
    })

    return NextResponse.json({ alumnos: alumnosConProgreso }, { status: 200 })
  } catch (error) {
    console.error("[v0] Error al obtener alumnos:", error)
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 })
  }
}
