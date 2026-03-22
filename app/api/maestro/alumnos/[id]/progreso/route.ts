import { NextResponse } from "next/server"
import { requireRole } from "@/lib/session.server"
import { sql } from "@/lib/db"
import { REQUIRED_SERVICE_HOURS } from "@/lib/config"

/**
 * GET /api/maestro/alumnos/[id]/progreso
 * Returns detailed progress information for a specific student
 */
export async function GET(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireRole(["maestro"])

        if (!user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const studentId = Number((await context.params).id)

        if (isNaN(studentId)) {
            return NextResponse.json({ error: "ID de alumno inválido" }, { status: 400 })
        }

        // Verify student is enrolled in at least one of teacher's courses
        const enrollment = await sql`
      SELECT COUNT(*) as count
      FROM inscripciones i
      INNER JOIN cursos c ON c.id = i.curso_id
      WHERE i.alumno_id = ${studentId}
      AND c.maestro_id = ${user.id}
      AND c.activo = true
    `

        if (enrollment[0].count === 0) {
            return NextResponse.json({ error: "Alumno no encontrado" }, { status: 404 })
        }

        // Get student basic info with hours from inscripciones
        const student = await sql`
      SELECT
        u.id,
        u.nombre,
        u.apellidos,
        u.email,
        u.matricula,
        COALESCE(MAX(i.horas_completadas), 0) as horas_acumuladas
      FROM usuarios u
      LEFT JOIN inscripciones i ON i.alumno_id = u.id AND i.activo = true
      WHERE u.id = ${studentId}
      AND u.activo = true
      GROUP BY u.id, u.nombre, u.apellidos, u.email, u.matricula
      LIMIT 1
    `

        if (student.length === 0) {
            return NextResponse.json({ error: "Alumno no encontrado" }, { status: 404 })
        }

        const studentData = student[0]

        // Get courses the student is enrolled in (from this teacher)
        const courses = await sql`
      SELECT
        c.id,
        c.nombre_grupo as nombre,
        c.tipo
      FROM inscripciones i
      INNER JOIN cursos c ON c.id = i.curso_id
      WHERE i.alumno_id = ${studentId}
      AND c.maestro_id = ${user.id}
      AND c.activo = true
      ORDER BY c.nombre_grupo ASC
    `

        // Get recent activities (last 10 submissions/advances)
        const activities = await sql`
      SELECT
        t.titulo as actividad,
        t.descripcion,
        ea.fecha_entrega,
        t.asignacion_horas as horas_asignadas,
        ea.estado,
        c.nombre_grupo as curso
      FROM entregas_avances ea
      INNER JOIN entregas e ON e.id = ea.entrega_id
      INNER JOIN tareas t ON t.id = e.tarea_id
      INNER JOIN cursos c ON c.id = t.curso_id
      WHERE e.alumno_id = ${studentId}
      AND c.maestro_id = ${user.id}
      ORDER BY ea.fecha_entrega DESC
      LIMIT 10
    `

        // Calculate overall progress
        const horasRequeridas = REQUIRED_SERVICE_HOURS
        const progresoPorcentaje = Math.min(
            Math.round(((studentData.horas_acumuladas || 0) / horasRequeridas) * 100),
            100
        )

        // Determine status
        let estado = "on_track"
        if (progresoPorcentaje >= 100) {
            estado = "completed"
        } else if (progresoPorcentaje < 50) {
            estado = "at_risk"
        }

        // Get last activity date
        const ultimaActividad = activities.length > 0
            ? activities[0].fecha_entrega
            : null

        return NextResponse.json({
            alumno: {
                id: studentData.id,
                nombre: studentData.nombre,
                apellidos: studentData.apellidos,
                email: studentData.email,
                matricula: studentData.matricula,
                horas_acumuladas: studentData.horas_acumuladas || 0,
            },
            progreso: {
                horas_requeridas: horasRequeridas,
                porcentaje: progresoPorcentaje,
                estado,
                ultima_actividad: ultimaActividad,
            },
            cursos: courses.map((c: any) => ({
                id: c.id,
                nombre: c.nombre,
                tipo: c.tipo,
                horas_requeridas: REQUIRED_SERVICE_HOURS,
            })),
            actividades_recientes: activities.map((a: any) => ({
                actividad: a.actividad,
                descripcion: a.descripcion,
                fecha_entrega: a.fecha_entrega,
                horas_asignadas: a.horas_asignadas || 0,
                estado: a.estado,
                curso: a.curso,
            })),
        })
    } catch (error) {
        console.error("[API] Error getting student detailed progress:", error)
        return NextResponse.json({ error: "Error en el servidor" }, { status: 500 })
    }
}
