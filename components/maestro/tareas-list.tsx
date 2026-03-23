"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, ClipboardList, Calendar, Clock, Users, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { EditTareaDialog } from "./edit-tarea-dialog"
import { DeleteConfirmDialog } from "../admin/delete-confirm-dialog"
import { VerEntregasDialog } from "./ver-entregas-dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { apiFetch } from "@/lib/api-client"

interface Tarea {
  id: number
  titulo: string
  descripcion: string
  prioridad: string
  fecha_vencimiento: string
  asignacion_horas: number | null
  limite_alumnos: number | null
  archivo_instrucciones: string | null
  curso_nombre: string
  curso_tipo: string
  total_entregas: number
  entregas_pendientes: number
  activo: boolean
}

export function TareasList() {
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTarea, setEditingTarea] = useState<Tarea | null>(null)
  const [deletingTarea, setDeletingTarea] = useState<Tarea | null>(null)
  const [viewingEntregas, setViewingEntregas] = useState<Tarea | null>(null)
  const [page, setPage] = useState(1)
  const COURSES_PER_PAGE = 5

  useEffect(() => {
    fetchTareas()
  }, [])

  const fetchTareas = async () => {
    try {
      const response = await apiFetch("/api/maestro/tareas")
      if (response.ok) {
        const data = await response.json()
        setTareas(data)
      }
    } catch (error) {
      console.error("Error al cargar tareas:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingTarea) return

    try {
      const response = await apiFetch(`/api/maestro/tareas/${deletingTarea.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setTareas(tareas.filter((t) => t.id !== deletingTarea.id))
        setDeletingTarea(null)
      }
    } catch (error) {
      console.error("Error al eliminar tarea:", error)
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Cargando tareas...</span>
      </div>
    )
  }

  if (tareas.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-muted-foreground gap-2">
        <ClipboardList className="h-10 w-10 opacity-40" />
        <p className="font-medium">No hay tareas creadas</p>
        <p className="text-sm">Crea tu primera tarea para comenzar</p>
      </div>
    )
  }

  const groupedTareas = tareas.reduce((acc, tarea) => {
    if (!acc[tarea.curso_nombre]) acc[tarea.curso_nombre] = []
    acc[tarea.curso_nombre].push(tarea)
    return acc
  }, {} as Record<string, Tarea[]>)

  const allGroups = Object.entries(groupedTareas)
  const totalPages = Math.ceil(allGroups.length / COURSES_PER_PAGE)
  const pagedGroups = allGroups.slice((page - 1) * COURSES_PER_PAGE, page * COURSES_PER_PAGE)

  return (
    <>
      <Accordion type="multiple" className="w-full space-y-4">
        {pagedGroups.map(([cursoNombre, cursoTareas], index) => (
          <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-4 bg-card">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-4 text-left">
                <span className="font-semibold text-lg">{cursoNombre}</span>
                <Badge variant="secondary" className="ml-2">
                  {cursoTareas.length} tareas
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-4">
              <div className="grid gap-4">
                {cursoTareas.map((tarea) => (
                  <Card key={tarea.id} className="border-l-4 border-l-primary/50">
                    <CardContent className="pt-6">
                      <div className="flex flex-col gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{tarea.titulo}</h3>
                            <Badge variant={getPrioridadColor(tarea.prioridad)}>{tarea.prioridad}</Badge>
                            {!tarea.activo && <Badge variant="outline">Inactiva</Badge>}
                          </div>

                          <p className="text-sm text-muted-foreground mb-3">{tarea.descripcion}</p>

                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                Vence: {tarea.fecha_vencimiento
                                  ? new Date(tarea.fecha_vencimiento).toLocaleDateString()
                                  : "Sin fecha"}
                              </span>
                            </div>

                            {tarea.asignacion_horas && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{tarea.asignacion_horas} horas</span>
                              </div>
                            )}

                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{tarea.total_entregas} entregas</span>
                              {tarea.entregas_pendientes > 0 && (
                                <Badge variant="secondary" className="ml-1">
                                  {tarea.entregas_pendientes} pendientes
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3 sm:gap-2 justify-end sm:justify-start">
                          <Button variant="outline" size="icon" onClick={() => setViewingEntregas(tarea)} title="Ver entregas" className="min-h-[44px] min-w-[44px]">
                            <ClipboardList className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => setEditingTarea(tarea)} title="Editar tarea" className="min-h-[44px] min-w-[44px]">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => setDeletingTarea(tarea)} title="Eliminar tarea" className="min-h-[44px] min-w-[44px]">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 mt-4">
          <div className="text-sm text-muted-foreground">Página {page} de {totalPages}</div>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />Anterior
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Siguiente<ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {editingTarea && (
        <EditTareaDialog
          tarea={editingTarea}
          open={!!editingTarea}
          onOpenChange={(open) => !open && setEditingTarea(null)}
          onSuccess={() => {
            fetchTareas()
            setEditingTarea(null)
          }}
        />
      )}

      {deletingTarea && (
        <DeleteConfirmDialog
          open={!!deletingTarea}
          onOpenChange={(open) => !open && setDeletingTarea(null)}
          onConfirm={handleDelete}
          title="Eliminar tarea"
          description={`¿Estás seguro de que deseas eliminar la tarea "${deletingTarea.titulo}"? Esta acción también eliminará todas las entregas asociadas.`}
        />
      )}

      {viewingEntregas && (
        <VerEntregasDialog
          tarea={viewingEntregas}
          open={!!viewingEntregas}
          onOpenChange={(open) => !open && setViewingEntregas(null)}
        />
      )}
    </>
  )
}