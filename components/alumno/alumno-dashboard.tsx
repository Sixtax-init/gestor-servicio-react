"use client"

import { useState } from "react"
import type { SessionUser } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { BookOpen, Clock, GraduationCap, LogOut, HelpCircle, ClipboardList, KeyRound } from "lucide-react"
import { useRouter } from "next/navigation"
import { MisCursosAlumnoTab } from "./mis-cursos-alumno-tab"
import { MisHorasTab } from "./mis-horas-tab"
import { MisTareasTab } from "./mis-tareas-tab"
import { useTour } from "@/lib/hooks/use-tour"
import { TourStep } from "@/components/ui/tour-step"
import { TourOverlay } from "@/components/ui/tour-overlay"
import { alumnoTour } from "@/lib/tours/alumno-tour"
import { apiFetch } from "@/lib/api-client"
import { toast } from "sonner"

interface Inscripcion {
  id: number
  curso_id: number
  horas_completadas: number
  fecha_inscripcion: string
  activo: boolean
  nombre_grupo: string
  tipo: string
  maestro_id: number
}

interface AlumnoDashboardProps {
  user: SessionUser
  stats: {
    cursosInscritos: number
    horasCompletadas: number
  }
  inscripciones: Inscripcion[]
}

export function AlumnoDashboard({ user, stats, inscripciones }: AlumnoDashboardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("mis-cursos")
  const tour = useTour(alumnoTour, setActiveTab)

  const handleLogout = async () => {
    setLoading(true)
    await apiFetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  const handleSolicitarCambioPassword = async () => {
    setResetLoading(true)
    try {
      const res = await apiFetch("/api/auth/solicitar-reset-password", { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        toast.success("Correo enviado", {
          description: "Te enviamos el enlace para cambiar tu contraseña. Revisa tu bandeja de entrada y también la carpeta de spam.",
          duration: 8000,
        })
      } else {
        toast.error("Error al enviar el correo", {
          description: data.error || "Intenta de nuevo más tarde.",
        })
      }
    } catch {
      toast.error("Error de conexión", { description: "Intenta de nuevo." })
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden border-b bg-card" data-tour="welcome-banner">
        <div className="absolute inset-0 bg-background/10 backdrop-blur-[1px]" />
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold tracking-tight mb-2">Panel de Alumno</h1>
              <p className="text-lg opacity-90">
                Bienvenido, <span className="font-semibold">{user.nombre} {user.apellidos}</span>
              </p>
              <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-background/20 backdrop-blur-md border border-white/20 text-sm font-mono">
                Matrícula: {user.matricula}
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" size="sm" onClick={tour.resetTour} className="shadow-lg">
                <HelpCircle className="mr-2 h-4 w-4" />
                Manual
              </Button>
              <Button variant="outline" size="sm" onClick={handleSolicitarCambioPassword} disabled={resetLoading} className="shadow-lg">
                <KeyRound className="mr-2 h-4 w-4" />
                {resetLoading ? "Enviando..." : "Cambiar contraseña"}
              </Button>
              <Button variant="secondary" onClick={handleLogout} disabled={loading} className="shadow-lg hover:scale-105 transition-transform">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 -mt-6 relative z-20">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8 animate-slide-up">
          <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow" data-tour="stats-courses">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cursos Inscritos</CardTitle>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.cursosInscritos}</div>
              <p className="text-xs text-muted-foreground mt-1">Cursos activos actualmente</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow" data-tour="stats-hours">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Horas Completadas</CardTitle>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.horasCompletadas}</div>
              <p className="text-xs text-muted-foreground mt-1">Horas de servicio social acumuladas</p>
            </CardContent>
          </Card>

        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 p-1 bg-muted/50 rounded-xl" data-tour="tabs">
            <TabsTrigger value="mis-cursos" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2" data-tour="tab-mis-cursos">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Mis Cursos</span>
            </TabsTrigger>
            <TabsTrigger value="tareas" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2" data-tour="tab-tareas">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Mis Tareas</span>
            </TabsTrigger>
            <TabsTrigger value="horas" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2" data-tour="tab-horas">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Mis Horas</span>
            </TabsTrigger>
          </TabsList>

          <div className="animate-fade-in">
            <TabsContent value="mis-cursos" className="mt-0">
              <MisCursosAlumnoTab inscripciones={inscripciones} />
            </TabsContent>



            <TabsContent value="tareas" className="mt-0">
              <MisTareasTab />
            </TabsContent>

            <TabsContent value="horas" className="mt-0">
              <MisHorasTab inscripciones={inscripciones} />
            </TabsContent>
          </div>
        </Tabs>
      </main>

      {/* Tour Components */}
      <TourOverlay targetSelector={tour.currentStepData?.target || ""} isActive={tour.isRunning} />
      {tour.isRunning && tour.currentStepData && (
        <TourStep
          targetSelector={tour.currentStepData.target}
          title={tour.currentStepData.title}
          content={tour.currentStepData.content}
          currentStep={tour.currentStep}
          totalSteps={tour.totalSteps}
          onNext={tour.nextStep}
          onPrev={tour.prevStep}
          onSkip={tour.skipTour}
          isActive={tour.isRunning}
          placement={tour.currentStepData.placement}
        />
      )}
    </div>
  )
}
