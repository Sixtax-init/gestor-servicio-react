"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, User, FileText, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RevisarEntregaDialog } from "./RevisarEntregaDialog"


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
          <div className="space-y-4">
            {entregas.map((entrega) => (
              <Card key={entrega.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">
                          {entrega.nombre} {entrega.apellidos}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {entrega.matricula} • {entrega.email}
                      </p>
                    </div>
                    <Badge variant={getEstadoColor(entrega.estado)}>{entrega.estado}</Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Calendar className="h-4 w-4" />
                    <span>Entregado: {new Date(entrega.fecha_entrega).toLocaleString()}</span>
                  </div>

                  {/* ✅ Mostrar comentario */}
                  {entrega.comentario && (
                    <div className="flex gap-2 text-sm mb-3">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-muted-foreground">{entrega.comentario}</p>
                    </div>
                  )}

                  {/* ✅ Mostrar archivo entregado */}
                  {entrega.archivo_ruta && (
                    <div className="flex items-center gap-2 mt-2 text-sm">
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


                  {/* ✅ Calificación */}
                  {entrega.calificacion !== null && (
                    <div className="mt-3 pt-3 border-t">
                      <span className="text-sm font-medium">Calificación: {entrega.calificacion}/100</span>
                    </div>
                  )}
                  <div className="mt-4 flex justify-end">
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
                      disabled={!entrega.tiene_avance_final || entrega.estado == "aprobada"}
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
                      <p className="text-xs text-muted-foreground mt-2">
                        Este alumno ya marcó un avance como entrega final.
                      </p>
                    )}

                  </div>

                </CardContent>
              </Card>
            ))}
          </div>
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

        <h3 className="text-lg font-semibold">Avances de los alumnos</h3>

        {avances.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-2">
            No hay avances registrados aún.
          </p>
        ) : (
          <div className="space-y-3 mt-3">
            {avances.map((a) => (
              <Card key={a.id}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">
                        {a.nombre} {a.apellidos}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {a.matricula} • {a.email}
                      </p>
                    </div>
                    {a.es_final && (
                      <Badge variant="secondary">Final</Badge>
                    )}
                  </div>

                  {a.comentario && (
                    <p className="text-sm mb-2">{a.comentario}</p>
                  )}

                  {a.archivo_url && (
                    <a
                      href={a.archivo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-sm hover:underline flex items-center gap-1"
                    >
                      <FileText className="h-4 w-4" />
                      Ver archivo
                    </a>
                  )}

                  <p className="text-xs text-muted-foreground mt-2">
                    Estado: {a.estado} • {new Date(a.fecha_entrega).toLocaleString()}
                  </p>

                  {a.horas_asignadas > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Horas asignadas: {a.horas_asignadas}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      </DialogContent>
    </Dialog>
  )
}
