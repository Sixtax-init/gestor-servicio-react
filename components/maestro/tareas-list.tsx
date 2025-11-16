"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Eye, Calendar, Clock, Users } from "lucide-react"
import { EditTareaDialog } from "./edit-tarea-dialog"
import { DeleteConfirmDialog } from "../admin/delete-confirm-dialog"
import { VerEntregasDialog } from "./ver-entregas-dialog"

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

  useEffect(() => {
    fetchTareas()
  }, [])

  const fetchTareas = async () => {
    try {
      const response = await fetch("/api/maestro/tareas")
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
      const response = await fetch(`/api/maestro/tareas/${deletingTarea.id}`, {
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
    return <div className="text-center py-8">Cargando tareas...</div>
  }

  if (tareas.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay tareas creadas. Crea tu primera tarea para comenzar.
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-4">
        {tareas.map((tarea) => (
          <Card key={tarea.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
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

                  <div className="mt-2">
                    <Badge variant="outline">{tarea.curso_nombre}</Badge>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="icon" onClick={() => setViewingEntregas(tarea)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setEditingTarea(tarea)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setDeletingTarea(tarea)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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