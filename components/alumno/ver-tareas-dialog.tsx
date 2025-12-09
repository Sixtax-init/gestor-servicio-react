"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, FilePlus2, MessageSquare, AlertCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
  calificacion: number | null
  comentario_maestro: string | null
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
                    className="p-4 border rounded-lg flex flex-col gap-3 hover:bg-muted transition"
                  >
                    <div className="flex justify-between items-start">
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
                        {tarea.entrega_estado && tarea.entrega_estado !== 'rechazada' ? (
                          <div className="flex items-center gap-2">
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

                            {tarea.comentario_maestro && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="outline" className="cursor-help flex items-center gap-1">
                                      <MessageSquare className="w-3 h-3" />
                                      Ver comentario
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-sm">
                                    <p className="text-sm font-medium mb-1">Comentario del maestro:</p>
                                    <p className="text-sm">{tarea.comentario_maestro}</p>
                                    {tarea.fecha_entrega && (
                                      <p className="text-xs text-muted-foreground mt-2">
                                        {new Date(tarea.fecha_entrega).toLocaleString()}
                                      </p>
                                    )}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => setSelectedTarea(tarea)}
                            className="flex items-center gap-1"
                          >
                            <FilePlus2 className="w-4 h-4" />
                            {tarea.entrega_estado === 'rechazada' ? 'Reenviar' : 'Agregar Envío'}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedAvance(tarea)}
                          disabled={!!(tarea.entrega_estado && tarea.entrega_estado !== 'rechazada')}
                          title={
                            tarea.entrega_estado && tarea.entrega_estado !== 'rechazada'
                              ? "Ya has enviado una entrega final. No puedes agregar avances."
                              : "Ver o agregar avances parciales"
                          }
                          className="flex items-center gap-1"
                        >
                          <FilePlus2 className="w-4 h-4" />
                          Ver/Agregar Avance
                        </Button>
                      </div>
                    </div>

                    {/* Alert para entregas rechazadas */}
                    {tarea.entrega_estado === 'rechazada' && tarea.comentario_maestro && (
                      <Alert variant="destructive" className="w-full">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Entrega rechazada</AlertTitle>
                        <AlertDescription>
                          <p className="font-medium mb-1">Comentario del maestro:</p>
                          <p>{tarea.comentario_maestro}</p>
                        </AlertDescription>
                      </Alert>
                    )}
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
