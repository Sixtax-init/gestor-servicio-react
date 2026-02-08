import { getSession } from "@/lib/session.server"
import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export default async function AdminPage() {
  const user = await getSession()

  if (!user) {
    redirect("/login")
  }

  // Si es main_admin, moverlo a su panel institucional
  if (user.tipo_usuario === "main_admin") {
    redirect("/main-admin")
  }

  if (user.tipo_usuario !== "administrador") {
    redirect("/login")
  }

  // Obtener estadísticas filtradas por departamento
  // También obtenemos el nombre del departamento
  const [usuariosResult, cursosResult, deptoResult] = await Promise.all([
    sql`SELECT COUNT(*) as total FROM usuarios WHERE activo = true AND departamento_id = ${user.departamento_id}`,
    sql`SELECT COUNT(*) as total FROM cursos WHERE activo = true AND departamento_id = ${user.departamento_id}`,
    sql`SELECT nombre FROM departamentos WHERE id = ${user.departamento_id}`
  ])

  const stats = {
    usuarios: Number(usuariosResult[0]?.total || 0),
    cursos: Number(cursosResult[0]?.total || 0),
    departamento_nombre: deptoResult[0]?.nombre || "Departamento"
  }

  return <AdminDashboard user={user} stats={stats} />
}
