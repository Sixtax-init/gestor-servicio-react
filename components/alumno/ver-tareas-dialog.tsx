"use client"

import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, FilePlus2, MessageSquare, AlertCircle, ClipboardList, FileText, CheckCircle2, Clock, BookOpen } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { EntregarTareaDialog } from "./entregar-tarea-dialog"
import { EntregarAvanceDialog } from "./entregar-avance-dialog"
import { apiFetch } from "@/lib/api-client"
import { useIsMobile } from "@/hooks/use-mobile"

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
  archivo_instrucciones: string | null
  entrega_id: number | null
  entrega_estado: string | null
  fecha_entrega: string | null
  calificacion: number | null
  comentario_maestro: string | null
}

type FiltroEstado = "todas" | "pendiente" | "revisada" | "aprobada" | "rechazada"

const FILTROS: { key: FiltroEstado; label: string; icon: React.ReactNode }[] = [
  { key: "todas",     label: "Todas",     icon: <BookOpen className="w-4 h-4" /> },
  { key: "pendiente", label: "Pendientes", icon: <Clock className="w-4 h-4" /> },
  { key: "revisada",  label: "Revisadas",  icon: <MessageSquare className="w-4 h-4" /> },
  { key: "aprobada",  label: "Aprobadas",  icon: <CheckCircle2 className="w-4 h-4" /> },
  { key: "rechazada", label: "Rechazadas", icon: <AlertCircle className="w-4 h-4" /> },
]

function contarPorEstado(tareas: TareaConEntrega[], estado: FiltroEstado) {
  if (estado === "todas") return tareas.length
  if (estado === "pendiente") return tareas.filter(t => !t.entrega_estado || t.entrega_estado === "pendiente").length
  return tareas.filter(t => t.entrega_estado === estado).length
}

function filtrarTareas(tareas: TareaConEntrega[], filtro: FiltroEstado) {
  if (filtro === "todas") return tareas
  if (filtro === "pendiente") return tareas.filter(t => !t.entrega_estado || t.entrega_estado === "pendiente")
  return tareas.filter(t => t.entrega_estado === filtro)
}

