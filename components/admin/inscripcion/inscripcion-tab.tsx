"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Loader2,
  Plus,
  ChevronRight,
  CalendarDays,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  RefreshCw,
  Shuffle,
  ExternalLink,
  Trash2,
  GraduationCap,
  AlertTriangle,
  AlertCircle,
  FileCheck,
} from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import { toast } from "sonner"
import { ProgramasDialog } from "./programas-panel"

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDate(d: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
}

function convBadge(estado: string) {
  const map: Record<string, string> = {
    borrador: "bg-gray-100 text-gray-700 border-gray-200",
    activa: "bg-green-100 text-green-700 border-green-200",
    en_seleccion: "bg-blue-100 text-blue-700 border-blue-200",
    repechaje: "bg-yellow-100 text-yellow-700 border-yellow-200",
    cerrada: "bg-red-100 text-red-700 border-red-200",
  }
  const cls = map[estado] ?? "bg-gray-100 text-gray-600"
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cls} capitalize`}>
      {estado.replace("_", " ")}
    </span>
  )
}

function solicitudBadge(estado: string) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pendiente: { label: "Pendiente", variant: "secondary" },
    aprobada: { label: "Aprobada", variant: "default" },
    rechazada: { label: "Rechazada", variant: "destructive" },
  }
  const cfg = map[estado] ?? { label: estado, variant: "outline" }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}

// ─── interfaces ──────────────────────────────────────────────────────────────

interface Convocatoria {
  id: number
  nombre: string
  estado: string
  fecha_inicio_registro: string
  fecha_fin_registro: string
  fecha_platica: string | null
  fecha_inicio_seleccion: string | null
  fecha_fin_seleccion: string | null
  fecha_inicio_repechaje: string | null
  fecha_fin_repechaje: string | null
  total_solicitudes?: number
  solicitudes_pendientes?: number
  solicitudes_aprobadas?: number
  total_programas?: number
  turnos_normal?: number
  turnos_repechaje?: number
}

interface SolicitudRow {
  id: number
  estado: string
  created_at: string
  semestre: string | null
  periodo: string | null
  matricula: string
  alumno_nombre: string
  alumno_apellidos: string
  carrera: string
  convocatoria_nombre: string
  total_documentos: number
  tiene_propuesta: boolean
  inscripcion_estado: string | null
}

interface InscripcionDetalle {
  id: number
  inscripcion_estado: string
  numero_oficio: string | null
  oficio_url: string | null
  oficio_firmado_url: string | null
  fecha_inicio_actividades: string | null
  fecha_fin_actividades: string | null
  fecha_confirmacion: string | null
  programa_nombre: string
  programa_domicilio: string | null
  departamento_nombre: string | null
  dias: string
  hora_inicio: string
  hora_fin: string
}

interface SolicitudDetalle {
  id: number
  estado: string
  motivo_rechazo: string | null
  semestre: string | null
  periodo: string | null
  horas_previas_acreditadas: number
  matricula: string
  alumno_nombre: string
  alumno_apellidos: string
  alumno_email: string
  carrera: string
  sexo: string
  alumno_telefono: string | null
  alumno_domicilio: string | null
  convocatoria_nombre: string
  fecha_revision: string | null
  revisado_por_nombre: string | null
}

interface Documento {
  id: number
  tipo_documento: string
  nombre_archivo: string
  ruta_archivo: string
  tipo_mime: string
  tamano_bytes: number
  uploaded_at: string
}

// ─── Convocatorias panel ─────────────────────────────────────────────────────

const TRANSICION_LABELS: Record<string, string> = {
  activa: "Activar",
  en_seleccion: "Iniciar selección",
  repechaje: "Iniciar repechaje",
  cerrada: "Cerrar",
}

function ConvocatoriasPanel() {
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creando, setCreando] = useState(false)

  // Programas dialog
  const [programasDialog, setProgramasDialog] = useState<{ id: number; nombre: string; estado: string } | null>(null)

  // Confirmación de cierre
  const [confirmCerrar, setConfirmCerrar] = useState<{ id: number; nombre: string } | null>(null)
  const [cerrando, setCerrando] = useState(false)

  // Turno assignment
  const [turnoDialog, setTurnoDialog] = useState<{ id: number; estado: string; aprobadas: number; turnos_normal: number; turnos_repechaje: number } | null>(null)
  const [turnoForm, setTurnoForm] = useState({ fecha_inicio_base: "", duracion_minutos: 30, tipo: "normal" as "normal" | "repechaje", alumnos_por_grupo: 5 })
  const [asignando, setAsignando] = useState(false)
  const [eliminandoTurnos, setEliminandoTurnos] = useState(false)

  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    fecha_inicio_registro: "",
    fecha_fin_registro: "",
    fecha_platica: "",
    fecha_inicio_seleccion: "",
    fecha_fin_seleccion: "",
    fecha_inicio_repechaje: "",
    fecha_fin_repechaje: "",
  })

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await apiFetch("/api/admin/convocatorias")
      const data = await res.json()
      setConvocatorias(data.convocatorias ?? [])
    } catch {
      toast.error("Error al cargar convocatorias")
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreando(true)
    try {
      const payload = {
        ...form,
        fecha_platica: form.fecha_platica || undefined,
        fecha_inicio_seleccion: form.fecha_inicio_seleccion || undefined,
        fecha_fin_seleccion: form.fecha_fin_seleccion || undefined,
        fecha_inicio_repechaje: form.fecha_inicio_repechaje || undefined,
        fecha_fin_repechaje: form.fecha_fin_repechaje || undefined,
      }
      const res = await apiFetch("/api/admin/convocatorias", {
        method: "POST",
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Error al crear")
        return
      }
      toast.success("Convocatoria creada")
      setShowCreate(false)
      setForm({ nombre: "", descripcion: "", fecha_inicio_registro: "", fecha_fin_registro: "", fecha_platica: "", fecha_inicio_seleccion: "", fecha_fin_seleccion: "", fecha_inicio_repechaje: "", fecha_fin_repechaje: "" })
      await load()
    } catch {
      toast.error("Error de conexión")
    } finally {
      setCreando(false)
    }
  }

  async function handleTransicion(id: number, nuevoEstado: string) {
    try {
      const res = await apiFetch(`/api/admin/convocatorias/${id}/estado`, {
        method: "PATCH",
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Error al cambiar estado")
        return
      }
      toast.success(`Estado actualizado a "${nuevoEstado.replace("_", " ")}"`)
      await load()
    } catch {
      toast.error("Error de conexión")
    }
  }

  async function handleConfirmarCierre() {
    if (!confirmCerrar) return
    setCerrando(true)
    try {
      const res = await apiFetch(`/api/admin/convocatorias/${confirmCerrar.id}/estado`, {
        method: "PATCH",
        body: JSON.stringify({ estado: "cerrada" }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Error al cerrar convocatoria"); return }
      toast.success("Convocatoria cerrada")
      setConfirmCerrar(null)
      await load()
    } catch {
      toast.error("Error de conexión")
    } finally {
      setCerrando(false)
    }
  }

  async function handleEliminarTurnos() {
    if (!turnoDialog) return
    setEliminandoTurnos(true)
    try {
      const res = await apiFetch(`/api/admin/convocatorias/${turnoDialog.id}/asignar-turnos?tipo=${turnoForm.tipo}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Error al eliminar turnos"); return }
      toast.success(`${data.eliminados} turno(s) eliminado(s). Ahora puedes reasignar.`)
      // Zero out the count locally so hayConflicto recomputes to false
      setTurnoDialog((prev) => prev ? {
        ...prev,
        turnos_normal: turnoForm.tipo === "normal" ? 0 : prev.turnos_normal,
        turnos_repechaje: turnoForm.tipo === "repechaje" ? 0 : prev.turnos_repechaje,
      } : prev)
    } catch {
      toast.error("Error de conexión")
    } finally {
      setEliminandoTurnos(false)
    }
  }

  async function handleAsignarTurnos(e: React.FormEvent) {
    e.preventDefault()
    if (!turnoDialog) return
    if (!turnoForm.fecha_inicio_base) { toast.error("La fecha de inicio es requerida"); return }
    setAsignando(true)
    try {
      const res = await apiFetch(`/api/admin/convocatorias/${turnoDialog.id}/asignar-turnos`, {
        method: "POST",
        body: JSON.stringify({
          fecha_inicio_base: turnoForm.fecha_inicio_base,
          duracion_minutos: turnoForm.duracion_minutos,
          tipo: turnoForm.tipo,
          alumnos_por_grupo: turnoForm.alumnos_por_grupo,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Error al asignar turnos"); return }
      toast.success(`${data.total_turnos} alumnos en ${data.total_grupos} grupos asignados`, {
        description: `Primer grupo: ${new Date(data.primer_turno).toLocaleString("es-MX")} — Último: ${new Date(data.ultimo_turno).toLocaleString("es-MX")}`,
        duration: 8000,
      })
      setTurnoDialog(null)
    } catch {
      toast.error("Error de conexión")
    } finally {
      setAsignando(false)
    }
  }

  const NEXT_STATES: Record<string, string[]> = {
    borrador: ["activa"],
    activa: ["en_seleccion", "cerrada"],
    en_seleccion: ["repechaje", "cerrada"],
    repechaje: ["cerrada"],
    cerrada: [],
  }

  const ESTADOS_ACTIVOS = ["borrador", "activa", "en_seleccion", "repechaje"]
  const activas = convocatorias.filter((c) => ESTADOS_ACTIVOS.includes(c.estado))
  const historicas = convocatorias.filter((c) => c.estado === "cerrada")

  const [histSearch, setHistSearch] = useState("")
  const [histPage, setHistPage] = useState(1)
  const HIST_PAGE_SIZE = 5

  const historicasFiltradas = historicas.filter((c) =>
    c.nombre.toLowerCase().includes(histSearch.toLowerCase())
  )
  const histPages = Math.max(1, Math.ceil(historicasFiltradas.length / HIST_PAGE_SIZE))
  const historicasPagina = historicasFiltradas.slice(
    (histPage - 1) * HIST_PAGE_SIZE,
    histPage * HIST_PAGE_SIZE
  )

  function registroProgress(inicio: string, fin: string) {
    const now = Date.now()
    const start = new Date(inicio).getTime()
    const end = new Date(fin).getTime()
    if (now <= start) return 0
    if (now >= end) return 100
    return Math.round(((now - start) / (end - start)) * 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {convocatorias.length} convocatoria{convocatorias.length !== 1 ? "s" : ""} registrada{convocatorias.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva convocatoria
        </Button>
      </div>

      {convocatorias.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No hay convocatorias aún. Crea la primera.
          </CardContent>
        </Card>
      )}

      {/* ── ACTIVAS ──────────────────────────────────── */}
      {(convocatorias.length > 0 || activas.length > 0) && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Activas ({activas.length})
            </span>
          </div>

          {activas.length === 0 ? (
            <p className="text-sm text-muted-foreground pl-4">No hay convocatorias activas en este momento.</p>
          ) : (
            <div className="space-y-3">
              {activas.map((c) => {
                const progress = registroProgress(c.fecha_inicio_registro, c.fecha_fin_registro)
                return (
                  <Card key={c.id} className="border-l-4 border-l-green-500">
                    <CardContent className="pt-5 pb-4">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        {/* Left: info */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            {convBadge(c.estado)}
                            {c.total_programas !== undefined && (
                              <span className="text-xs text-muted-foreground">
                                {Number(c.total_programas)} programa{Number(c.total_programas) !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                          <h3 className="text-xl font-bold">{c.nombre}</h3>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                            <span>Registro: {formatDate(c.fecha_inicio_registro)} — {formatDate(c.fecha_fin_registro)}</span>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Período de registro</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-green-500 transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Right: stats + actions */}
                        <div className="flex flex-col gap-3 lg:items-end">
                          <div className="flex gap-3">
                            <div className="rounded-lg border px-4 py-2 text-center min-w-[80px]">
                              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                                <Users className="h-3 w-3" /> Solicitudes
                              </p>
                              <p className="text-2xl font-bold">{Number(c.total_solicitudes ?? 0)}</p>
                            </div>
                            <div className="rounded-lg border px-4 py-2 text-center min-w-[80px]">
                              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Aprobadas
                              </p>
                              <p className="text-2xl font-bold">{Number(c.solicitudes_aprobadas ?? 0)}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setProgramasDialog({ id: c.id, nombre: c.nombre, estado: c.estado })}
                            >
                              <GraduationCap className="mr-1 h-3 w-3" />
                              Programas
                            </Button>
                            {["en_seleccion", "repechaje"].includes(c.estado) && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  setTurnoForm({ fecha_inicio_base: "", duracion_minutos: 30, tipo: c.estado === "repechaje" ? "repechaje" : "normal", alumnos_por_grupo: 5 })
                                  setTurnoDialog({ id: c.id, estado: c.estado, aprobadas: c.solicitudes_aprobadas ?? 0, turnos_normal: Number(c.turnos_normal ?? 0), turnos_repechaje: Number(c.turnos_repechaje ?? 0) })
                                }}
                              >
                                <Shuffle className="mr-1 h-3 w-3" />
                                Asignar Turnos
                              </Button>
                            )}
                            {(NEXT_STATES[c.estado] ?? [])
                              .filter((next) => {
                                if (next === "repechaje") {
                                  // Solo disponible cuando el período de selección ya terminó
                                  if (!c.fecha_fin_seleccion) return false
                                  return new Date() > new Date(c.fecha_fin_seleccion)
                                }
                                return true
                              })
                              .map((next) => (
                              <Button
                                key={next}
                                variant={next === "cerrada" ? "destructive" : "outline"}
                                size="sm"
                                onClick={() =>
                                  next === "cerrada"
                                    ? setConfirmCerrar({ id: c.id, nombre: c.nombre })
                                    : handleTransicion(c.id, next)
                                }
                              >
                                {next === "cerrada" ? <XCircle className="mr-1 h-3 w-3" /> : null}
                                {TRANSICION_LABELS[next] ?? next}
                                {next !== "cerrada" && <ChevronRight className="ml-1 h-3 w-3" />}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── HISTÓRICO ──────────────────────────────── */}
      {historicas.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                Histórico ({historicas.length})
              </span>
            </div>
            <div className="relative sm:w-56">
              <Input
                placeholder="Buscar..."
                value={histSearch}
                onChange={(e) => { setHistSearch(e.target.value); setHistPage(1) }}
                className="pl-8 h-8 text-sm"
              />
              <svg className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </div>
          </div>

          {historicasPagina.length === 0 ? (
            <p className="text-sm text-muted-foreground pl-4">No se encontraron resultados.</p>
          ) : (
            <div className="space-y-2">
              {historicasPagina.map((c) => (
                <Card key={c.id}>
                  <CardContent className="py-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {convBadge(c.estado)}
                          <span className="font-medium text-sm">{c.nombre}</span>
                        </div>
                        <div className="flex gap-3 text-xs text-muted-foreground pl-0.5 flex-wrap">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {formatDate(c.fecha_inicio_registro)} — {formatDate(c.fecha_fin_registro)}
                          </span>
                          <span>{Number(c.total_solicitudes ?? 0)} solicitudes · {Number(c.solicitudes_aprobadas ?? 0)} aprobadas · {Number(c.total_programas ?? 0)} programas</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setProgramasDialog({ id: c.id, nombre: c.nombre, estado: c.estado })}
                      >
                        <GraduationCap className="mr-1 h-3 w-3" />
                        Programas
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {histPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={histPage <= 1} onClick={() => setHistPage((p) => p - 1)}>
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">Página {histPage} de {histPages}</span>
              <Button variant="outline" size="sm" disabled={histPage >= histPages} onClick={() => setHistPage((p) => p + 1)}>
                Siguiente
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Programas dialog */}
      {programasDialog && (
        <ProgramasDialog
          convocatoria={programasDialog}
          onClose={() => setProgramasDialog(null)}
        />
      )}

      {/* Confirmación cierre convocatoria */}
      <Dialog open={!!confirmCerrar} onOpenChange={(open) => { if (!open && !cerrando) setConfirmCerrar(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Cerrar convocatoria
            </DialogTitle>
            <DialogDescription className="pt-1">
              Esta acción es <strong>irreversible</strong>. Una convocatoria cerrada no puede reactivarse
              y no admitirá nuevas solicitudes ni cambios de estado.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
            <p className="font-medium">{confirmCerrar?.nombre}</p>
            <p className="text-muted-foreground mt-0.5">
              Todos los alumnos en proceso quedarán con el estado actual. Asegúrate de haber
              completado la asignación de programas antes de cerrar.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmCerrar(null)} disabled={cerrando}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmarCierre} disabled={cerrando}>
              {cerrando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sí, cerrar convocatoria
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Turno assignment dialog */}
      <Dialog open={!!turnoDialog} onOpenChange={(open) => { if (!open) setTurnoDialog(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shuffle className="h-4 w-4" />
              Asignar Turnos
            </DialogTitle>
            <DialogDescription>
              Los turnos se asignarán de forma aleatoria (sorteo) a todas las solicitudes aprobadas sin turno.
            </DialogDescription>
          </DialogHeader>
          {(() => {
            const aprobadas = turnoDialog?.aprobadas ?? 0
            const hayConflicto = turnoDialog
              ? (turnoForm.tipo === "normal" ? turnoDialog.turnos_normal > 0 : turnoDialog.turnos_repechaje > 0)
              : false
            const grupos = Math.ceil(aprobadas / Math.max(1, turnoForm.alumnos_por_grupo))
            const startDate = turnoForm.fecha_inicio_base ? new Date(turnoForm.fecha_inicio_base) : null
            const limite22h = startDate ? (() => { const d = new Date(startDate); d.setHours(22, 0, 0, 0); return d })() : null
            const endDate = startDate ? new Date(startDate.getTime() + grupos * turnoForm.duracion_minutos * 60_000) : null
            const pasaLimite = !!(endDate && limite22h && endDate > limite22h)
            const minDisponibles = startDate && limite22h ? Math.floor((limite22h.getTime() - startDate.getTime()) / 60_000) : null
            const maxDuracion = minDisponibles !== null && grupos > 0 ? Math.floor(minDisponibles / grupos) : null
            const fmtTime = (d: Date) => d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: true })

            return (
              <form onSubmit={handleAsignarTurnos} className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de turno *</Label>
                  <Select
                    value={turnoForm.tipo}
                    onValueChange={(v) => setTurnoForm((p) => ({ ...p, tipo: v as "normal" | "repechaje" }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="repechaje">Repechaje</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fecha y hora del primer grupo *</Label>
                  <Input
                    type="datetime-local"
                    value={turnoForm.fecha_inicio_base}
                    onChange={(e) => setTurnoForm((p) => ({ ...p, fecha_inicio_base: e.target.value }))}
                    required
                    disabled={asignando}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Duración por grupo (min)</Label>
                    <Input
                      type="number"
                      min={5}
                      max={120}
                      value={turnoForm.duracion_minutos}
                      onChange={(e) => setTurnoForm((p) => ({ ...p, duracion_minutos: Number(e.target.value) }))}
                      disabled={asignando}
                    />
                    <p className="text-xs text-muted-foreground">5–120 min. Por defecto: 30.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Alumnos por grupo</Label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={turnoForm.alumnos_por_grupo}
                      onChange={(e) => setTurnoForm((p) => ({ ...p, alumnos_por_grupo: Number(e.target.value) }))}
                      disabled={asignando}
                    />
                    <p className="text-xs text-muted-foreground">Acceden al mismo tiempo.</p>
                  </div>
                </div>

                {/* Live calculation preview */}
                {startDate && aprobadas > 0 && endDate && (
                  <div className={`rounded-lg border p-3 text-sm space-y-1 ${pasaLimite ? "border-destructive/50 bg-destructive/5" : "border-border bg-muted/30"}`}>
                    <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide">Vista previa del sorteo</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
                      <span className="text-muted-foreground">Alumnos a asignar</span>
                      <span className="font-medium">{aprobadas}</span>
                      <span className="text-muted-foreground">Grupos generados</span>
                      <span className="font-medium">{grupos} grupo{grupos !== 1 ? "s" : ""} de hasta {turnoForm.alumnos_por_grupo}</span>
                      <span className="text-muted-foreground">Tiempo total</span>
                      <span className="font-medium">{grupos * turnoForm.duracion_minutos} min ({Math.floor(grupos * turnoForm.duracion_minutos / 60)}h {(grupos * turnoForm.duracion_minutos) % 60}m)</span>
                      <span className="text-muted-foreground">Último grupo termina</span>
                      <span className={`font-medium ${pasaLimite ? "text-destructive" : "text-green-600"}`}>
                        {fmtTime(endDate)}
                      </span>
                    </div>
                    {pasaLimite && (
                      <p className="text-destructive text-xs mt-1.5">
                        ⚠️ Pasa de las 10:00 p.m.
                        {maxDuracion !== null && maxDuracion >= 5
                          ? ` — Duración máxima para caber: ${maxDuracion} min/grupo`
                          : " — La hora de inicio es muy tarde para este número de grupos"}
                      </p>
                    )}
                  </div>
                )}

                {hayConflicto && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between gap-2">
                      <span>Ya existen turnos de tipo <strong>{turnoForm.tipo}</strong> asignados.</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={handleEliminarTurnos}
                        disabled={eliminandoTurnos}
                      >
                        {eliminandoTurnos ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                        <span className="ml-1">Eliminar y reasignar</span>
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setTurnoDialog(null)} disabled={asignando}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={asignando || eliminandoTurnos || pasaLimite || hayConflicto}>
                    {asignando ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sorteando...</> : <><Shuffle className="mr-2 h-4 w-4" />Realizar sorteo</>}
                  </Button>
                </DialogFooter>
              </form>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Convocatoria</DialogTitle>
            <DialogDescription>Las fechas de selección y repechaje son opcionales al crear.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                placeholder="Ej. Convocatoria Enero-Junio 2026"
                value={form.nombre}
                onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input
                placeholder="Opcional"
                value={form.descripcion}
                onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Inicio registro *</Label>
                <Input
                  type="datetime-local"
                  value={form.fecha_inicio_registro}
                  onChange={(e) => setForm((p) => ({ ...p, fecha_inicio_registro: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Fin registro *</Label>
                <Input
                  type="datetime-local"
                  value={form.fecha_fin_registro}
                  onChange={(e) => setForm((p) => ({ ...p, fecha_fin_registro: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Plática informativa</Label>
              <Input
                type="datetime-local"
                value={form.fecha_platica}
                onChange={(e) => setForm((p) => ({ ...p, fecha_platica: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Inicio selección</Label>
                <Input
                  type="datetime-local"
                  value={form.fecha_inicio_seleccion}
                  onChange={(e) => setForm((p) => ({ ...p, fecha_inicio_seleccion: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Fin selección</Label>
                <Input
                  type="datetime-local"
                  value={form.fecha_fin_seleccion}
                  onChange={(e) => setForm((p) => ({ ...p, fecha_fin_seleccion: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Inicio repechaje</Label>
                <Input
                  type="datetime-local"
                  value={form.fecha_inicio_repechaje}
                  onChange={(e) => setForm((p) => ({ ...p, fecha_inicio_repechaje: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Fin repechaje</Label>
                <Input
                  type="datetime-local"
                  value={form.fecha_fin_repechaje}
                  onChange={(e) => setForm((p) => ({ ...p, fecha_fin_repechaje: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)} disabled={creando}>
                Cancelar
              </Button>
              <Button type="submit" disabled={creando}>
                {creando ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creando...</> : "Crear convocatoria"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Solicitudes panel ───────────────────────────────────────────────────────

const DOC_LABELS: Record<string, string> = {
  kardex: "Kardex",
  horario: "Horario",
  solicitud_prestador: "Solicitud Prestador",
  fotografia: "Fotografía",
  constancia_laboral: "Constancia Laboral",
  propuesta_formato: "Formato Propuesta",
}

function SolicitudesPanel() {
  // Convocatoria selector
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([])
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [selectedConv, setSelectedConv] = useState<number | null>(null)

  // Solicitudes
  const [solicitudes, setSolicitudes] = useState<SolicitudRow[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)

  const [filtroEstado, setFiltroEstado] = useState("")
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")

  // Detail dialog
  const [detailId, setDetailId] = useState<number | null>(null)
  const [detalle, setDetalle] = useState<SolicitudDetalle | null>(null)
  const [detalleDocumentos, setDetalleDocumentos] = useState<Documento[]>([])
  const [detalleInscripcion, setDetalleInscripcion] = useState<InscripcionDetalle | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)

  // Review dialog
  const [reviewOpen, setReviewOpen] = useState(false)
  const [decision, setDecision] = useState<"aprobada" | "rechazada">("aprobada")
  const [motivoRechazo, setMotivoRechazo] = useState("")
  const [revisando, setRevisando] = useState(false)

  // Oficio dialog
  const [oficioOpen, setOficioOpen] = useState(false)
  const [oficioAccion, setOficioAccion] = useState<"oficio_enviado" | "confirmada" | "rechazada_programa">("oficio_enviado")
  const [oficioNumero, setOficioNumero] = useState("")
  const [oficioFechaInicio, setOficioFechaInicio] = useState("")
  const [oficioFechaFin, setOficioFechaFin] = useState("")
  const [procesandoOficio, setProcesandoOficio] = useState(false)

  useEffect(() => {
    loadConvocatorias()
  }, [])

  useEffect(() => {
    if (selectedConv !== null) load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEstado, search, page, selectedConv])

  async function loadConvocatorias() {
    setLoadingConvs(true)
    try {
      const res = await apiFetch("/api/admin/convocatorias")
      const data = await res.json()
      const convs: Convocatoria[] = data.convocatorias ?? []
      setConvocatorias(convs)
      const activa = convs.find((c) => ["activa", "en_seleccion", "repechaje"].includes(c.estado))
      const primera = activa ?? convs[0] ?? null
      if (primera) setSelectedConv(primera.id)
    } catch {
      toast.error("Error al cargar convocatorias")
    } finally {
      setLoadingConvs(false)
    }
  }

  async function load() {
    if (selectedConv === null) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroEstado) params.set("estado", filtroEstado)
      if (search) params.set("search", search)
      params.set("convocatoria_id", String(selectedConv))
      params.set("page", String(page))
      params.set("limit", "15")
      const res = await apiFetch(`/api/admin/solicitudes?${params}`)
      const data = await res.json()
      setSolicitudes(data.solicitudes ?? [])
      setTotal(data.total ?? 0)
      setPages(data.pages ?? 1)
    } catch {
      toast.error("Error al cargar solicitudes")
    } finally {
      setLoading(false)
    }
  }

  function selectConv(id: number) {
    if (id === selectedConv) return
    setSelectedConv(id)
    setPage(1)
    setFiltroEstado("")
    setSearch("")
    setSearchInput("")
  }

  async function openDetail(id: number) {
    setDetailId(id)
    setDetalle(null)
    setDetalleDocumentos([])
    setDetalleInscripcion(null)
    setLoadingDetalle(true)
    try {
      const res = await apiFetch(`/api/admin/solicitudes/${id}`)
      const data = await res.json()
      setDetalle(data.solicitud)
      setDetalleDocumentos(data.documentos ?? [])
      setDetalleInscripcion(data.inscripcion ?? null)
    } catch {
      toast.error("Error al cargar detalle")
    } finally {
      setLoadingDetalle(false)
    }
  }

  async function handleProcesarOficio() {
    if (!detalleInscripcion) return
    if (oficioAccion === "oficio_enviado" && !oficioNumero.trim()) {
      toast.error("El número de oficio es requerido")
      return
    }
    if (oficioAccion === "confirmada" && !oficioFechaInicio) {
      toast.error("La fecha de inicio de actividades es requerida")
      return
    }
    setProcesandoOficio(true)
    try {
      const res = await apiFetch(`/api/admin/inscripciones/${detalleInscripcion.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          estado: oficioAccion,
          numero_oficio: oficioNumero || undefined,
          fecha_inicio_actividades: oficioFechaInicio || undefined,
          fecha_fin_actividades: oficioFechaFin || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Error al procesar"); return }

      if (oficioAccion === "rechazada_programa") {
        toast.success("Solicitud eliminada. El alumno puede iniciar el proceso desde cero.")
        setOficioOpen(false)
        setDetailId(null)
        setDetalle(null)
        await load()
      } else {
        const mensajes: Record<string, string> = {
          oficio_enviado: "Carta generada. El alumno ya puede descargarla.",
          confirmada: "¡Inscripción confirmada! El alumno ya tiene acceso como alumno.",
        }
        toast.success(mensajes[oficioAccion] ?? "Actualizado")
        setOficioOpen(false)
        setOficioNumero("")
        setOficioFechaInicio("")
        setOficioFechaFin("")
        if (detailId) await openDetail(detailId)
        await load()
      }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setProcesandoOficio(false)
    }
  }

  async function handleRevisar() {
    if (!detailId) return
    if (decision === "rechazada" && !motivoRechazo.trim()) {
      toast.error("El motivo de rechazo es requerido")
      return
    }
    setRevisando(true)
    try {
      const res = await apiFetch(`/api/admin/solicitudes/${detailId}/revisar`, {
        method: "PATCH",
        body: JSON.stringify({ decision, motivo_rechazo: motivoRechazo || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Error al revisar")
        return
      }
      toast.success(`Solicitud ${decision === "aprobada" ? "aprobada" : "rechazada"}`)
      setReviewOpen(false)
      setDetailId(null)
      setDetalle(null)
      setMotivoRechazo("")
      await load()
    } catch {
      toast.error("Error de conexión")
    } finally {
      setRevisando(false)
    }
  }

  return (
    <div className="space-y-4">

      {/* Convocatoria selector */}
      <div className="flex items-center gap-3">
        <Label className="shrink-0 text-sm">Convocatoria</Label>
        {loadingConvs ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
          </div>
        ) : (
          <Select
            value={selectedConv !== null ? String(selectedConv) : ""}
            onValueChange={(v) => selectConv(Number(v))}
          >
            <SelectTrigger className="max-w-sm">
              <SelectValue placeholder="Selecciona una convocatoria" />
            </SelectTrigger>
            <SelectContent>
              {convocatorias.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  <span className="flex items-center gap-2">
                    {c.nombre}
                    <span className="text-xs text-muted-foreground capitalize">· {c.estado.replace("_", " ")}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {!loadingConvs && selectedConv !== null && (
          <span className="text-sm text-muted-foreground">{total} solicitud(es)</span>
        )}
      </div>

      {/* No convocatoria selected */}
      {!loadingConvs && convocatorias.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No hay convocatorias registradas.
          </CardContent>
        </Card>
      )}

      {/* Filters — only when a convocatoria is selected */}
      {selectedConv !== null && (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Buscar por matrícula o nombre..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { setSearch(searchInput); setPage(1) }
              }}
              className="sm:max-w-xs"
            />
            <Select
              value={filtroEstado || "todos"}
              onValueChange={(v) => { setFiltroEstado(v === "todos" ? "" : v); setPage(1) }}
            >
              <SelectTrigger className="sm:w-40">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="aprobada">Aprobada</SelectItem>
                <SelectItem value="rechazada">Rechazada</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => { setSearch(searchInput); setPage(1); load() }}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : solicitudes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No hay solicitudes que coincidan con los filtros.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alumno</TableHead>
                    <TableHead>Carrera</TableHead>
                    <TableHead className="text-center">Docs</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {solicitudes.map((s) => (
                    <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(s.id)}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{s.alumno_nombre} {s.alumno_apellidos}</p>
                          <p className="text-xs text-muted-foreground">{s.matricula}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm max-w-[160px] truncate">{s.carrera}</TableCell>
                      <TableCell className="text-center text-sm">{String(s.total_documentos)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 flex-wrap">
                          {solicitudBadge(s.estado)}
                          {s.inscripcion_estado === "firmado_subido" && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 bg-purple-100 border border-purple-200 rounded-full px-2 py-0.5">
                              <FileCheck className="h-3 w-3" />
                              Carta firmada
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(s.created_at)}</TableCell>
                      <TableCell>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">Página {page} de {pages}</span>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                Siguiente
              </Button>
            </div>
          )}
        </>
      )}

      {/* Detail dialog */}
      <Dialog open={detailId !== null} onOpenChange={(open) => { if (!open) { setDetailId(null); setDetalle(null) } }}>
        <DialogContent className="max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle>Detalle de Solicitud</DialogTitle>
            {detalle && (
              <DialogDescription>
                {detalle.alumno_nombre} {detalle.alumno_apellidos} · {detalle.matricula}
              </DialogDescription>
            )}
          </DialogHeader>

          {loadingDetalle ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : detalle ? (
            <div className="space-y-5 overflow-y-auto overflow-x-hidden flex-1 pr-1">
              {/* Status */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Estado:</span>
                {solicitudBadge(detalle.estado)}
                {detalle.revisado_por_nombre && (
                  <span className="text-xs text-muted-foreground">por {detalle.revisado_por_nombre}</span>
                )}
              </div>

              {detalle.motivo_rechazo && detalle.estado !== "pendiente" && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{detalle.motivo_rechazo}</AlertDescription>
                </Alert>
              )}
              {detalle.motivo_rechazo && detalle.estado === "pendiente" && (
                <Alert>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <AlertTitle className="text-sm text-muted-foreground">Motivo del rechazo anterior</AlertTitle>
                  <AlertDescription className="text-muted-foreground">{detalle.motivo_rechazo}</AlertDescription>
                </Alert>
              )}

              {/* Datos alumno */}
              <div>
                <p className="text-sm font-semibold mb-2">Datos del alumno</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Matrícula: </span><span className="font-mono">{detalle.matricula}</span></div>
                  <div><span className="text-muted-foreground">Carrera: </span>{detalle.carrera}</div>
                  <div><span className="text-muted-foreground">Email: </span>{detalle.alumno_email}</div>
                  <div><span className="text-muted-foreground">Sexo: </span>{detalle.sexo === "H" ? "Hombre" : "Mujer"}</div>
                  <div><span className="text-muted-foreground">Teléfono: </span>{detalle.alumno_telefono ?? "—"}</div>
                  {detalle.alumno_domicilio && (
                    <div className="col-span-2"><span className="text-muted-foreground">Domicilio: </span>{detalle.alumno_domicilio}</div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Datos solicitud */}
              <div>
                <p className="text-sm font-semibold mb-2">Datos de la solicitud</p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Semestre: </span>{detalle.semestre ?? "—"}</div>
                  <div><span className="text-muted-foreground">Período: </span>{detalle.periodo ?? "—"}</div>
                  <div><span className="text-muted-foreground">Horas previas: </span>{detalle.horas_previas_acreditadas}</div>
                  <div><span className="text-muted-foreground">Convocatoria: </span>{detalle.convocatoria_nombre}</div>
                </div>
              </div>

              <Separator />

              {/* Documentos */}
              <div>
                <p className="text-sm font-semibold mb-2">
                  Documentos subidos ({detalleDocumentos.length})
                </p>
                {detalleDocumentos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin documentos adjuntos</p>
                ) : (
                  <div className="space-y-2">
                    {detalleDocumentos.map((d) => (
                      <div key={d.id} className="flex items-center justify-between gap-2 text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          <div className="min-w-0">
                            <span className="font-medium">{DOC_LABELS[d.tipo_documento] ?? d.tipo_documento}</span>
                            <span className="text-muted-foreground ml-1 text-xs truncate block">{d.nombre_archivo}</span>
                          </div>
                        </div>
                        <a
                          href={`/api/admin/solicitudes/${detailId}/documentos/${d.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0"
                        >
                          <Button variant="outline" size="sm" type="button">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Ver
                          </Button>
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions — only for pendiente */}
              {detalle.estado === "pendiente" && (
                <>
                  <Separator />
                  <div className="flex gap-3">
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => { setDecision("aprobada"); setMotivoRechazo(""); setReviewOpen(true) }}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Aprobar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => { setDecision("rechazada"); setMotivoRechazo(""); setReviewOpen(true) }}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Rechazar
                    </Button>
                  </div>
                </>
              )}

              {/* Inscripción / Oficio — when programa was selected */}
              {detalleInscripcion && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                      Carta de Asignación
                      <span className={`text-xs font-normal px-2 py-0.5 rounded-full border ${
                        detalleInscripcion.inscripcion_estado === "confirmada"
                          ? "bg-green-100 text-green-700 border-green-200"
                          : detalleInscripcion.inscripcion_estado === "rechazada_programa"
                          ? "bg-red-100 text-red-700 border-red-200"
                          : detalleInscripcion.inscripcion_estado === "firmado_subido"
                          ? "bg-purple-100 text-purple-700 border-purple-200"
                          : detalleInscripcion.inscripcion_estado === "oficio_enviado"
                          ? "bg-blue-100 text-blue-700 border-blue-200"
                          : "bg-yellow-100 text-yellow-700 border-yellow-200"
                      }`}>
                        {{
                          pendiente_oficio: "Pendiente de generar",
                          oficio_enviado: "Carta enviada al alumno",
                          firmado_subido: "Carta firmada recibida",
                          confirmada: "Confirmada",
                          rechazada_programa: "Rechazada por dependencia",
                        }[detalleInscripcion.inscripcion_estado] ?? detalleInscripcion.inscripcion_estado}
                      </span>
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div><span className="text-muted-foreground">Programa: </span><span className="font-medium">{detalleInscripcion.programa_nombre}</span></div>
                      {detalleInscripcion.departamento_nombre && (
                        <div><span className="text-muted-foreground">Departamento: </span>{detalleInscripcion.departamento_nombre}</div>
                      )}
                      <div><span className="text-muted-foreground">Horario: </span>{detalleInscripcion.dias} · {detalleInscripcion.hora_inicio}–{detalleInscripcion.hora_fin}</div>
                      {detalleInscripcion.numero_oficio && (
                        <div><span className="text-muted-foreground">No. Oficio: </span><span className="font-mono">{detalleInscripcion.numero_oficio}</span></div>
                      )}
                      {detalleInscripcion.oficio_url && (
                        <div className="col-span-2">
                          <a href={detalleInscripcion.oficio_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" type="button">
                              <ExternalLink className="mr-1.5 h-3 w-3" />
                              Ver carta enviada al alumno
                            </Button>
                          </a>
                        </div>
                      )}
                      {detalleInscripcion.oficio_firmado_url && (
                        <div className="col-span-2">
                          <a href={detalleInscripcion.oficio_firmado_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" type="button" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                              <ExternalLink className="mr-1.5 h-3 w-3" />
                              Ver carta firmada por la dependencia
                            </Button>
                          </a>
                        </div>
                      )}
                      {detalleInscripcion.fecha_inicio_actividades && (
                        <div><span className="text-muted-foreground">Inicio actividades: </span>{formatDate(detalleInscripcion.fecha_inicio_actividades)}</div>
                      )}
                      {detalleInscripcion.fecha_fin_actividades && (
                        <div><span className="text-muted-foreground">Fin actividades: </span>{formatDate(detalleInscripcion.fecha_fin_actividades)}</div>
                      )}
                    </div>
                    {detalleInscripcion.inscripcion_estado === "pendiente_oficio" && (
                      <Button size="sm" onClick={() => { setOficioAccion("oficio_enviado"); setOficioNumero(""); setOficioOpen(true) }}>
                        <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                        Registrar número de oficio
                      </Button>
                    )}
                    {detalleInscripcion.inscripcion_estado === "oficio_enviado" && (
                      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
                          Esperando que el alumno lleve la carta a la dependencia y suba la versión firmada.
                        </AlertDescription>
                      </Alert>
                    )}
                    {detalleInscripcion.inscripcion_estado === "firmado_subido" && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">El alumno subió la carta firmada. Verifica el documento y confirma o rechaza.</p>
                        <div className="grid grid-cols-2 gap-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 w-full" onClick={() => { setOficioAccion("confirmada"); setOficioFechaInicio(""); setOficioFechaFin(""); setOficioOpen(true) }}>
                            <CheckCircle2 className="mr-2 h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">Confirmar — aceptó</span>
                          </Button>
                          <Button size="sm" variant="destructive" className="w-full" onClick={() => { setOficioAccion("rechazada_programa"); setOficioOpen(true) }}>
                            <XCircle className="mr-2 h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">Rechazar — rechazó</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Oficio processing dialog */}
      <Dialog open={oficioOpen} onOpenChange={(open) => { if (!open && !procesandoOficio) setOficioOpen(false) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {oficioAccion === "oficio_enviado" && "Registrar número de oficio"}
              {oficioAccion === "confirmada" && "Confirmar — dependencia aceptó"}
              {oficioAccion === "rechazada_programa" && "Rechazar — dependencia rechazó"}
            </DialogTitle>
            <DialogDescription>
              {oficioAccion === "oficio_enviado" && "La carta de asignación se genera automáticamente con los datos del alumno. El alumno podrá imprimirla desde su panel."}
              {oficioAccion === "confirmada" && "El alumno obtendrá acceso como alumno activo de servicio social."}
              {oficioAccion === "rechazada_programa" && "La solicitud del alumno será eliminada por completo. Deberá reiniciar el proceso desde cero."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {oficioAccion === "oficio_enviado" && (
              <div className="space-y-2">
                <Label>Número de oficio *</Label>
                <Input
                  placeholder="Ej. GTV-2026-042"
                  value={oficioNumero}
                  onChange={(e) => setOficioNumero(e.target.value)}
                  disabled={procesandoOficio}
                />
              </div>
            )}
            {oficioAccion === "confirmada" && (
              <>
                <div className="space-y-2">
                  <Label>Fecha de inicio de actividades *</Label>
                  <Input type="date" value={oficioFechaInicio} onChange={(e) => setOficioFechaInicio(e.target.value)} disabled={procesandoOficio} />
                </div>
                <div className="space-y-2">
                  <Label>Fecha de fin de actividades (opcional)</Label>
                  <Input type="date" value={oficioFechaFin} onChange={(e) => setOficioFechaFin(e.target.value)} disabled={procesandoOficio} />
                </div>
              </>
            )}
            {oficioAccion === "rechazada_programa" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-sm">Esta acción es irreversible</AlertTitle>
                <AlertDescription className="text-sm">
                  La solicitud del alumno, sus documentos y su historial en esta convocatoria serán <strong>eliminados por completo</strong>. El alumno deberá iniciar el proceso desde el principio: llenar semestre, período y volver a subir documentos.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOficioOpen(false)} disabled={procesandoOficio}>Cancelar</Button>
            <Button
              variant={oficioAccion === "rechazada_programa" ? "destructive" : "default"}
              onClick={handleProcesarOficio}
              disabled={procesandoOficio}
            >
              {procesandoOficio ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review confirm dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {decision === "aprobada" ? "Aprobar solicitud" : "Rechazar solicitud"}
            </DialogTitle>
            <DialogDescription>
              {decision === "aprobada"
                ? "El alumno quedará en lista para la asignación de turno."
                : "El alumno podrá corregir su solicitud y volver a enviarla."}
            </DialogDescription>
          </DialogHeader>
          {decision === "rechazada" && (
            <div className="space-y-2">
              <Label>Motivo de rechazo *</Label>
              <Input
                placeholder="Ej. El kardex no cumple con el 75% mínimo..."
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOpen(false)} disabled={revisando}>
              Cancelar
            </Button>
            <Button
              variant={decision === "aprobada" ? "default" : "destructive"}
              onClick={handleRevisar}
              disabled={revisando}
            >
              {revisando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirmar {decision === "aprobada" ? "aprobación" : "rechazo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Main tab ────────────────────────────────────────────────────────────────

export function InscripcionTab() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            Módulo de Inscripción
          </CardTitle>
          <CardDescription>
            Gestiona convocatorias, programas y revisa las solicitudes de los pre-candidatos.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="convocatorias">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="convocatorias">
            <CalendarDays className="mr-2 h-4 w-4" />
            Convocatorias
          </TabsTrigger>
          <TabsTrigger value="solicitudes">
            <Users className="mr-2 h-4 w-4" />
            Solicitudes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="convocatorias" className="mt-4">
          <ConvocatoriasPanel />
        </TabsContent>

        <TabsContent value="solicitudes" className="mt-4">
          <SolicitudesPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
