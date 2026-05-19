"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { Curso, TipoCurso } from "@/lib/db"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiFetch } from "@/lib/api-client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface EditCursoDialogProps {
  curso: Curso
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (curso: Curso) => void
}

export function EditCursoDialog({ curso, open, onOpenChange, onSuccess }: EditCursoDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre_grupo: curso.nombre_grupo,
    tipo: curso.tipo,
    descripcion: curso.descripcion ?? "",
  })

  useEffect(() => {
    setFormData({
      nombre_grupo: curso.nombre_grupo,
      tipo: curso.tipo,
      descripcion: curso.descripcion ?? "",
    })
  }, [curso])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await apiFetch(`/api/maestro/cursos/${curso.id}`, {
        method: "PATCH",
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Error al actualizar curso")
        return
      }

      onSuccess(data)
      toast.success("Curso actualizado correctamente")
      router.refresh()
    } catch (err) {
      console.error("[maestro/edit-curso] Error:", err)
      toast.error("Error de conexión al servidor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Curso</DialogTitle>
          <DialogDescription>Modifica los datos del curso</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre_grupo">Nombre del Grupo</Label>
            <Input
              id="nombre_grupo"
              value={formData.nombre_grupo}
              onChange={(e) => setFormData({ ...formData, nombre_grupo: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value as TipoCurso })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="servicio_social">Servicio Social</SelectItem>
                <SelectItem value="taller_curso">Taller/Curso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
