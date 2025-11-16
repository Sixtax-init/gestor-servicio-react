"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, FilePlus2 } from "lucide-react"
import { EntregarTareaDialog } from "./entregar-tarea-dialog"
import { EntregarAvanceDialog } from "./entregar-avance-dialog"
import type { Entrega } from "@/lib/db"

interface VerTareasDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cursoId: number | null
  cursoNombre?: string
}

interface TareaConEntrega {
  id: number
  curso_id: number
  titulo: string
  descripcion: string
  fecha_vencimiento: string
  prioridad: string
  entrega_id: number | null
  entrega_estado: string | null
  fecha_entrega: string | null
}

export function VerTareasDialog({ open, onOpenChange, cursoId, cursoNombre }: VerTareasDialogProps) {
  const [tareas, setTareas] = useState<TareaConEntrega[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTarea, setSelectedTarea] = useState<TareaConEntrega | null>(null)
  const [selectedAvance, setSelectedAvance] = useState<TareaConEntrega | null>(null)

  useEffect(() => {
    if (open && cursoId) {
      fetchTareas()
    }
  }, [open, cursoId])

  const fetchTareas = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/alumno/tareas?curso_id=${cursoId}`)
      if (response.ok) {
        const data: TareaConEntrega[] = await response.json()
        setTareas(data)
      }
    } catch (error) {
      console.error("Error al obtener tareas:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Tareas del curso: {cursoNombre}</DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="animate-spin w-6 h-6 text-muted-foreground" />
              </div>
            ) : tareas.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">No hay tareas asignadas a este curso.</p>
            ) : (
              <div className="space-y-4">
                {tareas.map((tarea) => (
                  <div
                    key={tarea.id}
                    className="p-4 border rounded-lg flex justify-between items-center hover:bg-muted transition"
                  >
                    <div>
                      <h3 className="font-semibold">{tarea.titulo}</h3>
                      <p className="text-sm text-muted-foreground">{tarea.descripcion}</p>
                      <div className="flex gap-2 mt-2 text-sm">
                        {tarea.fecha_vencimiento && (
                          <Badge variant="outline">
                            Vence: {new Date(tarea.fecha_vencimiento).toLocaleDateString()}
                          </Badge>
                        )}

                        <Badge
                          variant={
                            tarea.prioridad === "alta"
                              ? "destructive"
                              : tarea.prioridad === "urgente"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          Prioridad: {tarea.prioridad}
                        </Badge>
                      </div>
                    </div>


                    <div className="flex flex-col gap-2 items-end">
                      {tarea.entrega_estado ? (
                        <Badge
                          variant={
                            tarea.entrega_estado === "pendiente"
                              ? "secondary"
                              : tarea.entrega_estado === "aprobada"
                                ? "default"
                                : tarea.entrega_estado === "rechazada"
                                  ? "destructive"
                                  : "outline"
                          }
                        >
                          {tarea.entrega_estado === "pendiente"
                            ? "Pendiente de revisión"
                            : tarea.entrega_estado === "aprobada"
                              ? "Aprobada"
                              : tarea.entrega_estado === "rechazada"
                                ? "Rechazada"
                                : "Sin estado"}
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => setSelectedTarea(tarea)}
                          className="flex items-center gap-1"
                        >
                          <FilePlus2 className="w-4 h-4" />
                          Agregar Envío
                        </Button>
                      )}
                      {
                        <Button size="sm" variant="outline" onClick={() => setSelectedAvance(tarea)}
                          className="flex items-center gap-1">
                          <FilePlus2 className="w-4 h-4" />
                          Ver/Agregar Avance
                        </Button>
                      }
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {selectedTarea && (
        <EntregarTareaDialog
          open={!!selectedTarea}
          onOpenChange={(open) => !open && setSelectedTarea(null)}
          tarea={{
            id: selectedTarea.id,
            titulo: selectedTarea.titulo,
            descripcion: selectedTarea.descripcion,
            fecha_vencimiento: selectedTarea.fecha_vencimiento,
          }}
          onSuccess={fetchTareas}
        />
      )}
      {selectedAvance && (
        <EntregarAvanceDialog
          open={!!selectedAvance}
          onOpenChange={(open) => !open && setSelectedAvance(null)}
          tareaId={selectedAvance.id}
        />
      )}
    </>
  )
}
