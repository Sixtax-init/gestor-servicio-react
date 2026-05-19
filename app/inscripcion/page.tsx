import { getSession } from "@/lib/session.server"
import { redirect } from "next/navigation"
import { CandidatoDashboard } from "@/components/inscripcion/candidato-dashboard"

export default async function InscripcionPage() {
  const user = await getSession()

  if (!user) redirect("/login")
  if (user.tipo_usuario !== "pre_candidato" && user.tipo_usuario !== "alumno") redirect("/login")

  return <CandidatoDashboard user={user} />
}
