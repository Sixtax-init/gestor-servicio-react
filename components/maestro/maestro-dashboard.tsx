"use client"

import { useState, useEffect } from "react"
import type { SessionUser } from "@/lib/auth"
import type { Curso } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { BookOpen, ClipboardList, Users, LogOut, HelpCircle, TrendingUp, Award, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import { MisCursosTab } from "./mis-cursos-tab"
import { MisTareasTab } from "./mis-tareas-tab"
import { MisAlumnosTab } from "./mis-alumnos-tab"
import { useTour } from "@/lib/hooks/use-tour"
import { TourStep } from "@/components/ui/tour-step"
import { TourOverlay } from "@/components/ui/tour-overlay"
import { maestroTour } from "@/lib/tours/maestro-tour"
import { apiFetch } from "@/lib/api-client"

interface MaestroDashboardProps {
  user: SessionUser
  stats: {
    cursos: number
    tareas: number
    alumnos: number
  }
  cursos: Curso[]
}

export function MaestroDashboard({ user, stats, cursos }: MaestroDashboardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("cursos")
  const [progressStats, setProgressStats] = useState<any>(null)
  const [progressError, setProgressError] = useState(false)
  const tour = useTour(maestroTour, setActiveTab)

  // Fetch progress statistics
  useEffect(() => {
    const fetchProgressStats = async () => {
      try {
        const response = await apiFetch("/api/maestro/alumnos/progreso")
        if (response.ok) {
          const data = await response.json()
          setProgressStats(data)
          setProgressError(false)
        } else {
          setProgressError(true)
        }
      } catch (error) {
        console.error("Error fetching progress stats:", error)
        setProgressError(true)
      }
    }
    fetchProgressStats()
  }, [])

  const handleLogout = async () => {
    setLoading(true)
    await apiFetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden border-b bg-card" data-tour="welcome-banner">
        <div className="absolute inset-0 bg-background/10 backdrop-blur-[1px]" />
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold tracking-tight mb-2">Panel de Maestro</h1>
              <p className="text-lg opacity-90">
                Bienvenido, <span className="font-semibold">{user.nombre} {user.apellidos}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={tour.resetTour} className="shadow-lg">
                <HelpCircle className="mr-2 h-4 w-4" />
                Manual
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
        {/* Stats Cards - Show basic stats on cursos/tareas tabs */}
        {activeTab !== "alumnos" && (
          <div className="grid gap-4 md:grid-cols-3 mb-8 animate-slide-up">
            <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow" data-tour="stats-courses">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Mis Cursos</CardTitle>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.cursos}</div>
                <p className="text-xs text-muted-foreground mt-1">Cursos activos actualmente</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow" data-tour="stats-tasks">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tareas Asignadas</CardTitle>
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <ClipboardList className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.tareas}</div>
                <p className="text-xs text-muted-foreground mt-1">Tareas creadas y asignadas</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow" data-tour="stats-students">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Alumnos Inscritos</CardTitle>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.alumnos}</div>
                <p className="text-xs text-muted-foreground mt-1">En todos mis cursos</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error al cargar estadísticas de progreso */}
        {activeTab === "alumnos" && progressError && (
          <div className="mb-6 flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            No se pudieron cargar las estadísticas de progreso. Intenta recargar la página.
          </div>
        )}

        {/* Progress Stats Cards - Show only on alumnos tab */}
        {activeTab === "alumnos" && progressStats && (
          <div className="grid gap-4 md:grid-cols-3 mb-8 animate-slide-up">
            <Card className="border-l-4 border-l-orange-500 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Promedio de Horas</CardTitle>
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                  <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{progressStats.averageHours}</div>
                <p className="text-xs text-muted-foreground mt-1">Horas promedio del grupo</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tasa de Completitud</CardTitle>
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <Award className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{progressStats.completionRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {progressStats.studentsCompleted} de {progressStats.totalStudents} completados
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Alumnos en Riesgo</CardTitle>
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{progressStats.studentsAtRisk}</div>
                <p className="text-xs text-muted-foreground mt-1">Menos del 50% completado</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 p-1 bg-muted/50 rounded-xl" data-tour="tabs">
            <TabsTrigger value="cursos" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm" data-tour="tab-cursos">Mis Cursos</TabsTrigger>
            <TabsTrigger value="tareas" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm" data-tour="tab-tareas">Tareas</TabsTrigger>
            <TabsTrigger value="alumnos" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm" data-tour="tab-alumnos">Alumnos</TabsTrigger>
          </TabsList>

          <div className="animate-fade-in">
            <TabsContent value="cursos" className="mt-0">
              <MisCursosTab cursos={cursos} />
            </TabsContent>

            <TabsContent value="tareas" className="mt-0">
              <MisTareasTab />
            </TabsContent>

            <TabsContent value="alumnos" className="mt-0">
              <MisAlumnosTab />
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
