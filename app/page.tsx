import { redirect } from "next/navigation"
import { getSession } from "@/lib/session.server"
import LandingPage from "./landing-page"

const DASHBOARD_BY_ROLE: Record<string, string> = {
  main_admin: "/main-admin",
  administrador: "/admin",
  maestro: "/maestro",
  alumno: "/alumno",
}

export default async function HomePage() {
  const session = await getSession()

  if (session) {
    const dest = DASHBOARD_BY_ROLE[session.tipo_usuario] ?? "/login"
    redirect(dest)
  }

  return <LandingPage />
}
