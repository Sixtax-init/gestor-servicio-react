"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { FileUpload } from "@/components/ui/file-upload"

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
    setSubiendo(true)

    try {
      // 1️⃣ Crear o actualizar la entrega (sin archivo)
      const resEntrega = await fetch("/api/alumno/entregas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tarea_id: tarea.id,
          comentario: comentario.trim(),
        }),
      })

      if (!resEntrega.ok) throw new Error("Error al registrar entrega")
      const entrega = await resEntrega.json()

      // 2️⃣ Subir el archivo si existe
      if (archivo) {
        const formData = new FormData()
        formData.append("file", archivo)
        formData.append("entregaId", entrega.id.toString())

        const resUpload = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!resUpload.ok) throw new Error("Error al subir archivo")
      }

      alert("✅ Entrega enviada correctamente")
      setArchivo(null)
      setComentario("")
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("[entregar-tarea-dialog] Error:", error)
      alert("❌ Error al enviar la entrega")
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
