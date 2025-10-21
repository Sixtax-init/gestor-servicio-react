"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, User, FileText } from "lucide-react"

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
}

interface VerEntregasDialogProps {
  tarea: Tarea
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VerEntregasDialog({ tarea, open, onOpenChange }: VerEntregasDialogProps) {
  const [entregas, setEntregas] = useState<Entrega[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open) {
      fetchEntregas()
    }
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

                  {entrega.comentario && (
                    <div className="flex gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-muted-foreground">{entrega.comentario}</p>
                    </div>
                  )}

                  {entrega.calificacion !== null && (
                    <div className="mt-3 pt-3 border-t">
                      <span className="text-sm font-medium">Calificación: {entrega.calificacion}/100</span>
                    </div>
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
