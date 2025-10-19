"use client"

import { useState } from "react"
import type { SessionUser } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { BookOpen, Clock, GraduationCap, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { MisCursosAlumnoTab } from "./mis-cursos-alumno-tab"
import { CursosDisponiblesTab } from "./cursos-disponibles-tab"
import { MisHorasTab } from "./mis-horas-tab"

interface AlumnoDashboardProps {
  user: SessionUser
  stats: {
    cursosInscritos: number
    horasCompletadas: number
    cursosDisponibles: number
  }
  inscripciones: any[]
  cursosDisponibles: any[]
}

export function AlumnoDashboard({ user, stats, inscripciones, cursosDisponibles }: AlumnoDashboardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Panel de Alumno</h1>
            <p className="text-sm text-muted-foreground">
              Bienvenido, {user.nombre} {user.apellidos}
            </p>
            <p className="text-xs text-muted-foreground font-mono">Matrícula: {user.matricula}</p>
          </div>
          <Button variant="outline" onClick={handleLogout} disabled={loading}>
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cursos Inscritos</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.cursosInscritos}</div>
              <p className="text-xs text-muted-foreground">Cursos activos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Horas Completadas</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.horasCompletadas}</div>
              <p className="text-xs text-muted-foreground">Horas de servicio social</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cursos Disponibles</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.cursosDisponibles}</div>
              <p className="text-xs text-muted-foreground">Para inscribirse</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="mis-cursos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="mis-cursos">Mis Cursos</TabsTrigger>
            <TabsTrigger value="disponibles">Cursos Disponibles</TabsTrigger>
            <TabsTrigger value="horas">Mis Horas</TabsTrigger>
          </TabsList>

          <TabsContent value="mis-cursos">
            <MisCursosAlumnoTab inscripciones={inscripciones} />
          </TabsContent>

          <TabsContent value="disponibles">
            <CursosDisponiblesTab cursos={cursosDisponibles} />
          </TabsContent>

          <TabsContent value="horas">
            <MisHorasTab inscripciones={inscripciones} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
