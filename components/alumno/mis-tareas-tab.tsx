"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, FileText, Upload, Loader2, ClipboardList, ChevronLeft, ChevronRight, Info, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { EntregarTareaDialog } from "./entregar-tarea-dialog"
import { apiFetch } from "@/lib/api-client"

interface Tarea {
  id: number
  titulo: string
  descripcion: string
  prioridad: string
  fecha_vencimiento: string
  asignacion_horas: number | null
  archivo_instrucciones: string | null
  curso_nombre: string
  entrega_id: number | null
  entrega_estado: string | null
  fecha_entrega: string | null
  calificacion: number | null
}

export function MisTareasTab() {
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [loading, setLoading] = useState(true)
  const [entregandoTarea, setEntregandoTarea] = useState<Tarea | null>(null)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 8

  useEffect(() => {
    fetchTareas()
  }, [])
  const fetchTareas = async () => {
    setLoading(true)
    try {
      const response = await apiFetch("/api/alumno/tareas")
      if (response.ok) {
        const data: Tarea[] = await response.json()
        setTareas(data)
      }
    } catch (error) {
      console.error("Error al obtener tareas:", error)
    } finally {
      setLoading(false)
    }
  }

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case "urgente":
        return "destructive"
      case "alta":
        return "default"
      case "media":
        return "secondary"
      case "baja":
        return "outline"
      default:
        return "outline"
    }
  }

  const getEstadoColor = (estado: string | null) => {
    if (!estado) return "outline"
    switch (estado) {
      case "pendiente":
        return "secondary"
      case "aprobada":
        return "default"
      case "rechazada":
        return "destructive"
      case "revisada":
        return "outline"
      default:
        return "outline"
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Cargando tareas...</span>
      </div>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Mis Tareas</CardTitle>
          <CardDescription>Tareas de tus cursos inscritos</CardDescription>
        </CardHeader>
        <CardContent>
          {tareas.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground gap-2">
              <ClipboardList className="h-10 w-10 opacity-40" />
              <p className="font-medium">No tienes tareas asignadas</p>
              <p className="text-sm">Las tareas aparecerán aquí cuando tus maestros las asignen</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert className="bg-primary/5 border-primary/20">
                <Info className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary font-semibold">Información sobre Entregas</AlertTitle>
                <AlertDescription className="text-sm">
                  Al enviar un avance parcial, el botón de envío se bloqueará temporalmente. El maestro debe **revisar** tu avance para habilitar el siguiente envío. Si es tu entrega final, marca la casilla correspondiente al subir tu archivo.
                </AlertDescription>
              </Alert>

              {tareas.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((tarea) => (
                <Card key={tarea.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{tarea.titulo}</h3>
                          <Badge variant={getPrioridadColor(tarea.prioridad)}>{tarea.prioridad}</Badge>
                          {tarea.entrega_estado && (
                            <Badge variant={getEstadoColor(tarea.entrega_estado)}>{tarea.entrega_estado}</Badge>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground mb-3">{tarea.descripcion}</p>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                          {tarea.fecha_vencimiento && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>Vence: {new Date(tarea.fecha_vencimiento).toLocaleString()}</span>
                            </div>
                          )}

                          {tarea.asignacion_horas && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{tarea.asignacion_horas} horas</span>
                            </div>
                          )}
                        </div>

                        {tarea.archivo_instrucciones && (
                          <div className="flex items-center gap-2 text-sm mb-3">
                            <FileText className="h-4 w-4" />
                            <a
                              href={tarea.archivo_instrucciones}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              Ver instrucciones
                            </a>
                          </div>
                        )}

                        <Badge variant="outline">{tarea.curso_nombre}</Badge>

                        {tarea.calificacion !== null && (
                          <div className="mt-3 pt-3 border-t">
                            <span className="text-sm font-medium">Calificación: {tarea.calificacion}/100</span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end">
                        <Button
                          onClick={() => setEntregandoTarea(tarea)}
                          disabled={tarea.entrega_estado === "pendiente" || tarea.entrega_estado === "aprobada"}
                          className="w-full sm:w-auto"
                        >

                          <Upload className="mr-2 h-4 w-4" />
                          {tarea.entrega_id ? (tarea.entrega_estado === 'rechazada' ? 'Reenviar' : 'Reenviar') : 'Entregar'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {tareas.length > PAGE_SIZE && (
                <div className="flex items-center justify-end space-x-2 pt-2">
                  <span className="text-sm text-muted-foreground">
                    Página {page} de {Math.ceil(tareas.length / PAGE_SIZE)}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="h-4 w-4" />Anterior
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(Math.ceil(tareas.length / PAGE_SIZE), p + 1))} disabled={page === Math.ceil(tareas.length / PAGE_SIZE)}>
                    Siguiente<ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {entregandoTarea && (
        <EntregarTareaDialog
          tarea={entregandoTarea}
          open={!!entregandoTarea}
          onOpenChange={(open) => !open && setEntregandoTarea(null)}
          onSuccess={() => {
            fetchTareas()
            setEntregandoTarea(null)
          }}
        />
      )}
    </>
  )
}
