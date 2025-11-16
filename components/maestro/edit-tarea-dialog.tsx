"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { FileUpload } from "@/components/ui/file-upload"

interface Tarea {
  id: number
  titulo: string
  descripcion: string
  prioridad: string
  fecha_vencimiento: string | null
  asignacion_horas: number | null
  limite_alumnos: number | null
  archivo_instrucciones: string | null
  activo: boolean
}

interface EditTareaDialogProps {
  tarea: Tarea
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditTareaDialog({ tarea, open, onOpenChange, onSuccess }: EditTareaDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    titulo: tarea.titulo,
    descripcion: tarea.descripcion,
    prioridad: tarea.prioridad,
    fecha_vencimiento: tarea.fecha_vencimiento?.slice(0, 16),
    asignacion_horas: tarea.asignacion_horas?.toString() || "",
    limite_alumnos: tarea.limite_alumnos?.toString() || "",
    activo: tarea.activo,
  })
  const [nuevoArchivo, setNuevoArchivo] = useState<File | null>(null)

  useEffect(() => {
    setFormData({
      titulo: tarea.titulo,
      descripcion: tarea.descripcion,
      prioridad: tarea.prioridad,
      fecha_vencimiento: tarea.fecha_vencimiento?.slice(0, 16),
      asignacion_horas: tarea.asignacion_horas?.toString() || "",
      limite_alumnos: tarea.limite_alumnos?.toString() || "",
      activo: tarea.activo,
    })
  }, [tarea])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let archivoRuta = tarea.archivo_instrucciones

      // Subir nuevo archivo si existe
      if (nuevoArchivo) {
        const uploadFormData = new FormData()
        uploadFormData.append("file", nuevoArchivo)
        uploadFormData.append("tipo", "instrucciones")

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          archivoRuta = uploadData.filePath
        }
      }

      const response = await fetch(`/api/maestro/tareas/${tarea.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          asignacion_horas: formData.asignacion_horas ? Number.parseInt(formData.asignacion_horas) : null,
          limite_alumnos: formData.limite_alumnos ? Number.parseInt(formData.limite_alumnos) : null,
          archivo_instrucciones: archivoRuta,
        }),
      })

      if (response.ok) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error al actualizar tarea:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Tarea</DialogTitle>
          <DialogDescription>Modifica los detalles de la tarea</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              required
            />
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prioridad">Prioridad</Label>
              <Select
                value={formData.prioridad}
                onValueChange={(value) => setFormData({ ...formData, prioridad: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baja">Baja</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* <div className="space-y-2">
              <Label htmlFor="fecha_vencimiento">Fecha de vencimiento</Label>
              <Input
                id="fecha_vencimiento"
                type="datetime-local"
                value={formData.fecha_vencimiento}
                onChange={(e) => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
                required
              />
            </div> */}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="asignacion_horas">Horas asignadas</Label>
              <Input
                id="asignacion_horas"
                type="number"
                min="0"
                value={formData.asignacion_horas}
                onChange={(e) => setFormData({ ...formData, asignacion_horas: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="limite_alumnos">Límite de alumnos</Label>
              <Input
                id="limite_alumnos"
                type="number"
                min="1"
                value={formData.limite_alumnos}
                onChange={(e) => setFormData({ ...formData, limite_alumnos: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Archivo de instrucciones</Label>
            {tarea.archivo_instrucciones && !nuevoArchivo && (
              <div className="text-sm text-muted-foreground mb-2">
                Archivo actual: {tarea.archivo_instrucciones.split("/").pop()}
              </div>
            )}
            <FileUpload
              onFilesSelected={(files) => setNuevoArchivo(files[0] ?? null)}
              acceptedTypes={["pdf", "doc", "docx", "txt"]}
              maxFiles={1}
              maxSize={10}
            />
            {nuevoArchivo && <p className="text-sm text-muted-foreground">Nuevo archivo: {nuevoArchivo.name}</p>}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="activo"
              checked={formData.activo}
              onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
            />
            <Label htmlFor="activo">Tarea activa</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

