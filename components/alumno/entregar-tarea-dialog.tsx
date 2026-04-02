"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { FileUpload } from "@/components/ui/file-upload"
import { apiFetch } from "@/lib/api-client"
import { toast } from "sonner"

interface EntregarTareaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tarea: {
    id: number
    titulo: string
    descripcion: string
    fecha_vencimiento: string
  }
  onSuccess: () => void
}

export function EntregarTareaDialog({ open, onOpenChange, tarea, onSuccess }: EntregarTareaDialogProps) {
  const [comentario, setComentario] = useState("")
  const [archivo, setArchivo] = useState<File | null>(null)
  const [subiendo, setSubiendo] = useState(false)

  // 🔹 Subida del archivo
  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      setArchivo(files[0])
    }
  }

  // 🔹 Enviar entrega
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tarea?.id) return

    if (!archivo) {
      toast.warning("Debes adjuntar un archivo para realizar la entrega.")
      return
    }

    setSubiendo(true)

    try {
      // 1️⃣ Subir el archivo primero
      const formData = new FormData()
      formData.append("file", archivo)
      formData.append("type", "avances") // Usamos 'avances' para que no pida entregaId
      formData.append("referenceId", "0")

      const resUpload = await apiFetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!resUpload.ok) {
        const errorData = await resUpload.json()
        throw new Error(errorData.error || "Error al subir archivo")
      }

      const archivoSubido = await resUpload.json()

      // 2️⃣ Crear la entrega con la info del archivo
      const resEntrega = await apiFetch("/api/alumno/entregas", {
        method: "POST",
        body: JSON.stringify({
          tarea_id: tarea.id,
          comentario: comentario.trim(),
          archivo_entrega: {
            nombre: archivoSubido.nombre,
            ruta: archivoSubido.ruta,
            tipo: archivoSubido.tipo,
            size: archivoSubido.size
          }
        }),
      })

      if (!resEntrega.ok) {
        const errorData = await resEntrega.json()
        throw new Error(errorData.error || "Error al registrar entrega")
      }

      toast.success("Entrega enviada correctamente")
      setArchivo(null)
      setComentario("")
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("[entregar-tarea-dialog] Error:", error)
      toast.error(error instanceof Error ? error.message : "Error al enviar la entrega")
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Entregar Tarea</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ⚠️ Mensaje de advertencia */}
          <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Esta será tu <strong>entrega final</strong>. Una vez enviada, no podrás agregar avances parciales.
            </p>
          </div>

          <div>
            <Label>Tarea</Label>
            <p className="text-sm font-medium">{tarea?.titulo}</p>
            <p className="text-sm text-muted-foreground">{tarea?.descripcion}</p>
          </div>

          <div>
            <Label htmlFor="comentario">Comentario (opcional)</Label>
            <Textarea
              id="comentario"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Escribe un comentario para el maestro..."
            />
          </div>

          <div>
            <Label>Archivo</Label>
            <FileUpload
              onFilesSelected={handleFileSelect}
              maxFiles={1}
              acceptedTypes={["pdf", "doc", "docx", "jpg", "png"]}
            />
            {archivo && (
              <p className="text-sm text-muted-foreground mt-1">
                Archivo seleccionado: <span className="font-medium">{archivo.name}</span>
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={subiendo}>
              {subiendo ? "Enviando..." : "Enviar Entrega"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
