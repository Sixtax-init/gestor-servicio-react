"use client"

import { useState } from "react"
import type { SessionUser } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Users, BookOpen, ClipboardList, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { UsuariosTab } from "./usuarios-tab"
import { CursosTab } from "./cursos-tab"
import { TareasTab } from "./tareas-tab"

interface AdminDashboardProps {
  user: SessionUser
  stats: {
    usuarios: number
    cursos: number
    tareas: number
  }
}

export function AdminDashboard({ user, stats }: AdminDashboardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden border-b bg-card">
        <div className="absolute inset-0 bg-background/10 backdrop-blur-[1px]" />
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold tracking-tight mb-2">Panel de Administración</h1>
              <p className="text-lg opacity-90">
                Bienvenido, <span className="font-semibold">{user.nombre} {user.apellidos}</span>
              </p>
            </div>
            <Button variant="secondary" onClick={handleLogout} disabled={loading} className="shadow-lg hover:scale-105 transition-transform">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 -mt-6 relative z-20">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8 animate-slide-up">
          <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Usuarios</CardTitle>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.usuarios}</div>
              <p className="text-xs text-muted-foreground mt-1">Usuarios activos en el sistema</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Cursos</CardTitle>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                <BookOpen className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.cursos}</div>
              <p className="text-xs text-muted-foreground mt-1">Cursos y servicios sociales</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Tareas</CardTitle>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <ClipboardList className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.tareas}</div>
              <p className="text-xs text-muted-foreground mt-1">Tareas asignadas en total</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="usuarios" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 p-1 bg-muted/50 rounded-xl">
            <TabsTrigger value="usuarios" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Usuarios</TabsTrigger>
            <TabsTrigger value="cursos" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Cursos</TabsTrigger>
            <TabsTrigger value="tareas" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Tareas</TabsTrigger>
          </TabsList>

          <div className="animate-fade-in">
            <TabsContent value="usuarios" className="mt-0">
              <UsuariosTab />
            </TabsContent>

            <TabsContent value="cursos" className="mt-0">
              <CursosTab />
            </TabsContent>

            <TabsContent value="tareas" className="mt-0">
              <TareasTab />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  )
}
