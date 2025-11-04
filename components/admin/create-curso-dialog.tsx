"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileUpload } from "@/components/ui/file-upload"
import { Plus } from "lucide-react"

interface CreateCursoDialogProps {
  onSuccess: () => void
}

export function CreateCursoDialog({ onSuccess }: CreateCursoDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [maestros, setMaestros] = useState<any[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    nombre_grupo: "",
    tipo: "servicio_social",
    maestro_id: "",
    descripcion: "",
  })

  useEffect(() => {
    if (open) fetchMaestros()
  }, [open])

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

  // 1️⃣ Solo guarda el archivo en memoria
  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      setSelectedFile(files[0])
    }
  }

  // 2️⃣ Crea el curso primero
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/admin/cursos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          maestro_id: formData.maestro_id ? Number.parseInt(formData.maestro_id) : null,
        }),
      })

      const data = await response.json()
      console.log("[create-curso-dialog] Respuesta del backend:", data)

      if (!response.ok) {
        alert(data.error || "Error al crear curso")
        return
      }

      const cursoId = data.id || data.curso?.id
      if (!cursoId) {
        console.error("[frontend] No se recibió un ID de curso en la respuesta:", data)
        alert("Error: el backend no devolvió un ID de curso.")
        return
      }

      console.log("[frontend] Curso creado con ID:", cursoId)

      // 3️⃣ Si hay archivo seleccionado, subirlo ahora
      if (selectedFile) {
        const uploadData = new FormData()
        uploadData.append("file", selectedFile)
        uploadData.append("cursoId", cursoId.toString())

        const uploadResponse = await fetch("/api/cursos/upload", {
          method: "POST",
          body: uploadData,
        })

        const uploadResult = await uploadResponse.json()

        if (!uploadResponse.ok) {
          console.error(uploadResult)
          alert(uploadResult.error || "Error al subir archivo del curso")
        } else {
          console.log("[frontend] Archivo subido:", uploadResult)
        }
      }

      alert("Curso creado con éxito 🎉")
      setFormData({ nombre_grupo: "", tipo: "servicio_social", maestro_id: "", descripcion: "" })
      setSelectedFile(null)
      setOpen(false)
      onSuccess()
    } catch (error) {
      console.error("[v0] Error creating curso:", error)
      alert("Error al crear curso")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Curso
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Curso</DialogTitle>
          <DialogDescription>Agrega un nuevo curso o servicio social al sistema</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label htmlFor="nombre-grupo">Nombre del Grupo</Label>
              <Input
                id="nombre-grupo"
                value={formData.nombre_grupo}
                onChange={(e) => setFormData({ ...formData, nombre_grupo: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tipo">Tipo de Curso</Label>
              <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                <SelectTrigger id="tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="servicio_social">Servicio Social</SelectItem>
                  <SelectItem value="taller_curso">Taller/Curso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="maestro">Maestro Responsable</Label>
              <Select
                value={formData.maestro_id}
                onValueChange={(value) => setFormData({ ...formData, maestro_id: value })}
              >
                <SelectTrigger id="maestro">
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
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label>Archivo Adjunto (Syllabus, Material, etc.)</Label>
              <FileUpload
                onFilesSelected={handleFileSelect}
                maxFiles={1}
                acceptedTypes={["pdf", "doc", "docx", "png", "jpg", "jpeg"]}
              />
              {selectedFile && (
                <div className="text-sm text-muted-foreground">
                  Archivo seleccionado: <span className="font-medium">{selectedFile.name}</span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Curso"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
