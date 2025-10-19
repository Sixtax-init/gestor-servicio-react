import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { MaestroDashboard } from "@/components/maestro/maestro-dashboard"

export default async function MaestroPage() {
  const user = await getSession()

  if (!user || user.tipo_usuario !== "maestro") {
    redirect("/login")
  }

  // Obtener cursos del maestro
  const cursos = await sql`
    SELECT * FROM cursos 
    WHERE maestro_id = ${user.id} AND activo = true
    ORDER BY created_at DESC
  `

  // Obtener estadísticas
  const [tareasResult, alumnosResult] = await Promise.all([
    sql`
      SELECT COUNT(*) as total 
      FROM tareas t
      INNER JOIN cursos c ON t.curso_id = c.id
      WHERE c.maestro_id = ${user.id} AND t.activo = true
    `,
    sql`
      SELECT COUNT(DISTINCT i.alumno_id) as total
      FROM inscripciones i
      INNER JOIN cursos c ON i.curso_id = c.id
      WHERE c.maestro_id = ${user.id} AND i.activo = true
    `,
  ])

  const stats = {
    cursos: cursos.length,
    tareas: Number(tareasResult[0].total),
    alumnos: Number(alumnosResult[0].total),
  }

  return <MaestroDashboard user={user} stats={stats} cursos={cursos} />
}
