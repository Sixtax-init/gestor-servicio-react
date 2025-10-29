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
import { FileUpload } from "@/components/ui/file-upload"

interface CreateTareaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface Curso {
  id: number
  nombre_grupo: string
  tipo: string
}

export function CreateTareaDialog({ open, onOpenChange, onSuccess }: CreateTareaDialogProps) {
  const [cursos, setCursos] = useState<Curso[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    curso_id: "",
    titulo: "",
    descripcion: "",
    prioridad: "media",
    fecha_vencimiento: "",
    asignacion_horas: "",
    limite_alumnos: "",
  })
  const [archivoInstrucciones, setArchivoInstrucciones] = useState<File | null>(null)

  useEffect(() => {
    if (open) {
      fetchCursos()
    }
  }, [open])

  const fetchCursos = async () => {
    try {
      const response = await fetch("/api/maestro/cursos")
      if (!response.ok) throw new Error("Error al obtener cursos")

      const data = await response.json()
      // ✅ Detecta si data tiene propiedad cursos o es array
      const cursosList = Array.isArray(data) ? data : data.cursos || []
      setCursos(cursosList)
    } catch (error) {
      console.error("[v0] Error al cargar cursos:", error)
      setCursos([]) // evita errores con .map
    }
  }


  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)

  try {
    const formDataToSend = new FormData()
    formDataToSend.append("curso_id", formData.curso_id)
    formDataToSend.append("titulo", formData.titulo)
    formDataToSend.append("descripcion", formData.descripcion)
    formDataToSend.append("prioridad", formData.prioridad)
    formDataToSend.append("fecha_vencimiento", formData.fecha_vencimiento)

    if (formData.asignacion_horas)
      formDataToSend.append("asignacion_horas", formData.asignacion_horas)
    if (formData.limite_alumnos)
      formDataToSend.append("limite_alumnos", formData.limite_alumnos)
    if (archivoInstrucciones)
      formDataToSend.append("archivo_instrucciones", archivoInstrucciones)

    const response = await fetch("/api/maestro/tareas", {
      method: "POST",
      body: formDataToSend, // 👈 sin headers JSON
    })

    if (response.ok) {
      onSuccess()
      setFormData({
        curso_id: "",
        titulo: "",
        descripcion: "",
        prioridad: "media",
        fecha_vencimiento: "",
        asignacion_horas: "",
        limite_alumnos: "",
      })
      setArchivoInstrucciones(null)
    } else {
      const errorData = await response.json()
      console.error("Error al crear tarea:", errorData.error)
    }
  } catch (error) {
    console.error("Error al crear tarea:", error)
  } finally {
    setLoading(false)
  }
}


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Tarea</DialogTitle>
          <DialogDescription>Crea una nueva tarea para tus alumnos</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="curso_id">Curso</Label>
            <Select value={formData.curso_id} onValueChange={(value) => setFormData({ ...formData, curso_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un curso" />
              </SelectTrigger>
              <SelectContent>
                {cursos.map((curso) => (
                  <SelectItem key={curso.id} value={curso.id.toString()}>
                    {curso.nombre_grupo} ({curso.tipo === "servicio_social" ? "Servicio Social" : "Taller/Curso"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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

            <div className="space-y-2">
              <Label htmlFor="fecha_vencimiento">Fecha de vencimiento</Label>
              <Input
                id="fecha_vencimiento"
                type="datetime-local"
                value={formData.fecha_vencimiento}
                onChange={(e) => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="asignacion_horas">Horas asignadas (opcional)</Label>
              <Input
                id="asignacion_horas"
                type="number"
                min="0"
                value={formData.asignacion_horas}
                onChange={(e) => setFormData({ ...formData, asignacion_horas: e.target.value })}
                placeholder="Para servicio social"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="limite_alumnos">Límite de alumnos (opcional)</Label>
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
            <Label>Archivo de instrucciones (opcional)</Label>
            <FileUpload
              onFilesSelected={(files) => setArchivoInstrucciones(files[0] ?? null)}
              acceptedTypes={["pdf", "doc", "docx", "zip", "rar"]}
              maxFiles={1}
              maxSize={20}
            />
            {archivoInstrucciones && (
              <p className="text-sm text-muted-foreground">Archivo seleccionado: {archivoInstrucciones.name}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Tarea"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

