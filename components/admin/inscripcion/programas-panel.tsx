"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Users,
  Clock,
  GraduationCap,
  Building2,
} from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import { toast } from "sonner"

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Programa {
  id: number
  nombre: string
  nombre_dependencia: string | null
  descripcion: string | null
  objetivo: string | null
  tipo_ubicacion: "interno" | "externo"
  actividades: string | null
  carreras_permitidas: number[] | null
  requiere_constancia_laboral: boolean
  requisitos_adicionales: string | null
  responsable_dependencia_nombre: string | null
  responsable_dependencia_puesto: string | null
  responsable_programa_nombre: string | null
  responsable_programa_puesto: string | null
  domicilio: string | null
  telefono: string | null
  email_contacto: string | null
  tipo_programa: string | null
  departamento_id: number | null
  departamento_nombre: string | null
  maestro_id: number | null
  maestro_nombre: string | null
  plazas_total: number
  cupo_disponible: number
  total_horarios: number
}

interface Horario {
  id: number
  dias: string
  hora_inicio: string
  hora_fin: string
  plazas: number
  cupo_disponible: number
}

interface Departamento {
  id: number
  nombre: string
}

interface Carrera {
  id: number
  nombre: string
  clave: string
}

interface Maestro {
  id: number
  nombre: string
  apellidos: string
  departamento_id: number | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type ProgramaForm = {
  nombre: string
  nombre_dependencia: string
  descripcion: string
  objetivo: string
  tipo_ubicacion: "interno" | "externo"
  actividades: string
  carreras_permitidas_ids: number[]
  requiere_constancia_laboral: boolean
  requisitos_adicionales: string
  responsable_dependencia_nombre: string
  responsable_dependencia_puesto: string
  responsable_programa_nombre: string
  responsable_programa_puesto: string
  domicilio: string
  telefono: string
  email_contacto: string
  tipo_programa: string
  departamento_id: string
  departamento_externo: string
  maestro_id: string
}

const EMPTY_FORM: ProgramaForm = {
  nombre: "",
  nombre_dependencia: "",
  descripcion: "",
  objetivo: "",
  tipo_ubicacion: "externo",
  actividades: "",
  carreras_permitidas_ids: [],
  requiere_constancia_laboral: false,
  requisitos_adicionales: "",
  responsable_dependencia_nombre: "",
  responsable_dependencia_puesto: "",
  responsable_programa_nombre: "",
  responsable_programa_puesto: "",
  domicilio: "",
  telefono: "",
  email_contacto: "",
  tipo_programa: "",
  departamento_id: "",
  departamento_externo: "",
  maestro_id: "",
}

function programaToForm(p: Programa): ProgramaForm {
  return {
    nombre: p.nombre,
    nombre_dependencia: p.nombre_dependencia ?? "",
    descripcion: p.descripcion ?? "",
    objetivo: p.objetivo ?? "",
    tipo_ubicacion: p.tipo_ubicacion,
    actividades: p.actividades ?? "",
    carreras_permitidas_ids: p.carreras_permitidas ?? [],
    requiere_constancia_laboral: p.requiere_constancia_laboral,
    requisitos_adicionales: p.requisitos_adicionales ?? "",
    responsable_dependencia_nombre: p.responsable_dependencia_nombre ?? "",
    responsable_dependencia_puesto: p.responsable_dependencia_puesto ?? "",
    responsable_programa_nombre: p.responsable_programa_nombre ?? "",
    responsable_programa_puesto: p.responsable_programa_puesto ?? "",
    domicilio: p.domicilio ?? "",
    telefono: p.telefono ?? "",
    email_contacto: p.email_contacto ?? "",
    tipo_programa: p.tipo_programa ?? "",
    departamento_id: p.departamento_id ? String(p.departamento_id) : "",
    departamento_externo: (p as any).departamento_externo ?? "",
    maestro_id: p.maestro_id ? String(p.maestro_id) : "",
  }
}

function formToPayload(f: ProgramaForm) {
  return {
    nombre: f.nombre.trim(),
    nombre_dependencia: f.nombre_dependencia.trim() || undefined,
    descripcion: f.descripcion || undefined,
    objetivo: f.objetivo || undefined,
    tipo_ubicacion: f.tipo_ubicacion,
    actividades: f.actividades || undefined,
    // Vacío = abierto a todas las carreras
    carreras_permitidas: f.carreras_permitidas_ids.length > 0 ? f.carreras_permitidas_ids : null,
    requiere_constancia_laboral: f.requiere_constancia_laboral,
    requisitos_adicionales: f.requisitos_adicionales || undefined,
    responsable_dependencia_nombre: f.responsable_dependencia_nombre || undefined,
    responsable_dependencia_puesto: f.responsable_dependencia_puesto || undefined,
    responsable_programa_nombre: f.responsable_programa_nombre || undefined,
    responsable_programa_puesto: f.responsable_programa_puesto || undefined,
    domicilio: f.domicilio || undefined,
    telefono: f.telefono || undefined,
    email_contacto: f.email_contacto || undefined,
    tipo_programa: f.tipo_programa || undefined,
    departamento_id: f.tipo_ubicacion === "interno" && f.departamento_id ? Number(f.departamento_id) : null,
    departamento_externo: f.tipo_ubicacion === "externo" ? f.departamento_externo.trim() || null : null,
    maestro_id: f.maestro_id ? Number(f.maestro_id) : null,
  }
}

// ─── Horarios dialog ──────────────────────────────────────────────────────────

function HorariosDialog({ programa, onClose }: { programa: Programa; onClose: () => void }) {
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState<number | null>(null)
  const [hForm, setHForm] = useState({ dias: "", hora_inicio: "", hora_fin: "", plazas: "1" })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/admin/programas/${programa.id}/horarios`)
      const data = await res.json()
      setHorarios(data.horarios ?? [])
    } catch {
      toast.error("Error al cargar horarios")
    } finally {
      setLoading(false)
    }
  }, [programa.id])

  useEffect(() => { load() }, [load])

  async function handleAgregar(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    try {
      const res = await apiFetch(`/api/admin/programas/${programa.id}/horarios`, {
        method: "POST",
        body: JSON.stringify({
          dias: hForm.dias,
          hora_inicio: hForm.hora_inicio,
          hora_fin: hForm.hora_fin,
          plazas: Number(hForm.plazas),
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Error al agregar"); return }
      toast.success("Horario agregado")
      setShowForm(false)
      setHForm({ dias: "", hora_inicio: "", hora_fin: "", plazas: "1" })
      await load()
    } catch {
      toast.error("Error de conexión")
    } finally {
      setGuardando(false)
    }
  }

  async function handleEliminar(horarioId: number) {
    setEliminando(horarioId)
    try {
      const res = await apiFetch(`/api/admin/programas/${programa.id}/horarios/${horarioId}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Error al eliminar"); return }
      toast.success("Horario eliminado")
      await load()
    } catch {
      toast.error("Error de conexión")
    } finally {
      setEliminando(null)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Horarios — {programa.nombre}</DialogTitle>
          <DialogDescription>
            {horarios.length} horario(s). Las plazas por horario determinan el cupo total.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {horarios.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Sin horarios. Agrega el primero.
              </p>
            ) : (
              <div className="divide-y rounded-md border">
                {horarios.map((h) => (
                  <div key={h.id} className="flex items-center justify-between px-3 py-2.5">
                    <div className="text-sm">
                      <p className="font-medium">{h.dias}</p>
                      <p className="text-muted-foreground text-xs">
                        {h.hora_inicio} — {h.hora_fin} · {h.plazas} plazas ({Number(h.cupo_disponible)} disponibles)
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                      disabled={eliminando === h.id}
                      onClick={() => handleEliminar(h.id)}
                    >
                      {eliminando === h.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {showForm ? (
              <form onSubmit={handleAgregar} className="rounded-md border p-3 space-y-3 bg-muted/40">
                <p className="text-sm font-medium">Nuevo horario</p>
                <div className="space-y-1">
                  <Label className="text-xs">Días *</Label>
                  <Input
                    placeholder="Ej. Lunes y Miércoles"
                    value={hForm.dias}
                    onChange={(e) => setHForm((p) => ({ ...p, dias: e.target.value }))}
                    required
                    disabled={guardando}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Hora inicio *</Label>
                    <Input
                      type="time"
                      value={hForm.hora_inicio}
                      onChange={(e) => setHForm((p) => ({ ...p, hora_inicio: e.target.value }))}
                      required
                      disabled={guardando}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Hora fin *</Label>
                    <Input
                      type="time"
                      value={hForm.hora_fin}
                      onChange={(e) => setHForm((p) => ({ ...p, hora_fin: e.target.value }))}
                      required
                      disabled={guardando}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Plazas *</Label>
                    <Input
                      type="number"
                      min={1}
                      value={hForm.plazas}
                      onChange={(e) => setHForm((p) => ({ ...p, plazas: e.target.value }))}
                      required
                      disabled={guardando}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={guardando}>
                    {guardando
                      ? <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Guardando...</>
                      : "Guardar"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowForm(false)}
                    disabled={guardando}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                Agregar horario
              </Button>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Programa form dialog ─────────────────────────────────────────────────────

function ProgramaFormDialog({
  convocatoriaId,
  programa,
  departamentos,
  maestros,
  carreras,
  onClose,
  onSaved,
}: {
  convocatoriaId: number
  programa: Programa | null
  departamentos: Departamento[]
  maestros: Maestro[]
  carreras: Carrera[]
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<ProgramaForm>(
    programa ? programaToForm(programa) : EMPTY_FORM
  )
  const [guardando, setGuardando] = useState(false)
  const isEdit = programa !== null

  // En un programa interno se ofrecen los maestros de ese departamento; en uno
  // externo no hay departamento del Tec al que acotar, así que se ofrecen todos.
  const maestrosDisponibles =
    form.tipo_ubicacion === "interno" && form.departamento_id
      ? maestros.filter((m) => String(m.departamento_id ?? "") === form.departamento_id)
      : maestros

  // number[] para las carreras permitidas, que ahora son referencias al catálogo
  const set = (key: keyof ProgramaForm, value: string | boolean | number[]) =>
    setForm((p) => ({ ...p, [key]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    try {
      const payload = formToPayload(form)
      const res = isEdit
        ? await apiFetch(`/api/admin/programas/${programa!.id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          })
        : await apiFetch(`/api/admin/convocatorias/${convocatoriaId}/programas`, {
            method: "POST",
            body: JSON.stringify(payload),
          })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Error al guardar"); return }
      toast.success(isEdit ? "Programa actualizado" : "Programa creado")
      onSaved()
    } catch {
      toast.error("Error de conexión")
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="w-[90vw] sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar programa" : "Nuevo programa"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Editando: ${programa!.nombre}`
              : "Completa los datos del programa de servicio social."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {/* 2 columnas: izquierda info básica, derecha contenido + contacto */}
          <div className="grid grid-cols-2 gap-x-8">

            {/* ── Columna izquierda: Info básica ── */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Información básica
              </p>
              <div className="space-y-1">
                <Label>Institución / dependencia</Label>
                <Input
                  placeholder="Ej. CÁRITAS DE MONTERREY A.B.P."
                  value={form.nombre_dependencia}
                  onChange={(e) => set("nombre_dependencia", e.target.value)}
                  disabled={guardando}
                />
              </div>
              <div className="space-y-1">
                <Label>Nombre del programa *</Label>
                <Input
                  placeholder="Ej. Campaña Ayudemos de Corazón"
                  value={form.nombre}
                  onChange={(e) => set("nombre", e.target.value)}
                  required
                  disabled={guardando}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Tipo de ubicación *</Label>
                  <Select
                    value={form.tipo_ubicacion}
                    onValueChange={(v) =>
                      setForm((p) => ({
                        ...p,
                        tipo_ubicacion: v as "interno" | "externo",
                        departamento_id: "",
                        departamento_externo: "",
                      }))
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="externo">Externo</SelectItem>
                      <SelectItem value="interno">Interno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Tipo de programa</Label>
                  <Select
                    value={form.tipo_programa || "ninguno"}
                    onValueChange={(v) => set("tipo_programa", v === "ninguno" ? "" : v)}
                    disabled={guardando}
                  >
                    <SelectTrigger><SelectValue placeholder="Sin clasificar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ninguno">Sin clasificar</SelectItem>
                      <SelectItem value="educacion_adultos">Educación de adultos</SelectItem>
                      <SelectItem value="desarrollo_comunidad">Desarrollo de la comunidad</SelectItem>
                      <SelectItem value="actividades_deportivas">Actividades deportivas</SelectItem>
                      <SelectItem value="actividades_civicas">Actividades cívicas</SelectItem>
                      <SelectItem value="actividades_culturales">Actividades culturales</SelectItem>
                      <SelectItem value="medio_ambiente">Medio ambiente</SelectItem>
                      <SelectItem value="desarrollo_sustentable">Desarrollo sustentable</SelectItem>
                      <SelectItem value="apoyo_salud">Apoyo a la salud</SelectItem>
                      <SelectItem value="otros">Otros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>
                  Departamento {form.tipo_ubicacion === "interno" && <span className="text-destructive">*</span>}
                </Label>
                {form.tipo_ubicacion === "interno" ? (
                  // Obligatorio: el alumno hereda este departamento al confirmarse
                  // su inscripción, así que "sin departamento" dejaría al alumno sin él.
                  <Select
                    value={form.departamento_id}
                    onValueChange={(v) => set("departamento_id", v)}
                    disabled={guardando}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecciona un departamento" /></SelectTrigger>
                    <SelectContent>
                      {departamentos.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>{d.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder="Ej. Recursos Humanos, Área Social, Voluntariado..."
                    value={form.departamento_externo}
                    onChange={(e) => set("departamento_externo", e.target.value)}
                    disabled={guardando}
                  />
                )}
              </div>
              <div className="space-y-1">
                <Label>Descripción</Label>
                <Textarea
                  placeholder="Descripción breve del programa..."
                  value={form.descripcion}
                  onChange={(e) => set("descripcion", e.target.value)}
                  disabled={guardando}
                  rows={2}
                  className="resize-none"
                />
              </div>
              <div className="space-y-1">
                <Label>Objetivo</Label>
                <Textarea
                  placeholder="Objetivo principal del programa..."
                  value={form.objetivo}
                  onChange={(e) => set("objetivo", e.target.value)}
                  disabled={guardando}
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>

            {/* ── Columna derecha: Contenido + Responsables ── */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Contenido y requisitos
              </p>
              <div className="space-y-1">
                <Label>Actividades</Label>
                <Textarea
                  placeholder="Actividades que realizará el alumno..."
                  value={form.actividades}
                  onChange={(e) => set("actividades", e.target.value)}
                  disabled={guardando}
                  rows={3}
                  className="resize-none"
                />
              </div>
              <div className="space-y-1">
                <Label>Carreras permitidas</Label>
                <div className="rounded-md border p-3 space-y-2 max-h-44 overflow-y-auto">
                  {carreras.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay carreras en el catálogo.</p>
                  ) : (
                    carreras.map((c) => {
                      const marcada = form.carreras_permitidas_ids.includes(c.id)
                      return (
                        <div key={c.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`carrera-${c.id}`}
                            checked={marcada}
                            disabled={guardando}
                            onCheckedChange={(v) =>
                              set(
                                "carreras_permitidas_ids",
                                v === true
                                  ? [...form.carreras_permitidas_ids, c.id]
                                  : form.carreras_permitidas_ids.filter((id) => id !== c.id),
                              )
                            }
                          />
                          <Label htmlFor={`carrera-${c.id}`} className="font-normal cursor-pointer">
                            {c.nombre} <span className="text-muted-foreground">({c.clave})</span>
                          </Label>
                        </div>
                      )
                    })
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Sin ninguna marcada, el programa queda abierto a todas las carreras.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="constancia"
                  checked={form.requiere_constancia_laboral}
                  onCheckedChange={(checked) => set("requiere_constancia_laboral", Boolean(checked))}
                  disabled={guardando}
                />
                <Label htmlFor="constancia">Requiere constancia laboral</Label>
              </div>

              <Separator />

              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Supervisión de horas
              </p>
              <div className="space-y-1">
                <Label>
                  Responsable de validar las horas <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.maestro_id}
                  onValueChange={(v) => set("maestro_id", v)}
                  disabled={guardando}
                >
                  <SelectTrigger><SelectValue placeholder="Selecciona un maestro" /></SelectTrigger>
                  <SelectContent>
                    {maestrosDisponibles.length === 0 ? (
                      <div className="px-2 py-3 text-sm text-muted-foreground">
                        No hay maestros disponibles
                      </div>
                    ) : (
                      maestrosDisponibles.map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>
                          {m.nombre} {m.apellidos}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Se creará un curso de servicio social para este programa. Los alumnos
                  quedarán inscritos en él al confirmarse su inscripción, y esta persona
                  revisará sus avances y les asignará horas.
                </p>
              </div>

              <Separator />

              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Responsables y contacto
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Responsable de la dependencia</Label>
                  <Input
                    placeholder="Nombre completo"
                    value={form.responsable_dependencia_nombre}
                    onChange={(e) => set("responsable_dependencia_nombre", e.target.value)}
                    disabled={guardando}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Puesto</Label>
                  <Input
                    placeholder="Ej. Director General"
                    value={form.responsable_dependencia_puesto}
                    onChange={(e) => set("responsable_dependencia_puesto", e.target.value)}
                    disabled={guardando}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Responsable del programa</Label>
                  <Input
                    placeholder="Nombre completo"
                    value={form.responsable_programa_nombre}
                    onChange={(e) => set("responsable_programa_nombre", e.target.value)}
                    disabled={guardando}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Puesto</Label>
                  <Input
                    placeholder="Ej. Coordinador de Voluntarios"
                    value={form.responsable_programa_puesto}
                    onChange={(e) => set("responsable_programa_puesto", e.target.value)}
                    disabled={guardando}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Domicilio</Label>
                <Input
                  placeholder="Dirección completa de la institución"
                  value={form.domicilio}
                  onChange={(e) => set("domicilio", e.target.value)}
                  disabled={guardando}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Teléfono</Label>
                  <Input
                    placeholder="Ej. 81 1340 2090"
                    value={form.telefono}
                    onChange={(e) => set("telefono", e.target.value)}
                    disabled={guardando}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Email de contacto</Label>
                  <Input
                    type="email"
                    placeholder="contacto@institucion.org"
                    value={form.email_contacto}
                    onChange={(e) => set("email_contacto", e.target.value)}
                    disabled={guardando}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-5">
            <Button type="button" variant="outline" onClick={onClose} disabled={guardando}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando}>
              {guardando
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isEdit ? "Guardando..." : "Creando..."}</>
                : isEdit ? "Guardar cambios" : "Crear programa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── ProgramasDialog (exported) ───────────────────────────────────────────────

export function ProgramasDialog({
  convocatoria,
  onClose,
}: {
  convocatoria: { id: number; nombre: string; estado: string }
  onClose: () => void
}) {
  const [programas, setProgramas] = useState<Programa[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [loading, setLoading] = useState(true)

  const [maestros, setMaestros] = useState<Maestro[]>([])
  const [carreras, setCarreras] = useState<Carrera[]>([])
  const [programaForm, setProgramaForm] = useState<{ programa: Programa | null } | null>(null)
  const [horariosFor, setHorariosFor] = useState<Programa | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Programa | null>(null)
  const [eliminando, setEliminando] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [resP, resD, resM, resC] = await Promise.all([
        apiFetch(`/api/admin/convocatorias/${convocatoria.id}/programas`),
        apiFetch("/api/main-admin/departamentos"),
        // Candidatos a responsable de validar las horas del programa
        apiFetch("/api/admin/usuarios?tipo=maestro&status=active&limit=200"),
        apiFetch("/api/main-admin/carreras"),
      ])
      const dataP = await resP.json()
      const dataD = await resD.json()
      const dataM = await resM.json()
      const dataC = await resC.json()
      if (!resP.ok) {
        toast.error(dataP.error || `Error al cargar programas (${resP.status})`)
        return
      }
      setProgramas(dataP.programas ?? [])
      setDepartamentos(dataD.departamentos ?? [])
      setMaestros(dataM.usuarios ?? [])
      setCarreras(dataC.carreras ?? [])
    } catch (e) {
      toast.error(`Error de conexión: ${e}`)
    } finally {
      setLoading(false)
    }
  }, [convocatoria.id])

  useEffect(() => { load() }, [load])

  async function handleEliminar() {
    if (!confirmDelete) return
    setEliminando(true)
    try {
      const res = await apiFetch(`/api/admin/programas/${confirmDelete.id}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Error al eliminar"); return }
      toast.success("Programa eliminado")
      setConfirmDelete(null)
      await load()
    } catch {
      toast.error("Error de conexión")
    } finally {
      setEliminando(false)
    }
  }

  const cerrada = convocatoria.estado === "cerrada"

  return (
    <>
      <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Programas — {convocatoria.nombre}
            </DialogTitle>
            <DialogDescription>
              {programas.length} programa(s) registrado(s).
              {cerrada && " La convocatoria está cerrada — no se pueden agregar ni editar programas."}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {!cerrada && (
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => setProgramaForm({ programa: null })}>
                    <Plus className="mr-2 h-3.5 w-3.5" />
                    Agregar programa
                  </Button>
                </div>
              )}

              {programas.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Sin programas aún</p>
                  <p className="text-sm mt-1">
                    Agrega el primer programa para esta convocatoria.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {programas.map((p) => (
                    <div key={p.id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          {p.nombre_dependencia && (
                            <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                              {p.nombre_dependencia}
                            </p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{p.nombre}</span>
                            <Badge
                              variant={p.tipo_ubicacion === "interno" ? "secondary" : "outline"}
                              className="text-xs"
                            >
                              {p.tipo_ubicacion === "interno" ? "Interno" : "Externo"}
                            </Badge>
                            {p.tipo_programa && (
                              <Badge variant="outline" className="text-xs">
                                {p.tipo_programa}
                              </Badge>
                            )}
                          </div>
                          {p.departamento_nombre && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Building2 className="h-3 w-3 shrink-0" />
                              {p.departamento_nombre}
                            </p>
                          )}
                          <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {Number(p.cupo_disponible)}/{Number(p.plazas_total)} plazas disponibles
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {Number(p.total_horarios)} horario(s)
                            </span>
                            {p.carreras_permitidas && p.carreras_permitidas.length > 0 && (
                              <span>Carreras: {p.carreras_permitidas.join(", ")}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => setHorariosFor(p)}
                          >
                            <Clock className="mr-1 h-3 w-3" />
                            Horarios
                          </Button>
                          {!cerrada && (
                            <>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setProgramaForm({ programa: p })}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => setConfirmDelete(p)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rendered at same level — avoids Radix nested dialog issues */}
      {programaForm !== null && (
        <ProgramaFormDialog
          convocatoriaId={convocatoria.id}
          programa={programaForm.programa}
          departamentos={departamentos}
          maestros={maestros}
          carreras={carreras}
          onClose={() => setProgramaForm(null)}
          onSaved={async () => { setProgramaForm(null); await load() }}
        />
      )}

      {horariosFor && (
        <HorariosDialog
          programa={horariosFor}
          onClose={() => { setHorariosFor(null); load() }}
        />
      )}

      <Dialog open={!!confirmDelete} onOpenChange={(open) => { if (!open) setConfirmDelete(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar programa</DialogTitle>
            <DialogDescription>
              ¿Eliminar <strong>{confirmDelete?.nombre}</strong>? Solo es posible si no tiene
              inscripciones activas. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(null)}
              disabled={eliminando}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleEliminar} disabled={eliminando}>
              {eliminando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
