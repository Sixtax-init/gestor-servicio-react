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
import { apiFetch } from "@/lib/api-client"
import { toast } from "sonner"

interface CreateCursoDialogProps {
  onSuccess: () => void
  isAdminGlobal?: boolean
}

export function CreateCursoDialog({ onSuccess, isAdminGlobal = false }: CreateCursoDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [maestros, setMaestros] = useState<any[]>([])
  const [departamentos, setDepartamentos] = useState<any[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    nombre_grupo: "",
    tipo: "servicio_social",
    maestro_id: "",
    departamento_id: "",
    descripcion: "",
  })

  useEffect(() => {
    if (open) {
      fetchMaestros()
      if (isAdminGlobal) {
        fetchDepartamentos()
      }
    }
  }, [open, isAdminGlobal])

  const fetchMaestros = async () => {
    try {
      // If global admin, fetch all teachers. If local, API will filter automatically.
      const url = isAdminGlobal
        ? "/api/admin/usuarios?tipo=maestro&status=active&limit=500"
        : "/api/admin/usuarios?tipo=maestro&status=active&limit=100"

      const response = await apiFetch(url)
      const data = await response.json()
      setMaestros(data.usuarios || [])
    } catch (error) {
      console.error("[admin/create-curso] Error fetching maestros:", error)
    }
  }

  const fetchDepartamentos = async () => {
    try {
      const response = await apiFetch("/api/main-admin/departamentos")
      const data = await response.json()
      setDepartamentos(data.departamentos || [])
    } catch (error) {
      console.error("Error fetching departamentos:", error)
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

    if (isAdminGlobal && !formData.departamento_id) {
      toast.warning("Debes seleccionar un departamento")
      return
    }

    setLoading(true)

    try {
      const response = await apiFetch("/api/admin/cursos", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          maestro_id: formData.maestro_id ? Number.parseInt(formData.maestro_id) : null,
          departamento_id: formData.departamento_id ? Number.parseInt(formData.departamento_id) : undefined
        }),
      })

      const data = await response.json()
      console.log("[create-curso-dialog] Respuesta del backend:", data)

      if (!response.ok) {
        toast.error(data.error || "Error al crear curso")
        setLoading(false)
        return
      }

      const cursoId = data.id || data.curso?.id
      if (!cursoId) {
        console.error("[frontend] No se recibió un ID de curso en la respuesta:", data)
        toast.error("Error: el backend no devolvió un ID de curso.")
        setLoading(false)
        return
      }

      console.log("[frontend] Curso creado con ID:", cursoId)

      // 3️⃣ Si hay archivo seleccionado, subirlo ahora
      if (selectedFile) {
        const uploadData = new FormData()
        uploadData.append("file", selectedFile)
        uploadData.append("cursoId", cursoId.toString())

        const uploadResponse = await apiFetch("/api/cursos/upload", {
          method: "POST",
          body: uploadData,
        })

        const uploadResult = await uploadResponse.json()

        if (!uploadResponse.ok) {
          console.error(uploadResult)
          toast.error(uploadResult.error || "Error al subir archivo del curso")
        } else {
          console.log("[frontend] Archivo subido:", uploadResult)
        }
      }

      toast.success("Curso creado con éxito 🎉")
      setFormData({
        nombre_grupo: "",
        tipo: "servicio_social",
        maestro_id: "",
        departamento_id: "",
        descripcion: ""
      })
      setSelectedFile(null)
      setOpen(false)
      onSuccess()
    } catch (error) {
      console.error("[admin/create-curso] Error creating curso:", error)
      toast.error("Error al crear curso")
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

            {isAdminGlobal && (
              <div className="grid gap-2">
                <Label htmlFor="departamento">Departamento</Label>
                <Select
                  value={formData.departamento_id}
                  onValueChange={(value) => setFormData({ ...formData, departamento_id: value })}
                >
                  <SelectTrigger id="departamento">
                    <SelectValue placeholder="Seleccionar departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departamentos.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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
