"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ProgressBar } from "@/components/ui/progress-bar"
import { User, Mail, Calendar, TrendingUp, Clock } from "lucide-react"
import { apiFetch } from "@/lib/api-client"

interface StudentProgressDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    studentId: number | null
    studentName?: string
}

export function StudentProgressDialog({
    open,
    onOpenChange,
    studentId,
    studentName,
}: StudentProgressDialogProps) {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<any>(null)

    useEffect(() => {
        if (open && studentId) {
            fetchStudentProgress()
        }
    }, [open, studentId])

    const fetchStudentProgress = async () => {
        setLoading(true)
        try {
            const response = await apiFetch(`/api/maestro/alumnos/${studentId}/progreso`)
            if (response.ok) {
                const result = await response.json()
                setData(result)
            }
        } catch (error) {
            console.error("Error fetching student progress:", error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (estado: string) => {
        switch (estado) {
            case "completed":
                return <Badge variant="default" className="bg-green-500">✅ Completado</Badge>
            case "on_track":
                return <Badge variant="secondary" className="bg-blue-500 text-white">🟢 Al día</Badge>
            case "at_risk":
                return <Badge variant="destructive">🟡 En riesgo</Badge>
            default:
                return <Badge variant="outline">Sin estado</Badge>
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - date.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays === 0) return "Hoy"
        if (diffDays === 1) return "Hace 1 día"
        if (diffDays < 7) return `Hace ${diffDays} días`
        if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`
        return date.toLocaleDateString()
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Progreso de {studentName || "Alumno"}
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                ) : data ? (
                    <div className="space-y-6">
                        {/* Student Header */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-4">
                                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <User className="h-8 w-8 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-lg">
                                            {data.alumno.nombre} {data.alumno.apellidos}
                                        </h3>
                                        <div className="flex flex-col gap-1 mt-1">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Mail className="h-4 w-4" />
                                                <span className="truncate">{data.alumno.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Badge variant="outline">{data.alumno.matricula}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Overall Progress */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-semibold">Progreso General</h4>
                                        {getStatusBadge(data.progreso.estado)}
                                    </div>
                                    <ProgressBar
                                        current={data.alumno.horas_acumuladas}
                                        max={data.progreso.horas_requeridas}
                                        size="lg"
                                    />
                                    <div className="grid grid-cols-3 gap-4 pt-2">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-primary">
                                                {data.alumno.horas_acumuladas}
                                            </div>
                                            <div className="text-xs text-muted-foreground">Horas Totales</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold">
                                                {data.progreso.porcentaje}%
                                            </div>
                                            <div className="text-xs text-muted-foreground">Completado</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-muted-foreground">
                                                {data.progreso.horas_requeridas}
                                            </div>
                                            <div className="text-xs text-muted-foreground">Requeridas</div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Last Activity */}
                        {data.progreso.ultima_actividad && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>Última actividad: {formatDate(data.progreso.ultima_actividad)}</span>
                            </div>
                        )}

                        {/* Recent Activities */}
                        {data.actividades_recientes.length > 0 && (
                            <Card>
                                <CardContent className="pt-6">
                                    <h4 className="font-semibold mb-4">Actividades Recientes</h4>
                                    <div className="space-y-3">
                                        {data.actividades_recientes.slice(0, 5).map((actividad: any, index: number) => (
                                            <div
                                                key={index}
                                                className="flex items-start justify-between gap-4 pb-3 border-b last:border-0"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">{actividad.actividad}</p>
                                                    <p className="text-xs text-muted-foreground">{actividad.curso}</p>
                                                </div>
                                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                    <Badge variant="outline" className="text-xs">
                                                        {actividad.horas_asignadas} hrs
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDate(actividad.fecha_entrega)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Courses */}
                        {data.cursos.length > 0 && (
                            <Card>
                                <CardContent className="pt-6">
                                    <h4 className="font-semibold mb-4">Cursos Inscritos</h4>
                                    <div className="space-y-2">
                                        {data.cursos.map((curso: any) => (
                                            <div
                                                key={curso.id}
                                                className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                            >
                                                <div>
                                                    <p className="font-medium text-sm">{curso.nombre}</p>
                                                    <p className="text-xs text-muted-foreground capitalize">{curso.tipo}</p>
                                                </div>
                                                <Badge variant="secondary">{curso.horas_requeridas} hrs</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        No se pudo cargar la información del alumno
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
