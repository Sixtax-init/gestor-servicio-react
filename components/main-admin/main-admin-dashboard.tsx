"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
    Building2,
    Users,
    BookOpen,
    Clock,
    LogOut,
    HelpCircle,
    LayoutDashboard,
    Settings,
    ShieldAlert,
    GraduationCap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { DepartamentosTab } from "./departamentos-tab"
import { UsuariosTab } from "../admin/usuarios-tab"
import { CursosTab } from "../admin/cursos-tab"
import { InstitucionTab } from "./institucion-tab"
import { InscripcionTab } from "../admin/inscripcion/inscripcion-tab"
import type { SessionUser } from "@/lib/auth"
import { apiFetch } from "@/lib/api-client"

interface MainAdminDashboardProps {
    user: SessionUser
}

interface Stats {
    global: {
        total_usuarios: number
        total_cursos: number
        total_departamentos: number
        total_horas: number
    }
}

export function MainAdminDashboard({ user }: MainAdminDashboardProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [stats, setStats] = useState<Stats | null>(null)
    const [activeTab, setActiveTab] = useState("departamentos")

    const fetchStats = async () => {
        try {
            const res = await apiFetch("/api/main-admin/stats")
            const data = await res.json()
            setStats(data)
        } catch (error) {
            console.error("Error fetching stats:", error)
        }
    }

    useEffect(() => {
        fetchStats()
    }, [])

    const handleLogout = async () => {
        setLoading(true)
        await apiFetch("/api/auth/logout", { method: "POST" })
        router.push("/login")
    }

    return (
        <div className="min-h-screen bg-background animate-fade-in">
            {/* Welcome Banner */}
            <div className="relative overflow-hidden border-b bg-card">
                <div className="absolute inset-0 bg-blue-500/5 backdrop-blur-[1px]" />
                <div className="container mx-auto px-4 py-8 relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200">
                                    <ShieldAlert className="h-3 w-3 mr-1" /> Administrador Global
                                </Badge>
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight mb-2">Panel Institucional</h1>
                            <p className="text-lg opacity-90">
                                Bienvenido, <span className="font-semibold">{user.nombre} {user.apellidos}</span>
                            </p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2">
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
                <div className="grid gap-4 md:grid-cols-4 mb-8">
                    <Card className="border-l-4 border-l-blue-500 shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Departamentos</CardTitle>
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats?.global.total_departamentos || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">Áreas registradas</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500 shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Usuarios</CardTitle>
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                                <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats?.global.total_usuarios || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">En toda la institución</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-500 shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Cursos</CardTitle>
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                                <BookOpen className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats?.global.total_cursos || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">Cursos y talleres activos</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-amber-500 shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Horas</CardTitle>
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats?.global.total_horas || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">Horas de servicio social acumuladas</p>
                        </CardContent>
                    </Card>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 lg:w-[750px] p-1 bg-muted/50 rounded-xl h-auto gap-1">
                        <TabsTrigger value="departamentos" className="rounded-lg">
                            <Building2 className="h-4 w-4 mr-2" />
                            Departamentos
                        </TabsTrigger>
                        <TabsTrigger value="usuarios" className="rounded-lg">
                            <Users className="h-4 w-4 mr-2" />
                            Usuarios
                        </TabsTrigger>
                        <TabsTrigger value="cursos" className="rounded-lg">
                            <BookOpen className="h-4 w-4 mr-2" />
                            Cursos
                        </TabsTrigger>
                        <TabsTrigger value="inscripcion" className="rounded-lg">
                            <GraduationCap className="h-4 w-4 mr-2" />
                            Inscripción
                        </TabsTrigger>
                        <TabsTrigger value="configuracion" className="rounded-lg">
                            <Settings className="h-4 w-4 mr-2" />
                            Institución
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="departamentos" className="animate-fade-in mt-0">
                        <DepartamentosTab />
                    </TabsContent>

                    <TabsContent value="usuarios" className="animate-fade-in mt-0">
                        <UsuariosTab isAdminGlobal={true} />
                    </TabsContent>

                    <TabsContent value="cursos" className="animate-fade-in mt-0">
                        <CursosTab isAdminGlobal={true} />
                    </TabsContent>

                    <TabsContent value="inscripcion" className="animate-fade-in mt-0">
                        <InscripcionTab />
                    </TabsContent>

                    <TabsContent value="configuracion" className="mt-0">
                        <InstitucionTab />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    )
}

function Badge({ children, className, variant }: { children: React.ReactNode, className?: string, variant?: string }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${className}`}>
            {children}
        </span>
    )
}
