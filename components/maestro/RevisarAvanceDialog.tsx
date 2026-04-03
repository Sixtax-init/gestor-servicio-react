"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"

interface RevisarAvanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  avanceId: number
  alumnoNombre: string
  onSuccess: () => void
}

export function RevisarAvanceDialog({ open, onOpenChange, avanceId, alumnoNombre, onSuccess }: RevisarAvanceDialogProps) {
  const [comentario, setComentario] = useState<string>("")
  const [horas, setHoras] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    try {
      setLoading(true)

      const response = await apiFetch(`/api/maestro/avances/${avanceId}/revisar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comentario,
          horas_asignadas: horas ? parseFloat(horas) : 0,
        }),
      })

      if (!response.ok) throw new Error("Error al revisar el avance")

      toast.success("Avance revisado correctamente. El alumno ha sido desbloqueado.")
      onSuccess()
      onOpenChange(false)
      // Reset form
      setComentario("")
      setHoras("")
    } catch (error) {
      console.error(error)
      toast.error("No se pudo guardar la revisión del avance")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Revisar Avance Parcial</DialogTitle>
          <DialogDescription>
            De: {alumnoNombre}. Esta revisión marcará el avance como visto y permitirá al alumno enviar nuevos avances.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="horas-avance">Horas parciales a asignar</Label>
            <Input
              id="horas-avance"
              type="number"
              step="0.5"
              min="0"
              value={horas}
              onChange={(e) => setHoras(e.target.value)}
              placeholder="Ej. 2.5 (Opcional)"
            />
            <p className="text-[10px] text-muted-foreground italic">
              Estas horas se sumarán inmediatamente al progreso del alumno.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comentario-avance">Retroalimentación / Comentarios</Label>
            <Textarea
              id="comentario-avance"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Escribe tus observaciones para el alumno..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Procesando..." : "Marcar como Revisada"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
