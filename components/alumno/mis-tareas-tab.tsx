"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, FileText, Upload } from "lucide-react"
import { EntregarTareaDialog } from "./entregar-tarea-dialog"

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

  useEffect(() => {
    fetchTareas()
  }, [])
 const fetchTareas = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/alumno/tareas")
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
    return <div className="text-center py-8">Cargando tareas...</div>
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
            <div className="text-center py-8 text-muted-foreground">No tienes tareas asignadas</div>
          ) : (
            <div className="space-y-4">
              {tareas.map((tarea) => (
                <Card key={tarea.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{tarea.titulo}</h3>
                          <Badge variant={getPrioridadColor(tarea.prioridad)}>{tarea.prioridad}</Badge>
                          {tarea.entrega_estado && (
                            <Badge variant={getEstadoColor(tarea.entrega_estado)}>{tarea.entrega_estado}</Badge>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground mb-3">{tarea.descripcion}</p>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Vence: {new Date(tarea.fecha_vencimiento).toLocaleString()}</span>
                          </div>

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

                      <div className="ml-4">
                        <Button
                          onClick={() => setEntregandoTarea(tarea)}
                          disabled={tarea.entrega_estado === "pendiente" || tarea.entrega_estado === "aprobada"}
                        >

                          <Upload className="mr-2 h-4 w-4" />
                          {tarea.entrega_id ? "Reenviar" : "Entregar"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
