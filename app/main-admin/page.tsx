import { redirect } from "next/navigation"
import { getSession } from "@/lib/session.server"
import { MainAdminDashboard } from "@/components/main-admin/main-admin-dashboard"

export default async function MainAdminPage() {
    const user = await getSession()

    // Solo permitir el acceso si es main_admin
    if (!user || user.tipo_usuario !== "main_admin") {
        redirect("/login")
    }

    return <MainAdminDashboard user={user} />
}
