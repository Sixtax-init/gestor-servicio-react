import { getSession } from "@/lib/session.server"
import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export default async function AdminPage() {
  const user = await getSession()

  if (!user || user.tipo_usuario !== "administrador") {
    redirect("/login")
  }

  // Obtener estadísticas
  const [usuariosResult, cursosResult, tareasResult] = await Promise.all([
    sql`SELECT COUNT(*) as total FROM usuarios WHERE activo = true`,
    sql`SELECT COUNT(*) as total FROM cursos WHERE activo = true`,
    sql`SELECT COUNT(*) as total FROM tareas WHERE activo = true`,
  ])

  const stats = {
    usuarios: Number(usuariosResult[0].total),
    cursos: Number(cursosResult[0].total),
    tareas: Number(tareasResult[0].total),
  }

  return <AdminDashboard user={user} stats={stats} />
}