export function VerTareasDialog({ open, onOpenChange, cursoId, cursoNombre }: VerTareasDialogProps) {
  const isMobile = useIsMobile()
  const [tareas, setTareas] = useState<TareaConEntrega[]>([])
  const [loading, setLoading] = useState(false)
  const [filtro, setFiltro] = useState<FiltroEstado>("todas")
  const [selectedTarea, setSelectedTarea] = useState<TareaConEntrega | null>(null)
  const [selectedAvance, setSelectedAvance] = useState<TareaConEntrega | null>(null)

  useEffect(() => {
    if (open && cursoId) {
      fetchTareas()
      setFiltro("todas")
    }
  }, [open, cursoId])

  const fetchTareas = async () => {
    setLoading(true)
    try {
      const response = await apiFetch(`/api/alumno/tareas?curso_id=${cursoId}`)
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

  const tareasFiltradas = filtrarTareas(tareas, filtro)

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={isMobile ? "h-[90dvh] p-0 flex flex-col rounded-t-2xl" : "w-full sm:max-w-2xl p-0 flex flex-col"}
        >
          {/* Header */}
          <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <SheetTitle className="text-lg">{cursoNombre}</SheetTitle>
            <SheetDescription>
              {tareas.length} {tareas.length === 1 ? "tarea asignada" : "tareas asignadas"}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Filtros */}
            <div className="px-4 py-3 border-b shrink-0">
              <div className="flex gap-1 flex-wrap">
                {FILTROS.map(({ key, label, icon }) => {
                  const count = contarPorEstado(tareas, key)
                  const activo = filtro === key
                  return (
                    <button
                      key={key}
                      onClick={() => setFiltro(key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        activo
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {icon}
                      {label}
                      {count > 0 && (
                        <span className={`ml-0.5 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                          activo
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Lista de tareas */}
            <ScrollArea className="flex-1">
              <div className="px-4 py-4">
                {loading ? (
                  <div className="flex justify-center items-center py-16">
                    <Loader2 className="animate-spin w-6 h-6 text-muted-foreground" />
                  </div>
                ) : tareasFiltradas.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-muted-foreground gap-2">
                    <ClipboardList className="h-10 w-10 opacity-40" />
                    <p className="font-medium">
                      {filtro === "todas" ? "No hay tareas asignadas" : `No hay tareas ${filtro === "pendiente" ? "pendientes" : filtro + "s"}`}
                    </p>
                    <p className="text-sm text-center">
                      {filtro === "todas"
                        ? "El maestro aún no ha creado tareas para este curso"
                        : "Prueba seleccionando otro filtro"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tareasFiltradas.map((tarea) => (
                      <div
                        key={tarea.id}
                        className="p-4 border rounded-lg flex flex-col gap-3 hover:bg-muted/50 transition-colors"
                      >
                        {/* Título y prioridad */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{tarea.titulo}</h3>
                            {tarea.descripcion && (
                              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{tarea.descripcion}</p>
                            )}
                          </div>
                          <Badge
                            variant={tarea.prioridad === "alta" || tarea.prioridad === "urgente" ? "destructive" : "secondary"}
                            className="shrink-0"
                          >
                            {tarea.prioridad}
                          </Badge>
                        </div>

                        {/* Instrucciones y fecha */}
                        <div className="flex flex-wrap gap-2 text-sm">
                          {tarea.archivo_instrucciones && (
                            <a
                              href={tarea.archivo_instrucciones}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary underline-offset-2 hover:underline"
                            >
                              <FileText className="w-3 h-3" />
                              Ver instrucciones
                            </a>
                          )}
                          {tarea.fecha_vencimiento && (
                            <Badge variant="outline" className="text-xs">
                              Vence: {new Date(tarea.fecha_vencimiento).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>

                        {/* Estado */}
                        {tarea.entrega_estado && tarea.entrega_estado !== "rechazada" && (
                          <div className="flex flex-col gap-2">
                            <Badge
                              variant="secondary"
                              className={
                                tarea.entrega_estado === "aprobada"
                                  ? "bg-green-100 text-green-700 hover:bg-green-100 border-green-200 w-fit"
                                  : tarea.entrega_estado === "revisada"
                                    ? "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 w-fit"
                                    : "w-fit"
                              }
                            >
                              {tarea.entrega_estado === "pendiente"
                                ? "Pendiente de revisión"
                                : tarea.entrega_estado === "aprobada"
                                  ? "Aprobada"
                                  : "Revisada (Puedes enviar más)"}
                            </Badge>

                            {tarea.comentario_maestro && (
                              <div className="p-3 bg-muted rounded-md border">
                                <div className="flex items-start gap-2">
                                  <MessageSquare className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Comentario del maestro:</p>
                                    <p className="text-sm break-words">{tarea.comentario_maestro}</p>
                                    {tarea.fecha_entrega && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {new Date(tarea.fecha_entrega).toLocaleString()}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Alert rechazada */}
                        {tarea.entrega_estado === "rechazada" && tarea.comentario_maestro && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Entrega rechazada</AlertTitle>
                            <AlertDescription>
                              <p className="font-medium mb-1">Comentario del maestro:</p>
                              <p>{tarea.comentario_maestro}</p>
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Botones */}
                        <div className="flex flex-col sm:flex-row gap-2 pt-1">
                          {!(tarea.entrega_estado && !["rechazada", "revisada"].includes(tarea.entrega_estado)) && (
                            <Button
                              size="sm"
                              onClick={() => setSelectedTarea(tarea)}
                              className="flex items-center justify-center gap-1.5 w-full sm:w-auto min-h-[40px]"
                            >
                              <FilePlus2 className="w-4 h-4" />
                              {tarea.entrega_estado === "rechazada" || tarea.entrega_estado === "revisada"
                                ? "Enviar Entrega Final"
                                : "Entregar"}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedAvance(tarea)}
                            disabled={tarea.entrega_estado === "aprobada" || tarea.entrega_estado === "pendiente"}
                            title={
                              tarea.entrega_estado === "aprobada"
                                ? "Tarea ya aprobada"
                                : tarea.entrega_estado === "pendiente"
                                  ? "Espera a que el maestro revise tu avance anterior"
                                  : "Ver o agregar avances parciales"
                            }
                            className="flex items-center justify-center gap-1.5 w-full sm:w-auto min-h-[40px]"
                          >
                            <FilePlus2 className="w-4 h-4" />
                            Ver/Agregar Avance
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

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
