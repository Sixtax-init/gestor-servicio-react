"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { apiFetch } from "@/lib/api-client"

interface CreateUsuarioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  isAdminGlobal?: boolean
}

export function CreateUsuarioDialog({ open, onOpenChange, onSuccess, isAdminGlobal = false }: CreateUsuarioDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [departamentos, setDepartamentos] = useState<{ id: number; nombre: string }[]>([])
  const [formData, setFormData] = useState({
    matricula: "",
    nombre: "",
    apellidos: "",
    email: "",
    tipo_usuario: "alumno",
    departamento_id: "",
  })

  // Cargar departamentos si es admin global
  useEffect(() => {
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
  }, [isAdminGlobal, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Validar formato de matrícula solo para alumnos
    const MATRICULA_REGEX = /^V?\d{8}$/
    if (formData.tipo_usuario === "alumno" && !MATRICULA_REGEX.test(formData.matricula)) {
      setError("La matrícula debe ser 8 dígitos (ej. 21480681) o V + 8 dígitos para virtual (ej. V21480681)")
      setLoading(false)
      return
    }

    // Departamento requerido solo al crear un administrador de departamento
    if (isAdminGlobal && formData.tipo_usuario === "administrador" && !formData.departamento_id) {
      setError("Debes seleccionar un departamento para el administrador")
      setLoading(false)
      return
    }

    try {
      const response = await apiFetch("/api/admin/usuarios", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          departamento_id: formData.departamento_id ? Number(formData.departamento_id) : undefined
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Error al crear usuario")
        setLoading(false)
        return
      }

      onSuccess()
      setFormData({
        matricula: "",
        nombre: "",
        apellidos: "",
        email: "",
        tipo_usuario: "alumno",
        departamento_id: "",
      })
      onOpenChange(false)
    } catch (err) {
      console.error("[admin/create-usuario] Error:", err)
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Usuario</DialogTitle>
          <DialogDescription>La contraseña temporal se generará automáticamente y se enviará al correo del usuario.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="matricula">Matrícula</Label>
              <Input
                id="matricula"
                value={formData.matricula}
                onChange={(e) => setFormData({ ...formData, matricula: e.target.value.toUpperCase() })}
                placeholder={formData.tipo_usuario === "alumno" ? "21480681 o V21480681" : "Identificador"}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_usuario">Tipo de Usuario</Label>
              <Select
                value={formData.tipo_usuario}
                onValueChange={(value) => setFormData({ ...formData, tipo_usuario: value, departamento_id: "" })}
              >
                <SelectTrigger>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apellidos">Apellidos</Label>
              <Input
                id="apellidos"
                value={formData.apellidos}
                onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          {isAdminGlobal && formData.tipo_usuario === "administrador" && (
            <div className="space-y-2">
              <Label htmlFor="departamento_id">Departamento</Label>
              <Select
                value={formData.departamento_id}
                onValueChange={(value) => setFormData({ ...formData, departamento_id: value })}
              >
                <SelectTrigger>
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
              {loading ? "Creando..." : "Crear Usuario"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
