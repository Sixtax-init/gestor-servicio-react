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
import { apiFetch } from "@/lib/api-client"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { Usuario } from "@/lib/db"

interface EditUsuarioDialogProps {
  usuario: Usuario | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  isAdminGlobal?: boolean
}

export function EditUsuarioDialog({ usuario, open, onOpenChange, onSuccess, isAdminGlobal = false }: EditUsuarioDialogProps) {
  const [loading, setLoading] = useState(false)
  const [departamentos, setDepartamentos] = useState<{ id: number; nombre: string }[]>([])
  const [carreras, setCarreras] = useState<{ id: number; nombre: string; clave: string }[]>([])
  const [formData, setFormData] = useState({
    matricula: "",
    nombre: "",
    apellidos: "",
    email: "",
    tipo_usuario: "alumno" as any,
    activo: true,
    password: "",
    departamento_id: "",
    carrera_id: "",
  })

  useEffect(() => {
    if (usuario) {
      setFormData({
        matricula: usuario.matricula,
        nombre: usuario.nombre,
        apellidos: usuario.apellidos,
        email: usuario.email,
        tipo_usuario: usuario.tipo_usuario,
        activo: usuario.activo,
        password: "",
        departamento_id: usuario.departamento_id?.toString() || "",
        carrera_id: usuario.carrera_id?.toString() || "",
      })
    }

    if (open) {
      apiFetch("/api/public/carreras")
        .then((res) => res.json())
        .then((data) => setCarreras(data.carreras ?? []))
        .catch(() => {})
    }

    if (isAdminGlobal && open) {
      apiFetch("/api/main-admin/departamentos")
        .then(res => res.json())
        .then(data => {
          if (data.departamentos) {
            setDepartamentos(data.departamentos)
          }
        })
        .catch(err => console.error("Error fetching departamentos:", err))
    }
  }, [usuario, open, isAdminGlobal])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!usuario) return

    setLoading(true)
    try {
      const response = await apiFetch(`/api/admin/usuarios/${usuario.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...formData,
          departamento_id: formData.departamento_id ? Number(formData.departamento_id) : null,
          carrera_id: formData.carrera_id ? Number(formData.carrera_id) : null,
        }),
      })

      if (response.ok) {
        onSuccess()
        onOpenChange(false)
      } else {
        const data = await response.json()
        toast.error(data.error || "Error al actualizar usuario")
      }
    } catch (error) {
      console.error("[admin/edit-usuario] Error:", error)
      toast.error("Error al actualizar usuario")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
          <DialogDescription>Modifica la información del usuario</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
            <div className="grid gap-2">
              <Label htmlFor="edit-matricula">Matrícula</Label>
              <Input
                id="edit-matricula"
                value={formData.matricula}
                onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-nombre">Nombre</Label>
                <Input
                  id="edit-nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-apellidos">Apellidos</Label>
                <Input
                  id="edit-apellidos"
                  value={formData.apellidos}
                  onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-tipo">Tipo de Usuario</Label>
              <Select
                value={formData.tipo_usuario}
                onValueChange={(value) => setFormData({ ...formData, tipo_usuario: value })}
              >
                <SelectTrigger id="edit-tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alumno">Alumno</SelectItem>
                  <SelectItem value="maestro">Maestro</SelectItem>
                  <SelectItem value="administrador">Administrador</SelectItem>
                  {isAdminGlobal && <SelectItem value="main_admin">Main Admin</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            {/* La carrera es del alumno, no derivada: sin ella no puede
                inscribirse a programas que restrinjan por carrera. */}
            {["alumno", "pre_candidato"].includes(formData.tipo_usuario) && (
              <div className="grid gap-2">
                <Label htmlFor="edit-carrera">Carrera</Label>
                <Select
                  value={formData.carrera_id}
                  onValueChange={(value) => setFormData({ ...formData, carrera_id: value })}
                >
                  <SelectTrigger id="edit-carrera">
                    <SelectValue placeholder="Sin carrera asignada" />
                  </SelectTrigger>
                  <SelectContent>
                    {carreras.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.nombre} ({c.clave})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Mismo criterio que el alta: sólo maestro y administrador.
                El alumno lo hereda del programa al confirmarse su inscripción,
                así que editarlo a mano aquí lo dejaría inconsistente. */}
            {isAdminGlobal && ["maestro", "administrador"].includes(formData.tipo_usuario) && (
              <div className="grid gap-2">
                <Label htmlFor="edit-departamento">Departamento</Label>
                <Select
                  value={formData.departamento_id}
                  onValueChange={(value) => setFormData({ ...formData, departamento_id: value })}
                >
                  <SelectTrigger id="edit-departamento">
                    <SelectValue placeholder="Selecciona un departamento" />
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
              <Label htmlFor="edit-password">Nueva Contraseña (opcional)</Label>
              <Input
                id="edit-password"
                type="password"
                placeholder="Dejar vacío para mantener la actual"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2 border p-3 rounded-lg">
              <Switch
                id="edit-activo"
                checked={formData.activo}
                onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
              />
              <div className="space-y-0.5">
                <Label htmlFor="edit-activo">Usuario Activo</Label>
                <p className="text-sm text-muted-foreground">El usuario puede acceder al sistema</p>
              </div>
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
