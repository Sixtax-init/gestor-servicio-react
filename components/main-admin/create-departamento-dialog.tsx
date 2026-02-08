"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CreateDepartamentoDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function CreateDepartamentoDialog({ open, onOpenChange, onSuccess }: CreateDepartamentoDialogProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [formData, setFormData] = useState({
        nombre: "",
        codigo: "",
        descripcion: "",
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            const response = await fetch("/api/main-admin/departamentos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || "Error al crear departamento")
                setLoading(false)
                return
            }

            onSuccess()
            setFormData({
                nombre: "",
                codigo: "",
                descripcion: "",
            })
            onOpenChange(false)
        } catch (err) {
            console.error("[main-admin] Error creating departamento:", err)
            setError("Error de conexión")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Departamento</DialogTitle>
                    <DialogDescription>
                        Agrega una nueva área o grupo a la institución.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre del Departamento</Label>
                        <Input
                            id="nombre"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            placeholder="Ej: Servicio Social, Sistemas, etc."
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="codigo">Código / Siglas</Label>
                        <Input
                            id="codigo"
                            value={formData.codigo}
                            onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                            placeholder="Ej: SS, SIS, LINUX"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="descripcion">Descripción (Opcional)</Label>
                        <Textarea
                            id="descripcion"
                            value={formData.descripcion}
                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                            placeholder="Breve descripción del área..."
                            rows={3}
                        />
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Creando..." : "Crear Departamento"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
