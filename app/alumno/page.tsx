import { getSession } from "@/lib/session.server"
import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { AlumnoDashboard } from "@/components/alumno/alumno-dashboard"

export const dynamic = "force-dynamic"

export default async function AlumnoPage() {
  const user = await getSession()

  if (!user || user.tipo_usuario !== "alumno") {
    redirect("/login")
  }


  // Obtener inscripciones del alumno
  const inscripciones = await sql`
    SELECT 
      i.*,
      c.nombre_grupo,
      c.tipo,
      c.descripcion,
      u.nombre as maestro_nombre,
      u.apellidos as maestro_apellidos
    FROM inscripciones i
    INNER JOIN cursos c ON i.curso_id = c.id
    LEFT JOIN usuarios u ON c.maestro_id = u.id
    WHERE i.alumno_id = ${user.id} AND i.activo = true
    ORDER BY i.fecha_inscripcion DESC
  `



  // Calcular horas totales
  const horasTotales = inscripciones.reduce((sum, insc) => sum + (insc.horas_completadas || 0), 0)

  const stats = {
    cursosInscritos: inscripciones.length,
    horasCompletadas: horasTotales,
  }

  return (
    <AlumnoDashboard user={user} stats={stats} inscripciones={inscripciones} />
  )
}
