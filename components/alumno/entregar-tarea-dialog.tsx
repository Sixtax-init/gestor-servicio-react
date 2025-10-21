"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileUpload } from "@/components/ui/file-upload"

interface Tarea {
  id: number
  titulo: string
  entrega_id: number | null
}

interface EntregarTareaDialogProps {
  tarea: Tarea
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EntregarTareaDialog({ tarea, open, onOpenChange, onSuccess }: EntregarTareaDialogProps) {
  const [loading, setLoading] = useState(false)
  const [comentario, setComentario] = useState("")
  const [archivoEntrega, setArchivoEntrega] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let archivoData = null

      // Subir archivo si existe
      if (archivoEntrega) {
        const uploadFormData = new FormData()
        uploadFormData.append("file", archivoEntrega)
        uploadFormData.append("tipo", "entrega")
        uploadFormData.append("tarea_id", tarea.id.toString())

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          archivoData = {
            nombre: archivoEntrega.name,
            ruta: uploadData.filePath,
            tipo: archivoEntrega.type,
          }
        }
      }

      const response = await fetch("/api/alumno/entregas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tarea_id: tarea.id,
          comentario,
          archivo_entrega: archivoData,
        }),
      })

      if (response.ok) {
        onSuccess()
        setComentario("")
        setArchivoEntrega(null)
      }
    } catch (error) {
      console.error("Error al entregar tarea:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{tarea.entrega_id ? "Reenviar" : "Entregar"} Tarea</DialogTitle>
          <DialogDescription>{tarea.titulo}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="comentario">Comentarios (opcional)</Label>
            <Textarea
              id="comentario"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={4}
              placeholder="Agrega comentarios sobre tu entrega..."
            />
          </div>

          <div className="space-y-2">
            <Label>Archivo de entrega</Label>
            <FileUpload
              onFilesSelected={(files) => setArchivoEntrega(files[0] ?? null)}
              acceptedTypes={["pdf", "doc", "docx", "zip", "rar"]}
              maxFiles={1}
              maxSize={20}
            />
            {archivoEntrega && (
              <p className="text-sm text-muted-foreground">Archivo seleccionado: {archivoEntrega.name}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !archivoEntrega}>
              {loading ? "Enviando..." : tarea.entrega_id ? "Reenviar" : "Entregar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
