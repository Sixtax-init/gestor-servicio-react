import { NextResponse } from "next/server"
import { requireRole } from "@/lib/session.server"
import { sql } from "@/lib/db"
import { REQUIRED_SERVICE_HOURS } from "@/lib/config"

/**
 * GET /api/maestro/alumnos/progreso
 * Returns overall progress statistics for all students taught by the teacher
 */
export async function GET() {
    try {
        const user = await requireRole(["maestro"])

        if (!user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 })
        }

        // Get all students from teacher's courses with hours from inscripciones
        const students = await sql`
      SELECT DISTINCT
        u.id,
        COALESCE(MAX(i.horas_completadas), 0) as horas_acumuladas
      FROM inscripciones i
      INNER JOIN usuarios u ON u.id = i.alumno_id
      INNER JOIN cursos c ON c.id = i.curso_id
      WHERE c.maestro_id = ${user.id}
      AND c.activo = true
      AND u.activo = true
      GROUP BY u.id
    `

        if (students.length === 0) {
            return NextResponse.json({
                totalStudents: 0,
                averageHours: 0,
                completionRate: 0,
                studentsAtRisk: 0,
                studentsCompleted: 0,
            })
        }

        // Calculate statistics
        const totalHours = students.reduce((sum: number, s: any) => sum + (s.horas_acumuladas || 0), 0)
        const averageHours = Math.round(totalHours / students.length)

        // Count completed students (>= required hours)
        const horasRequeridas = REQUIRED_SERVICE_HOURS
        const studentsCompleted = students.filter((s: any) => {
            return (s.horas_acumuladas || 0) >= horasRequeridas
        }).length

        const completionRate = Math.round((studentsCompleted / students.length) * 100)

        // Count students at risk (< 50% of required hours)
        const studentsAtRisk = students.filter((s: any) => {
            const progress = ((s.horas_acumuladas || 0) / horasRequeridas) * 100
            return progress < 50
        }).length

        return NextResponse.json({
            totalStudents: students.length,
            averageHours,
            completionRate,
            studentsAtRisk,
            studentsCompleted,
        })
    } catch (error) {
        console.error("[API] Error getting student progress:", error)
        return NextResponse.json({ error: "Error en el servidor" }, { status: 500 })
    }
}
