"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { FileUpload } from "@/components/ui/file-upload"
import { Badge } from "@/components/ui/badge"
import { NextResponse } from "next/server"

interface EntregarAvanceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    tareaId: number
}

interface Avance {
    id: number
    comentario: string
    archivo_url: string | null
    estado: string
    es_final: boolean
    fecha_entrega: string
    estado_entrega_principal?: string | null
}

export function EntregarAvanceDialog({ open, onOpenChange, tareaId }: EntregarAvanceDialogProps) {
    const [comentario, setComentario] = useState("")
    const [archivo, setArchivo] = useState<File | null>(null)
    const [subiendo, setSubiendo] = useState(false)
    const [avances, setAvances] = useState<Avance[]>([])


    const fetchAvances = async () => {
        const res = await fetch(`/api/alumno/entregas/avances?tarea_id=${tareaId}`)
        if (res.ok) {
            const data = await res.json()
            setAvances(data)

            // ✅ Si ya hay un avance final y la entrega no está rechazada, deshabilita el formulario
            const tieneFinalBloqueante = data.some((a: Avance) => a.es_final && a.estado_entrega_principal !== 'rechazada')
            if (tieneFinalBloqueante) {
                setSubiendo(true) // bloquea el botón de envío
            } else {
                setSubiendo(false)
            }
        }
    }

    useEffect(() => {
        if (open) fetchAvances()
    }, [open])

    const handleFileSelect = (files: File[]) => {
        if (files.length > 0) setArchivo(files[0])
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubiendo(true)

        try {
            // 1️⃣ Subir archivo
            let rutaArchivo: string | null = null
            if (archivo) {
                const formData = new FormData()
                formData.append("file", archivo)
                formData.append("type", "avances")

                const upload = await fetch("/api/upload", { method: "POST", body: formData })
                const result = await upload.json()
                rutaArchivo = result.ruta
            }

            // 2️⃣ Registrar avance
            const res = await fetch("/api/alumno/entregas/avances", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tarea_id: tareaId,
                    comentario,
                    archivo_url: rutaArchivo,
                }),
            })

            const data = await res.json().catch(() => ({}))
            console.log("Respuesta backend:", data)

            if (!res.ok) throw new Error(data.error || "Error al registrar avance")

            setComentario("")
            setArchivo(null)
            await fetchAvances()
            alert("✅ Avance registrado correctamente")
        } catch (error: any) {
            console.error("Error al subir avance:", error)
            return NextResponse.json({
                error: "Error al subir avance",
                detalle: error.message
            }, { status: 500 })

        } finally {
            setSubiendo(false)
        }
    }

    const marcarComoFinal = async (avanceId: number) => {
        if (!confirm("¿Deseas marcar este avance como entrega final?")) return
        const res = await fetch("/api/alumno/entregas/avances", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ avance_id: avanceId }),
        })
        if (res.ok) {
            await fetchAvances()
            alert("✅ Avance marcado como entrega final")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Avances de la tarea</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="comentario">Comentario</Label>
                        <Textarea
                            id="comentario"
                            value={comentario}
                            onChange={(e) => setComentario(e.target.value)}
                            placeholder="Describe tu avance..."
                        />
                    </div>

                    <div>
                        <Label>Archivo</Label>
                        <FileUpload onFilesSelected={handleFileSelect} maxFiles={1} />
                    </div>

                    <DialogFooter>
                        {avances.some((a) => a.es_final && a.estado_entrega_principal !== 'rechazada') ? (
                            <p className="text-sm text-muted-foreground">
                                ⚠️ Ya has marcado un avance como final. No puedes subir más avances.
                            </p>
                        ) : (
                            <Button type="submit" disabled={subiendo}>
                                {subiendo ? "Subiendo..." : "Guardar Avance"}
                            </Button>
                        )}
                    </DialogFooter>

                </form>

                <hr className="my-4" />

                <div className="space-y-2">
                    <h3 className="font-semibold">Historial de Avances</h3>
                    {avances.length === 0 && <p className="text-sm text-muted-foreground">No hay avances registrados.</p>}
                    {avances.map((a) => (
                        <div key={a.id} className="p-3 border rounded-lg">
                            <p>{a.comentario || "(Sin comentario)"}</p>
                            <p className="text-xs text-muted-foreground">
                                Fecha: {new Date(a.fecha_entrega).toLocaleString()}
                            </p>
                            <Badge variant={a.es_final ? "default" : "secondary"}>
                                {a.es_final ? "Final" : a.estado}
                            </Badge>
                            {!a.es_final && (!a.estado_entrega_principal || a.estado_entrega_principal !== 'aprobada') && (
                                <Button size="sm" className="ml-2" onClick={() => marcarComoFinal(a.id)}>
                                    Marcar como final
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}
