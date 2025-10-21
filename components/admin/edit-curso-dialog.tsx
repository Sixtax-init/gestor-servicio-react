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

interface Curso {
  id: number
  nombre_grupo: string
  tipo: string
  maestro_id: number
  descripcion: string
  activo: boolean
  archivo_adjunto: string | null
  archivo_nombre: string | null
}

interface EditCursoDialogProps {
  curso: Curso | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditCursoDialog({ curso, open, onOpenChange, onSuccess }: EditCursoDialogProps) {
  const [loading, setLoading] = useState(false)
  const [maestros, setMaestros] = useState<any[]>([])
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string } | null>(null)
  const [formData, setFormData] = useState({
    nombre_grupo: "",
    tipo: "servicio_social",
    maestro_id: "",
    descripcion: "",
    activo: true,
  })

  useEffect(() => {
    fetchMaestros()
  }, [])

  useEffect(() => {
    if (curso) {
      setFormData({
        nombre_grupo: curso.nombre_grupo,
        tipo: curso.tipo,
        maestro_id: curso.maestro_id?.toString() || "",
        descripcion: curso.descripcion || "",
        activo: curso.activo,
      })
      if (curso.archivo_adjunto && curso.archivo_nombre) {
        setUploadedFile({ url: curso.archivo_adjunto, name: curso.archivo_nombre })
      } else {
        setUploadedFile(null)
      }
    }
  }, [curso])

  const fetchMaestros = async () => {
    try {
      const response = await fetch("/api/admin/usuarios")
      const data = await response.json()
      const maestrosList = data.usuarios?.filter((u: any) => u.tipo_usuario === "maestro") || []
      setMaestros(maestrosList)
    } catch (error) {
      console.error("[v0] Error fetching maestros:", error)
    }
  }

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return

    const file = files[0]
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setUploadedFile({ url: data.url, name: file.name })
      } else {
        alert("Error al subir archivo")
      }
    } catch (error) {
      console.error("[v0] Error uploading file:", error)
      alert("Error al subir archivo")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!curso) return

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/cursos/${curso.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          maestro_id: formData.maestro_id ? Number.parseInt(formData.maestro_id) : null,
          archivo_adjunto: uploadedFile?.url || null,
          archivo_nombre: uploadedFile?.name || null,
        }),
      })

      if (response.ok) {
        onSuccess()
        onOpenChange(false)
      } else {
        const data = await response.json()
        alert(data.error || "Error al actualizar curso")
      }
    } catch (error) {
      console.error("[v0] Error updating curso:", error)
      alert("Error al actualizar curso")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Curso</DialogTitle>
          <DialogDescription>Modifica la información del curso</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label htmlFor="edit-nombre-grupo">Nombre del Grupo</Label>
              <Input
                id="edit-nombre-grupo"
                value={formData.nombre_grupo}
                onChange={(e) => setFormData({ ...formData, nombre_grupo: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-tipo">Tipo de Curso</Label>
              <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                <SelectTrigger id="edit-tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="servicio_social">Servicio Social</SelectItem>
                  <SelectItem value="taller_curso">Taller/Curso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-maestro">Maestro Responsable</Label>
              <Select
                value={formData.maestro_id}
                onValueChange={(value) => setFormData({ ...formData, maestro_id: value })}
              >
                <SelectTrigger id="edit-maestro">
                  <SelectValue placeholder="Seleccionar maestro" />
                </SelectTrigger>
                <SelectContent>
                  {maestros.map((maestro) => (
                    <SelectItem key={maestro.id} value={maestro.id.toString()}>
                      {maestro.nombre} {maestro.apellidos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-descripcion">Descripción</Label>
              <Textarea
                id="edit-descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label>Archivo Adjunto (Syllabus, Material, etc.)</Label>
              <FileUpload
                onFilesSelected={handleFileUpload}
                maxFiles={1}
                acceptedTypes={["pdf", "doc", "docx", "png", "jpg", "jpeg"]}
              />
              {uploadedFile && (
                <div className="text-sm text-muted-foreground">
                  Archivo actual: <span className="font-medium">{uploadedFile.name}</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-activo-curso"
                checked={formData.activo}
                onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
              />
              <Label htmlFor="edit-activo-curso">Curso Activo</Label>
            </div>
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
