"use client"

import type React from "react"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, File } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void
  maxFiles?: number
  maxSize?: number // en MB
  acceptedTypes?: string[]
  className?: string
}

export function FileUpload({
  onFilesSelected,
  maxFiles = 5,
  maxSize = 10,
  acceptedTypes = ["pdf", "doc", "docx", "jpg", "jpeg", "png"],
  className,
}: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("")
    const files = Array.from(e.target.files || [])

    // Validar número de archivos
    if (files.length + selectedFiles.length > maxFiles) {
      setError(`Máximo ${maxFiles} archivos permitidos`)
      return
    }

    // Validar tamaño y tipo
    const validFiles: File[] = []
    for (const file of files) {
      const sizeMB = file.size / (1024 * 1024)
      const ext = file.name.split(".").pop()?.toLowerCase()

      if (sizeMB > maxSize) {
        setError(`El archivo ${file.name} excede el tamaño máximo de ${maxSize}MB`)
        continue
      }

      if (ext && !acceptedTypes.includes(ext)) {
        setError(`Tipo de archivo no permitido: ${ext}`)
        continue
      }

      validFiles.push(file)
    }

    const newFiles = [...selectedFiles, ...validFiles]
    setSelectedFiles(newFiles)
    onFilesSelected(newFiles)
  }

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    onFilesSelected(newFiles)
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm font-medium mb-1">Haz clic para subir archivos</p>
        <p className="text-xs text-muted-foreground">
          Máximo {maxFiles} archivos de {maxSize}MB cada uno
        </p>
        <p className="text-xs text-muted-foreground mt-1">Formatos: {acceptedTypes.join(", ").toUpperCase()}</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={acceptedTypes.map((t) => `.${t}`).join(",")}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Archivos seleccionados:</p>
          {selectedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <File className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeFile(index)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
