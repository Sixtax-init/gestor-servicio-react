"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"

interface Departamento {
    id: number
    nombre: string
    codigo: string
    descripcion: string
    activo: boolean
}

interface EditDepartamentoDialogProps {
    departamento: Departamento | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function EditDepartamentoDialog({ departamento, open, onOpenChange, onSuccess }: EditDepartamentoDialogProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [formData, setFormData] = useState({
        nombre: "",
        codigo: "",
        descripcion: "",
        activo: true,
    })

    useEffect(() => {
        if (departamento) {
            setFormData({
                nombre: departamento.nombre,
                codigo: departamento.codigo,
                descripcion: departamento.descripcion || "",
                activo: departamento.activo,
            })
        }
    }, [departamento])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!departamento) return

        setError("")
        setLoading(true)

        try {
            const response = await fetch(`/api/main-admin/departamentos/${departamento.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || "Error al actualizar departamento")
                setLoading(false)
                return
            }

            onSuccess()
            onOpenChange(false)
        } catch (err) {
            console.error("[main-admin] Error updating departamento:", err)
            setError("Error de conexión")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Editar Departamento</DialogTitle>
                    <DialogDescription>
                        Modifica los detalles del departamento seleccionado.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-nombre">Nombre del Departamento</Label>
                        <Input
                            id="edit-nombre"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-codigo">Código / Siglas</Label>
                        <Input
                            id="edit-codigo"
                            value={formData.codigo}
                            onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-descripcion">Descripción</Label>
                        <Textarea
                            id="edit-descripcion"
                            value={formData.descripcion}
                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-2 border p-3 rounded-lg">
                        <div className="space-y-0.5">
                            <Label htmlFor="edit-activo">Estado del Departamento</Label>
                            <p className="text-sm text-muted-foreground">
                                Si está inactivo, no se podrán asignar nuevos usuarios o cursos.
                            </p>
                        </div>
                        <Switch
                            id="edit-activo"
                            checked={formData.activo}
                            onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
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
                            {loading ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
