"use client"

import { useState } from "react"
import type { SessionUser } from "@/lib/auth"
import type { Curso } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { BookOpen, ClipboardList, Users, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { MisCursosTab } from "./mis-cursos-tab"
import { MisTareasTab } from "./mis-tareas-tab"
import { MisAlumnosTab } from "./mis-alumnos-tab"

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
            <h1 className="text-2xl font-bold">Panel de Maestro</h1>
            <p className="text-sm text-muted-foreground">
              Bienvenido, {user.nombre} {user.apellidos}
            </p>
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
              <CardTitle className="text-sm font-medium">Mis Cursos</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.cursos}</div>
              <p className="text-xs text-muted-foreground">Cursos activos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tareas Asignadas</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.tareas}</div>
              <p className="text-xs text-muted-foreground">Tareas creadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alumnos Inscritos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.alumnos}</div>
              <p className="text-xs text-muted-foreground">En todos mis cursos</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="cursos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="cursos">Mis Cursos</TabsTrigger>
            <TabsTrigger value="tareas">Tareas</TabsTrigger>
            <TabsTrigger value="alumnos">Alumnos</TabsTrigger>
          </TabsList>

          <TabsContent value="cursos">
            <MisCursosTab cursos={cursos} />
          </TabsContent>

          <TabsContent value="tareas">
            <MisTareasTab />
          </TabsContent>

          <TabsContent value="alumnos">
            <MisAlumnosTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
