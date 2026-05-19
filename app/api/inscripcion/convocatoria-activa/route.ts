import { NextResponse } from "next/server"
import { requireRole } from "@/lib/session.server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const user = await requireRole(["pre_candidato", "alumno", "administrador", "main_admin"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const [convocatoria] = await sql`
      SELECT
        id, nombre, descripcion, estado,
        fecha_inicio_registro, fecha_fin_registro,
        fecha_platica,
        fecha_inicio_seleccion, fecha_fin_seleccion,
        fecha_inicio_repechaje, fecha_fin_repechaje
      FROM convocatorias
      WHERE activo = true AND estado IN ('activa', 'en_seleccion', 'repechaje')
      ORDER BY created_at DESC
      LIMIT 1
    `

    if (!convocatoria) {
      return NextResponse.json({ convocatoria: null })
    }

    return NextResponse.json({ convocatoria })
  } catch (error) {
    console.error("[inscripcion/convocatoria-activa] GET:", error)
    return NextResponse.json({ error: "Error al obtener convocatoria" }, { status: 500 })
  }
}
