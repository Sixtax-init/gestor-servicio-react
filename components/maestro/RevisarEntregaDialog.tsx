"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

interface RevisarEntregaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tareaId: number
  entregaId: number
  onSuccess: () => void
}

export function RevisarEntregaDialog({ open, onOpenChange, tareaId, entregaId, onSuccess }: RevisarEntregaDialogProps) {
  const [estado, setEstado] = useState<string>("revisada")
  const [comentario, setComentario] = useState<string>("")
  const [calificacion, setCalificacion] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    try {
      setLoading(true)

      const response = await fetch(`/api/maestro/tareas/${tareaId}/entregas/${entregaId}/revisar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado,
          comentario,
          calificacion: calificacion ? parseInt(calificacion) : null,
        }),
      })

      if (!response.ok) throw new Error("Error al revisar la entrega")

      toast.success("Entrega revisada correctamente")
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      toast.error("No se pudo guardar la revisión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Revisar entrega</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Estado</Label>
            <Select value={estado} onValueChange={setEstado}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revisada">Revisada</SelectItem>
                <SelectItem value="aprobada">Aprobada</SelectItem>
                <SelectItem value="rechazada">Rechazada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Comentario</Label>
            <Textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Escribe un comentario para el alumno..."
              rows={3}
            />
          </div>

          <div>
            <Label>Calificación (opcional)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={calificacion}
              onChange={(e) => setCalificacion(e.target.value)}
              placeholder="Ej. 95"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Guardando..." : "Guardar revisión"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
