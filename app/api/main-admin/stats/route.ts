import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireRole } from "@/lib/session.server"

// Obtener estadísticas globales para el Main Admin
export async function GET() {
    try {
        const user = await requireRole(["main_admin"])
        if (!user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 })
        }

        const [statsResult, deptStatsResult] = await Promise.all([
            sql`
        SELECT 
          (SELECT COUNT(*) FROM usuarios WHERE activo = true) as total_usuarios,
          (SELECT COUNT(*) FROM cursos WHERE activo = true) as total_cursos,
          (SELECT COUNT(*) FROM departamentos WHERE activo = true) as total_departamentos,
          (SELECT COALESCE(SUM(horas_completadas), 0) FROM inscripciones WHERE activo = true) as total_horas
      `,
            sql`
        SELECT 
          d.nombre,
          d.codigo,
          (SELECT COUNT(*) FROM usuarios u WHERE u.departamento_id = d.id AND u.activo = true) as usuarios,
          (SELECT COUNT(*) FROM cursos c WHERE c.departamento_id = d.id AND c.activo = true) as cursos
        FROM departamentos d
        WHERE d.activo = true
      `
        ])

        const stats = {
            global: statsResult[0],
            por_departamento: deptStatsResult
        }

        return NextResponse.json(stats)
    } catch (error) {
        console.error("[main-admin] Error fetching global stats:", error)
        return NextResponse.json({ error: "Error al obtener estadísticas globales" }, { status: 500 })
    }
}
