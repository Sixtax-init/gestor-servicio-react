"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Plus, Pencil, TriangleAlert, GraduationCap } from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import { toast } from "sonner"

interface Carrera {
  id: number
  nombre: string
  clave: string
  activo: boolean
  total_alumnos: number
}

const FORM_VACIO = { nombre: "", clave: "", activo: true }

export function CarrerasTab() {
  const [carreras, setCarreras] = useState<Carrera[]>([])
  const [sinCarrera, setSinCarrera] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState<Carrera | null>(null)
  const [creando, setCreando] = useState(false)
  const [form, setForm] = useState(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [resC, resU] = await Promise.all([
        apiFetch("/api/main-admin/carreras"),
        // Alumnos sin carrera: no podrán inscribirse a programas restringidos
        apiFetch("/api/admin/usuarios?tipo=alumno&status=active&limit=200"),
      ])
      const dataC = await resC.json()
      const dataU = await resU.json()
      if (!resC.ok) {
        toast.error(dataC.error || "Error al cargar carreras")
        return
      }
      setCarreras(dataC.carreras ?? [])
      setSinCarrera((dataU.usuarios ?? []).filter((u: any) => !u.carrera_id).length)
    } catch (e) {
      toast.error(`Error de conexión: ${e}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function abrirNueva() {
    setForm(FORM_VACIO)
    setEditando(null)
    setCreando(true)
  }

  function abrirEdicion(c: Carrera) {
    setForm({ nombre: c.nombre, clave: c.clave, activo: c.activo })
    setEditando(c)
    setCreando(true)
  }

  async function guardar() {
    if (!form.nombre.trim() || !form.clave.trim()) {
      toast.error("El nombre y la clave son requeridos")
      return
    }
    setGuardando(true)
    try {
      const res = await apiFetch(
        editando ? `/api/main-admin/carreras/${editando.id}` : "/api/main-admin/carreras",
        { method: editando ? "PUT" : "POST", body: JSON.stringify(form) },
      )
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "No se pudo guardar")
        return
      }
      toast.success(editando ? "Carrera actualizada" : "Carrera creada")
      setCreando(false)
      await load()
    } catch (e) {
      toast.error(`Error de conexión: ${e}`)
    } finally {
      setGuardando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Lo único accionable del panel: sin esto, ese estado roto es invisible
          hasta que un alumno se topa con el error al elegir programa. */}
      {sinCarrera > 0 && (
        <Alert variant="destructive">
          <TriangleAlert className="h-4 w-4" />
          <AlertDescription>
            <p>
              <strong>{sinCarrera} alumno{sinCarrera === 1 ? "" : "s"} sin carrera asignada.</strong>{" "}
              No podrán inscribirse a programas que restrinjan por carrera.
              Asígnasela desde la pestaña <em>Usuarios</em>, editando cada uno.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Carreras
            </CardTitle>
            <CardDescription>
              Las que puede elegir un alumno al registrarse y a las que se puede
              restringir un programa de servicio social.
            </CardDescription>
          </div>
          <Button onClick={abrirNueva} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nueva carrera
          </Button>
        </CardHeader>
        <CardContent>
          {carreras.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No hay carreras registradas.
            </p>
          ) : (
            <div className="divide-y">
              {carreras.map((c) => (
                <div key={c.id} className="flex items-center gap-3 py-3">
                  <Badge variant="outline" className="font-mono shrink-0 w-16 justify-center">
                    {c.clave}
                  </Badge>
                  <span className="flex-1 min-w-0 truncate">{c.nombre}</span>
                  <span className="text-sm text-muted-foreground shrink-0 tabular-nums">
                    {c.total_alumnos} alumno{Number(c.total_alumnos) === 1 ? "" : "s"}
                  </span>
                  {!c.activo && <Badge variant="secondary" className="shrink-0">Inactiva</Badge>}
                  <Button variant="ghost" size="icon" onClick={() => abrirEdicion(c)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={creando} onOpenChange={(v) => !v && setCreando(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar carrera" : "Nueva carrera"}</DialogTitle>
            <DialogDescription>
              La clave aparece en documentos y listados; usa la abreviatura oficial.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nombre *</Label>
              <Input
                placeholder="Ingeniería en Sistemas Computacionales"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                disabled={guardando}
              />
            </div>
            <div className="space-y-1">
              <Label>Clave *</Label>
              <Input
                placeholder="ISC"
                value={form.clave}
                onChange={(e) => setForm((f) => ({ ...f, clave: e.target.value.toUpperCase() }))}
                disabled={guardando}
              />
            </div>
            {editando && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="carrera-activa"
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))}
                  disabled={guardando}
                />
                <Label htmlFor="carrera-activa" className="font-normal">
                  Activa — si la desmarcas, deja de ofrecerse en el registro
                </Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreando(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button onClick={guardar} disabled={guardando}>
              {guardando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editando ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
