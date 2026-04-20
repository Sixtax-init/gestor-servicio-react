"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Building2, User, Mail, Phone, MapPin, Pencil, Save, X, GraduationCap, Clock, ImagePlus, Loader2 } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"

interface ConfiguracionInstitucional {
  nombre: string | null
  abreviatura: string | null
  direccion: string | null
  email: string | null
  telefono: string | null
  logo_url: string | null
  encargado_nombre: string | null
  encargado_cargo: string | null
  encargado_email: string | null
  encargado_telefono: string | null
  ciclo_nombre: string | null
  ciclo_inicio: string | null
  ciclo_fin: string | null
  horas_minimas: number | null
}

const EMPTY: ConfiguracionInstitucional = {
  nombre: "", abreviatura: "", direccion: "", email: "", telefono: "", logo_url: null,
  encargado_nombre: "", encargado_cargo: "", encargado_email: "", encargado_telefono: "",
  ciclo_nombre: "", ciclo_inicio: "", ciclo_fin: "", horas_minimas: 480,
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 p-1.5 rounded-md bg-muted shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || <span className="text-muted-foreground italic">Sin configurar</span>}</p>
      </div>
    </div>
  )
}

export function InstitucionTab() {
  const [config, setConfig] = useState<ConfiguracionInstitucional>(EMPTY)
  const [form, setForm] = useState<ConfiguracionInstitucional>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [editingInstitucion, setEditingInstitucion] = useState(false)
  const [editingEncargado, setEditingEncargado] = useState(false)
  const [editingCiclo, setEditingCiclo] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchConfig() }, [])

  const fetchConfig = async () => {
    setLoading(true)
    try {
      const res = await apiFetch("/api/main-admin/configuracion")
      if (res.ok) {
        const { config: data } = await res.json()
        if (data) { setConfig(data); setForm(data) }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const save = async (section: "institucion" | "encargado" | "ciclo") => {
    setSaving(true)
    try {
      const res = await apiFetch("/api/main-admin/configuracion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      const { config: updated } = await res.json()
      setConfig(updated)
      setForm(updated)
      if (section === "institucion") setEditingInstitucion(false)
      if (section === "encargado") setEditingEncargado(false)
      if (section === "ciclo") setEditingCiclo(false)
      toast.success("Configuración guardada")
    } catch {
      toast.error("Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = (section: "institucion" | "encargado" | "ciclo") => {
    setForm(config)
    if (section === "institucion") setEditingInstitucion(false)
    if (section === "encargado") setEditingEncargado(false)
    if (section === "ciclo") setEditingCiclo(false)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("type", "institucion")
      const res = await apiFetch("/api/upload", { method: "POST", body: fd })
      if (!res.ok) throw new Error()
      const { ruta } = await res.json()
      const updated = { ...form, logo_url: ruta }
      setForm(updated)
      // Guardar inmediatamente solo el logo
      const saveRes = await apiFetch("/api/main-admin/configuracion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...config, logo_url: ruta }),
      })
      if (!saveRes.ok) throw new Error()
      const { config: saved } = await saveRes.json()
      setConfig(saved)
      setForm(saved)
      toast.success("Logo actualizado")
    } catch {
      toast.error("Error al subir el logo")
    } finally {
      setUploadingLogo(false)
      if (logoInputRef.current) logoInputRef.current.value = ""
    }
  }

  const field = (key: keyof ConfiguracionInstitucional) => ({
    value: (form[key] as string) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value })),
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Cargando configuración...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-1">

      {/* ── Datos de la institución ── */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-base">Datos de la Institución</CardTitle>
              <CardDescription>Información que aparece en reportes y documentos oficiales</CardDescription>
            </div>
          </div>
          {!editingInstitucion ? (
            <Button variant="outline" size="sm" onClick={() => setEditingInstitucion(true)}>
              <Pencil className="w-4 h-4 mr-1" /> Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => save("institucion")} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                Guardar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => cancelEdit("institucion")} disabled={saving}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Logo */}
          <div className="flex items-center gap-5">
            <div className="relative w-20 h-20 rounded-xl border bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
              {config.logo_url ? (
                <Image src={config.logo_url} alt="Logo institucional" width={72} height={72} className="object-contain p-1" />
              ) : (
                <Building2 className="w-8 h-8 text-muted-foreground/30" />
              )}
              {uploadingLogo && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Logo institucional</p>
              <p className="text-xs text-muted-foreground mb-2">Aparece en reportes y documentos generados</p>
              <Button
                variant="outline" size="sm" className="gap-1.5"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
              >
                <ImagePlus className="w-4 h-4" />
                {config.logo_url ? "Cambiar logo" : "Subir logo"}
              </Button>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>
          </div>

          <Separator />

          {!editingInstitucion ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow icon={Building2} label="Nombre completo"       value={config.nombre} />
              <InfoRow icon={Building2} label="Abreviatura"           value={config.abreviatura} />
              <InfoRow icon={MapPin}    label="Dirección"             value={config.direccion} />
              <InfoRow icon={Mail}      label="Correo institucional"  value={config.email} />
              <InfoRow icon={Phone}     label="Teléfono"              value={config.telefono} />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Nombre completo</Label>
                <Input {...field("nombre")} placeholder="Ej. Instituto Tecnológico de Nuevo León" />
              </div>
              <div className="space-y-1.5">
                <Label>Abreviatura</Label>
                <Input {...field("abreviatura")} placeholder="Ej. ITNL" />
              </div>
              <div className="space-y-1.5">
                <Label>Teléfono</Label>
                <Input {...field("telefono")} placeholder="Ej. 81 8000 0000" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Dirección</Label>
                <Input {...field("direccion")} placeholder="Dirección completa" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Correo institucional</Label>
                <Input {...field("email")} type="email" placeholder="contacto@institucion.edu.mx" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Encargado de Servicio Social ── */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-base">Encargado de Servicio Social</CardTitle>
              <CardDescription>Sus datos aparecen como responsable en los reportes generados</CardDescription>
            </div>
          </div>
          {!editingEncargado ? (
            <Button variant="outline" size="sm" onClick={() => setEditingEncargado(true)}>
              <Pencil className="w-4 h-4 mr-1" /> Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => save("encargado")} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                Guardar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => cancelEdit("encargado")} disabled={saving}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {!editingEncargado ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow icon={User}         label="Nombre completo" value={config.encargado_nombre} />
              <InfoRow icon={GraduationCap} label="Cargo"          value={config.encargado_cargo} />
              <InfoRow icon={Mail}         label="Correo"          value={config.encargado_email} />
              <InfoRow icon={Phone}        label="Teléfono"        value={config.encargado_telefono} />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Nombre completo</Label>
                <Input {...field("encargado_nombre")} placeholder="Nombre del coordinador" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Cargo</Label>
                <Input {...field("encargado_cargo")} placeholder="Ej. Coordinador de Servicio Social" />
              </div>
              <div className="space-y-1.5">
                <Label>Correo</Label>
                <Input {...field("encargado_email")} type="email" placeholder="encargado@institucion.edu.mx" />
              </div>
              <div className="space-y-1.5">
                <Label>Teléfono</Label>
                <Input {...field("encargado_telefono")} placeholder="Ext. o directo" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Ciclo escolar ── */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-base">Ciclo Escolar Activo</CardTitle>
              <CardDescription>Periodo vigente para reportes y seguimiento de horas</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {config.ciclo_nombre && <Badge className="bg-green-600 text-white">Activo</Badge>}
            {!editingCiclo ? (
              <Button variant="outline" size="sm" onClick={() => setEditingCiclo(true)}>
                <Pencil className="w-4 h-4 mr-1" /> Editar
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => save("ciclo")} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                  Guardar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => cancelEdit("ciclo")} disabled={saving}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!editingCiclo ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InfoRow icon={GraduationCap} label="Periodo"         value={config.ciclo_nombre} />
              <InfoRow icon={Clock} label="Fecha de inicio"         value={config.ciclo_inicio ? new Date(config.ciclo_inicio).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" }) : null} />
              <InfoRow icon={Clock} label="Fecha de cierre"         value={config.ciclo_fin ? new Date(config.ciclo_fin).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" }) : null} />
              <Separator className="sm:col-span-3" />
              <InfoRow icon={Clock} label="Horas mínimas de Servicio Social" value={config.horas_minimas ? `${config.horas_minimas} horas` : null} />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Nombre del periodo</Label>
                <Input {...field("ciclo_nombre")} placeholder="Ej. Enero – Junio 2026" />
              </div>
              <div className="space-y-1.5">
                <Label>Fecha de inicio</Label>
                <Input type="date" {...field("ciclo_inicio")} />
              </div>
              <div className="space-y-1.5">
                <Label>Fecha de cierre</Label>
                <Input type="date" {...field("ciclo_fin")} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Horas mínimas de Servicio Social</Label>
                <Input
                  type="number"
                  value={form.horas_minimas ?? 480}
                  onChange={(e) => setForm(prev => ({ ...prev, horas_minimas: Number(e.target.value) }))}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
