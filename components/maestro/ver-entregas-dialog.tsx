"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, User, FileText, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RevisarEntregaDialog } from "./RevisarEntregaDialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"



interface Tarea {
  id: number
  titulo: string
}

interface Entrega {
  id: number
  nombre: string
  apellidos: string
  matricula: string
  email: string
  fecha_entrega: string
  comentario: string
  estado: string
  calificacion: number | null
  archivo_entregado?: string | null // 👈 Nuevo campo
  archivo_ruta?: string | null    // ✅ nuevo
  archivo_nombre?: string | null  // ✅ nuevo
  tiene_avance_final: boolean
}

interface VerEntregasDialogProps {
  tarea: Tarea
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VerEntregasDialog({ tarea, open, onOpenChange }: VerEntregasDialogProps) {
  const [entregas, setEntregas] = useState<Entrega[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEntrega, setSelectedEntrega] = useState<number | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [avances, setAvances] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("pendiente")

  // Función para filtrar entregas por estado
  const getEntregasPorEstado = (estado: string) => {
    if (estado === "todas") return entregas
    return entregas.filter(e => e.estado === estado)
  }




  useEffect(() => {
    if (open) fetchEntregas()
    fetchAvances()
  }, [open, tarea.id])

  const fetchEntregas = async () => {
    try {
      const response = await fetch(`/api/maestro/tareas/${tarea.id}/entregas`)
      if (response.ok) {
        const data = await response.json()
        setEntregas(data)
      }
    } catch (error) {
      console.error("Error al cargar entregas:", error)
    } finally {
      setLoading(false)
    }
  }
  const fetchAvances = async () => {
    try {
      const response = await fetch(`/api/maestro/tareas/${tarea.id}/avances`)
      if (response.ok) {
        const data = await response.json()
        setAvances(data)
      } else {
        console.error("Error al cargar avances:", await response.text())
      }
    } catch (error) {
      console.error("Error al cargar avances:", error)
    }
  }


  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "aprobada":
        return "default"
      case "revisada":
        return "secondary"
      case "rechazada":
        return "destructive"
      default:
        return "outline"
    }
  }

  const revisarEntrega = async (entregaId: number, estado: string, comentario: string, calificacion: number) => {
    try {
      const response = await fetch(`/api/maestro/tareas/${tarea.id}/entregas/${entregaId}/revisar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado,
          comentario,
          calificacion,
        }),
      })
      if (response.ok) {
        fetchEntregas()
      }
    } catch (error) {
      console.error("Error al revisar entrega:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Entregas de: {tarea.titulo}</DialogTitle>
          <DialogDescription>
            {entregas.length} {entregas.length === 1 ? "entrega" : "entregas"} recibidas
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">Cargando entregas...</div>
        ) : entregas.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No hay entregas para esta tarea</div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-muted">
              <TabsTrigger value="pendiente" className="flex flex-col gap-1 py-2 data-[state=active]:bg-background">
                <span className="font-medium">Pendientes</span>
                <Badge variant="secondary" className="text-xs">{getEntregasPorEstado("pendiente").length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="revisada" className="flex flex-col gap-1 py-2 data-[state=active]:bg-background">
                <span className="font-medium">Revisadas</span>
                <Badge variant="secondary" className="text-xs">{getEntregasPorEstado("revisada").length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="aprobada" className="flex flex-col gap-1 py-2 data-[state=active]:bg-background">
                <span className="font-medium">Aprobadas</span>
                <Badge variant="secondary" className="text-xs">{getEntregasPorEstado("aprobada").length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="rechazada" className="flex flex-col gap-1 py-2 data-[state=active]:bg-background">
                <span className="font-medium">Rechazadas</span>
                <Badge variant="secondary" className="text-xs">{getEntregasPorEstado("rechazada").length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="todas" className="flex flex-col gap-1 py-2 data-[state=active]:bg-background">
                <span className="font-medium">Todas</span>
                <Badge variant="secondary" className="text-xs">{entregas.length}</Badge>
              </TabsTrigger>
            </TabsList>

            {["pendiente", "revisada", "aprobada", "rechazada", "todas"].map((estado) => (
              <TabsContent key={estado} value={estado} className="mt-4">
                {getEntregasPorEstado(estado).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay entregas {estado !== "todas" ? `en estado "${estado}"` : ""}
                  </div>
                ) : (
                  <Accordion type="single" collapsible className="w-full">
                    {getEntregasPorEstado(estado).map((entrega) => (
                      <AccordionItem key={entrega.id} value={String(entrega.id)}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex items-center gap-3">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{entrega.nombre} {entrega.apellidos}</span>
                              <Badge variant="outline" className="text-xs">{entrega.matricula}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={getEstadoColor(entrega.estado)}>{entrega.estado}</Badge>
                              {entrega.calificacion !== null && (
                                <Badge variant="secondary">{entrega.calificacion}/100</Badge>
                              )}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3 pt-2 px-1">
                            <p className="text-sm text-muted-foreground">{entrega.email}</p>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>Entregado: {new Date(entrega.fecha_entrega).toLocaleString()}</span>
                            </div>

                            {entrega.comentario && (
                              <div className="flex gap-2 text-sm">
                                <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <p className="text-muted-foreground">{entrega.comentario}</p>
                              </div>
                            )}

                            {entrega.archivo_ruta && (
                              <div className="flex items-center gap-2 text-sm">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <a
                                  href={entrega.archivo_ruta}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  {entrega.archivo_nombre || "Ver archivo entregado"}
                                </a>
                              </div>
                            )}

                            {entrega.calificacion !== null && (
                              <div className="pt-3 border-t">
                                <span className="text-sm font-medium">Calificación: {entrega.calificacion}/100</span>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-3">
                              <Button
                                size="sm"
                                onClick={() => {
                                  if (entrega.tiene_avance_final) {
                                    setSelectedEntrega(entrega.id)
                                    setReviewOpen(true)
                                  } else {
                                    alert("⚠️ El alumno aún no ha marcado un avance final. No se puede revisar.")
                                  }
                                }}
                                disabled={!entrega.tiene_avance_final || entrega.estado === "aprobada"}
                                title={
                                  entrega.estado === "aprobada"
                                    ? "Entrega ya aprobada (no se puede modificar)"
                                    : entrega.tiene_avance_final
                                      ? "Revisar entrega"
                                      : "El alumno no tiene un avance final (deshabilitado)"
                                }
                              >
                                Revisar
                              </Button>

                              {entrega.tiene_avance_final && (
                                <p className="text-xs text-muted-foreground">
                                  ✓ Entrega final marcada
                                </p>
                              )}
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
        {selectedEntrega && (
          <RevisarEntregaDialog
            open={reviewOpen}
            onOpenChange={(open) => {
              setReviewOpen(open)
              if (!open) setSelectedEntrega(null) // ✅ limpia la selección al cerrar
            }}
            tareaId={tarea.id}
            entregaId={selectedEntrega}
            onSuccess={fetchEntregas}
          />

        )}
        {/* 🔽 Sección de avances */}
        <hr className="my-6" />

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Avances de los alumnos</h3>
          <Badge variant="outline">{avances.length} avances totales</Badge>
        </div>

        {avances.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay avances registrados aún.
          </p>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {/* Agrupar avances por alumno */}
            {Object.entries(
              avances.reduce((acc: any, avance: any) => {
                const key = `${avance.nombre} ${avance.apellidos}`
                if (!acc[key]) {
                  acc[key] = {
                    alumno: { nombre: avance.nombre, apellidos: avance.apellidos, matricula: avance.matricula, email: avance.email },
                    avances: []
                  }
                }
                acc[key].avances.push(avance)
                return acc
              }, {})
            ).map(([nombreCompleto, data]: [string, any]) => (
              <AccordionItem key={nombreCompleto} value={nombreCompleto}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{nombreCompleto}</span>
                      <Badge variant="outline" className="text-xs">{data.alumno.matricula}</Badge>
                    </div>
                    <Badge variant="secondary">{data.avances.length} avances</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    <p className="text-sm text-muted-foreground px-1">{data.alumno.email}</p>

                    {/* Lista de avances del alumno */}
                    <div className="space-y-2">
                      {data.avances.map((avance: any, index: number) => (
                        <Card key={avance.id} className={avance.es_final ? "border-primary" : ""}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">Avance #{index + 1}</Badge>
                                {avance.es_final && <Badge variant="default">Final</Badge>}
                              </div>
                              <Badge variant="secondary" className="text-xs">{avance.estado}</Badge>
                            </div>

                            {avance.comentario && (
                              <p className="text-sm mb-2">{avance.comentario}</p>
                            )}

                            {avance.archivo_url && (
                              <a
                                href={avance.archivo_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary text-sm hover:underline flex items-center gap-1 mb-2"
                              >
                                <FileText className="h-4 w-4" />
                                Ver archivo
                              </a>
                            )}

                            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                              <span>{new Date(avance.fecha_entrega).toLocaleString()}</span>
                              {avance.horas_asignadas > 0 && (
                                <span>{avance.horas_asignadas} horas</span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

      </DialogContent>
    </Dialog>
  )
}
