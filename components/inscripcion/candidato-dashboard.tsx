"use client"

import { useState, useEffect, useRef } from "react"
import type { SessionUser } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Upload,
  Trash2,
  LogOut,
  GraduationCap,
  FileText,
  CalendarDays,
  AlertCircle,
  Shuffle,
  MapPin,
  Phone,
  Mail,
  Building2,
  TriangleAlert,
  PartyPopper,
  Search,
  ExternalLink,
} from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import { toast } from "sonner"
import Link from "next/link"

// ─── Constants ───────────────────────────────────────────────────────────────

const DOCUMENT_LABELS: Record<string, string> = {
  kardex: "Kardex",
  horario: "Horario",
  solicitud_prestador: "Solicitud de Prestador",
  fotografia: "Fotografía",
  constancia_laboral: "Constancia Laboral",
}

const REQUIRED_DOCS = ["kardex", "horario", "solicitud_prestador", "fotografia"]

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Convocatoria {
  id: number
  nombre: string
  estado: string
  fecha_inicio_registro: string
  fecha_fin_registro: string
  fecha_platica: string | null
  fecha_inicio_seleccion: string | null
  fecha_fin_seleccion: string | null
}

interface Solicitud {
  id: number
  estado: string
  semestre: string | null
  periodo: string | null
  horas_previas_acreditadas: number
  motivo_rechazo: string | null
  convocatoria_nombre: string
  convocatoria_estado: string
  created_at: string
}

interface Turno {
  id: number
  numero_turno: number
  tipo: string
  fecha_inicio: string
  fecha_fin: string
  estado: string
}

interface Seleccion {
  inscripcion_id: number
  inscripcion_estado: string
  oficio_url: string | null
  oficio_firmado_url: string | null
  programa_nombre: string
  programa_descripcion: string | null
  programa_domicilio: string | null
  programa_telefono: string | null
  email_contacto: string | null
  tipo_ubicacion: string
  responsable_programa_nombre: string | null
  departamento_nombre: string | null
  dias: string
  hora_inicio: string
  hora_fin: string
}

interface Documento {
  id: number
  tipo_documento: string
  nombre_archivo: string
  tamano_bytes: number
  uploaded_at: string
}

interface ProgramaItem {
  id: number
  nombre: string
  descripcion: string | null
  objetivo: string | null
  tipo_ubicacion: string
  actividades: string | null
  carreras_permitidas: string[] | null
  requiere_constancia_laboral: boolean
  requisitos_adicionales: string | null
  responsable_programa_nombre: string | null
  responsable_programa_puesto: string | null
  domicilio: string | null
  telefono: string | null
  email_contacto: string | null
  tipo_programa: string | null
  departamento_nombre: string | null
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })
}

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleString("es-MX", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function estadoBadge(estado: string) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    borrador: { label: "Borrador", variant: "outline" },
    pendiente: { label: "En revisión", variant: "secondary" },
    aprobada: { label: "Aprobada", variant: "default" },
    rechazada: { label: "Rechazada", variant: "destructive" },
    en_seleccion: { label: "En selección", variant: "secondary" },
    programa_seleccionado: { label: "Programa seleccionado", variant: "default" },
  }
  const cfg = map[estado] ?? { label: estado, variant: "outline" }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}

function CupoBadge({ disponible, total }: { disponible: number; total: number }) {
  if (Number(total) === 0) return <Badge variant="outline">Sin cupo definido</Badge>
  if (Number(disponible) === 0) return <Badge variant="destructive">Cupo lleno</Badge>
  if (Number(disponible) <= 3) return (
    <Badge className="bg-amber-100 text-amber-700 border-amber-200 border">
      {disponible} lugar{Number(disponible) !== 1 ? "es" : ""}
    </Badge>
  )
  return (
    <Badge className="bg-green-100 text-green-700 border-green-200 border">
      {disponible} / {total}
    </Badge>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface CandidatoDashboardProps {
  user: SessionUser
}

export function CandidatoDashboard({ user }: CandidatoDashboardProps) {
  // Core data
  const [convocatoria, setConvocatoria] = useState<Convocatoria | null>(null)
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null)
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [turno, setTurno] = useState<Turno | null>(null)
  const [seleccion, setSeleccion] = useState<Seleccion | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  // Solicitud form
  const [semestre, setSemestre] = useState("")
  const [periodo, setPeriodo] = useState("")
  const [horasPrevias, setHorasPrevias] = useState("0")
  const [creandoSolicitud, setCreandoSolicitud] = useState(false)

  // Documents
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null)
  const [deletingDoc, setDeletingDoc] = useState<string | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Program catalog
  const [programas, setProgramas] = useState<ProgramaItem[]>([])
  const [loadingProgramas, setLoadingProgramas] = useState(false)
  const [searchPrograma, setSearchPrograma] = useState("")
  const [programaDetalle, setProgramaDetalle] = useState<ProgramaItem | null>(null)
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [loadingHorarios, setLoadingHorarios] = useState(false)
  const [horarioElegido, setHorarioElegido] = useState<number | null>(null)

  // Confirmation dialog
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [seleccionando, setSeleccionando] = useState(false)

  // Send solicitud
  const [enviando, setEnviando] = useState(false)

  // Signed carta upload
  const [subiendoFirmado, setSubiendoFirmado] = useState(false)
  const oficioFirmadoRef = useRef<HTMLInputElement | null>(null)

  // Logout
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoadingData(true)
    try {
      const [convRes, solRes] = await Promise.all([
        apiFetch("/api/inscripcion/convocatoria-activa"),
        apiFetch("/api/inscripcion/solicitud"),
      ])
      const convData = await convRes.json()
      const solData  = await solRes.json()
      setConvocatoria(convData.convocatoria ?? null)
      setSolicitud(solData.solicitud ?? null)
      setDocumentos(solData.documentos ?? [])
      setTurno(solData.turno ?? null)
      setSeleccion(solData.seleccion ?? null)
    } catch {
      toast.error("Error al cargar los datos")
    } finally {
      setLoadingData(false)
    }
  }

  async function loadProgramas() {
    setLoadingProgramas(true)
    try {
      const res = await apiFetch("/api/inscripcion/programas")
      const data = await res.json()
      setProgramas(data.programas ?? [])
    } catch {
      toast.error("Error al cargar los programas")
    } finally {
      setLoadingProgramas(false)
    }
  }

  async function openProgramaDetalle(programa: ProgramaItem) {
    setProgramaDetalle(programa)
    setHorarioElegido(null)
    setHorarios([])
    setLoadingHorarios(true)
    try {
      const res = await apiFetch(`/api/inscripcion/programas/${programa.id}`)
      const data = await res.json()
      setHorarios(data.horarios ?? [])
    } catch {
      toast.error("Error al cargar horarios")
    } finally {
      setLoadingHorarios(false)
    }
  }

  async function handleSeleccionar() {
    if (!horarioElegido) return
    setSeleccionando(true)
    try {
      const res = await apiFetch("/api/inscripcion/seleccionar", {
        method: "POST",
        body: JSON.stringify({ horario_id: horarioElegido }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Error al registrar la selección")
        return
      }
      toast.success("¡Programa seleccionado exitosamente!")
      setConfirmOpen(false)
      setProgramaDetalle(null)
      await loadData()
    } catch {
      toast.error("Error de conexión")
    } finally {
      setSeleccionando(false)
    }
  }

  async function handleCrearSolicitud(e: React.FormEvent) {
    e.preventDefault()
    if (!semestre.trim() || !periodo.trim()) {
      toast.error("Completa el semestre y período")
      return
    }
    setCreandoSolicitud(true)
    try {
      const res = await apiFetch("/api/inscripcion/solicitud", {
        method: "POST",
        body: JSON.stringify({
          semestre,
          periodo,
          horas_previas_acreditadas: Number(horasPrevias) || 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Error al crear la solicitud")
        return
      }
      toast.success("Solicitud creada. Ahora sube tus documentos.")
      await loadData()
    } catch {
      toast.error("Error de conexión")
    } finally {
      setCreandoSolicitud(false)
    }
  }

  async function handleUpload(tipoDocumento: string, file: File) {
    setUploadingDoc(tipoDocumento)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("tipo_documento", tipoDocumento)
      const res = await apiFetch("/api/inscripcion/solicitud/documentos", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Error al subir el documento"); return }
      toast.success(`${DOCUMENT_LABELS[tipoDocumento]} subido correctamente`)
      await loadData()
    } catch {
      toast.error("Error al subir el archivo")
    } finally {
      setUploadingDoc(null)
    }
  }

  async function handleDelete(tipoDocumento: string) {
    setDeletingDoc(tipoDocumento)
    try {
      const res = await apiFetch(`/api/inscripcion/solicitud/documentos/${tipoDocumento}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Error al eliminar")
        return
      }
      toast.success("Documento eliminado")
      setDocumentos((prev) => prev.filter((d) => d.tipo_documento !== tipoDocumento))
    } catch {
      toast.error("Error de conexión")
    } finally {
      setDeletingDoc(null)
    }
  }

  async function handleEnviar() {
    setEnviando(true)
    try {
      const res = await apiFetch("/api/inscripcion/solicitud/enviar", { method: "PATCH" })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Error al enviar"); return }
      toast.success("Solicitud enviada. El departamento la revisará pronto.")
      await loadData()
    } catch {
      toast.error("Error de conexión")
    } finally {
      setEnviando(false)
    }
  }

  async function handleSubirFirmado(file: File) {
    setSubiendoFirmado(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await apiFetch("/api/inscripcion/oficio-firmado", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Error al subir la carta"); return }
      toast.success("Carta firmada enviada al departamento.")
      await loadData()
    } catch {
      toast.error("Error al subir la carta")
    } finally {
      setSubiendoFirmado(false)
    }
  }

  async function handleGoToAlumno() {
    // Refresh the JWT so the middleware sees tipo_usuario = 'alumno'
    await apiFetch("/api/auth/refresh", { method: "POST" })
    window.location.href = "/alumno"
  }

  async function handleLogout() {
    setLoggingOut(true)
    await apiFetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/login"
  }

  // ─── Computed state ──────────────────────────────────────────────────────────

  const now = new Date()
  const turnoActivo = turno
    ? now >= new Date(turno.fecha_inicio) && now <= new Date(turno.fecha_fin) && turno.estado !== "usado"
    : false
  const turnoPendiente = turno ? now < new Date(turno.fecha_inicio) : false
  const turnoVencido   = turno ? (now > new Date(turno.fecha_fin) || turno.estado === "usado") && !seleccion : false

  const yaSelecciono = solicitud?.estado === "programa_seleccionado" || !!seleccion
  const convocatoriaAbierta = convocatoria?.estado === "activa"
  const canEdit      = !solicitud || ["borrador", "rechazada"].includes(solicitud.estado)
  const showDocs     = !!solicitud
  const solicitudEditable = !!(solicitud && ["borrador", "rechazada"].includes(solicitud.estado))
  const diasParaCierre = convocatoria?.fecha_fin_registro
    ? Math.ceil((new Date(convocatoria.fecha_fin_registro).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null
  const showDeadlineWarning = convocatoriaAbierta && solicitudEditable && diasParaCierre !== null && diasParaCierre <= 3
  const showEnviar   = solicitudEditable && convocatoriaAbierta
  const showConvocatoriaCerrada = solicitudEditable && !convocatoriaAbierta
  const docsCompletos = REQUIRED_DOCS.every((t) => documentos.some((d) => d.tipo_documento === t))
  const showTurno    = solicitud && ["aprobada", "en_seleccion", "programa_seleccionado"].includes(solicitud.estado)
  const showCatalog  = solicitud && ["aprobada", "en_seleccion"].includes(solicitud.estado) && turno && turnoActivo
  const showInfoCatalog = solicitud?.estado === "aprobada" && (!turno || turnoPendiente) && !yaSelecciono

  const programasFiltrados = programas.filter((p) =>
    !searchPrograma ||
    p.nombre.toLowerCase().includes(searchPrograma.toLowerCase()) ||
    (p.departamento_nombre ?? "").toLowerCase().includes(searchPrograma.toLowerCase())
  )

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Portal de Inscripción</h1>
                <p className="text-sm text-muted-foreground">
                  {user.nombre} {user.apellidos} · <span className="font-mono">{user.matricula}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/programas" target="_blank">
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  Catálogo público
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} disabled={loggingOut}>
                <LogOut className="mr-2 h-4 w-4" />
                {loggingOut ? "Saliendo..." : "Cerrar Sesión"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 space-y-6 max-w-3xl">

        {/* ── Convocatoria info ─────────────────────────────────────────── */}
        {convocatoria ? (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Convocatoria Activa
                </CardTitle>
                <Badge variant="secondary" className="capitalize">
                  {convocatoria.estado.replace("_", " ")}
                </Badge>
              </div>
              <CardDescription className="text-foreground font-medium">{convocatoria.nombre}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Inicio registro</p>
                <p className="font-medium">{formatDate(convocatoria.fecha_inicio_registro)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Cierre registro</p>
                <p className="font-medium">{formatDate(convocatoria.fecha_fin_registro)}</p>
              </div>
              {convocatoria.fecha_platica && (
                <div>
                  <p className="text-muted-foreground text-xs">Plática informativa</p>
                  <p className="font-medium">{formatDate(convocatoria.fecha_platica)}</p>
                </div>
              )}
              {convocatoria.fecha_inicio_seleccion && (
                <div>
                  <p className="text-muted-foreground text-xs">Selección de programa</p>
                  <p className="font-medium">{formatDate(convocatoria.fecha_inicio_seleccion)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No hay una convocatoria activa en este momento. Consulta más tarde o contacta al departamento.
            </AlertDescription>
          </Alert>
        )}

        {/* ── Solicitud ─────────────────────────────────────────────────── */}
        {!solicitud ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Crear Solicitud de Inscripción
              </CardTitle>
              <CardDescription>
                Completa los datos académicos para registrar tu solicitud. Después podrás subir los documentos requeridos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!convocatoria ? (
                <p className="text-sm text-muted-foreground">
                  No puedes crear una solicitud sin una convocatoria activa.
                </p>
              ) : (
                <form onSubmit={handleCrearSolicitud} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="semestre">Semestre actual *</Label>
                      <Input id="semestre" placeholder="Ej. 8vo" value={semestre}
                        onChange={(e) => setSemestre(e.target.value)} required disabled={creandoSolicitud} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="periodo">Período *</Label>
                      <Input id="periodo" placeholder="Ej. Enero-Junio 2026" value={periodo}
                        onChange={(e) => setPeriodo(e.target.value)} required disabled={creandoSolicitud} />
                    </div>
                  </div>
                  <div className="space-y-2 max-w-xs">
                    <Label htmlFor="horasPrevias">Horas previas acreditadas</Label>
                    <Input id="horasPrevias" type="number" min="0" placeholder="0" value={horasPrevias}
                      onChange={(e) => setHorasPrevias(e.target.value)} disabled={creandoSolicitud} />
                  </div>
                  <Button type="submit" disabled={creandoSolicitud}>
                    {creandoSolicitud ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creando...</> : "Crear solicitud"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Mi Solicitud
                </CardTitle>
                {estadoBadge(solicitud.estado)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {solicitud.estado === "borrador" && (
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    Sube los documentos requeridos y después haz clic en <strong>Enviar solicitud</strong> para que el departamento la revise.
                  </AlertDescription>
                </Alert>
              )}
              {solicitud.estado === "rechazada" && solicitud.motivo_rechazo && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Motivo de rechazo:</strong> {solicitud.motivo_rechazo}
                    <br />
                    <span className="text-sm">Corrige tus documentos y vuelve a enviar la solicitud.</span>
                  </AlertDescription>
                </Alert>
              )}
              {solicitud.estado === "aprobada" && (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    Tu solicitud fue aprobada. Se te asignará un turno para seleccionar tu programa. Puedes explorar el catálogo mientras esperas.
                  </AlertDescription>
                </Alert>
              )}
              {solicitud.estado === "pendiente" && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>Tu solicitud fue enviada y está siendo revisada por el departamento.</AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Semestre</p>
                  <p className="font-medium">{solicitud.semestre ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Período</p>
                  <p className="font-medium">{solicitud.periodo ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Horas previas</p>
                  <p className="font-medium">{solicitud.horas_previas_acreditadas}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Documentos ────────────────────────────────────────────────── */}
        {showDocs && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                Documentos Requeridos
              </CardTitle>
              <CardDescription>
                Sube los documentos en formato PDF, JPG o PNG (máx. 10 MB cada uno).
                {!canEdit && " No puedes modificar documentos en el estado actual de la solicitud."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {REQUIRED_DOCS.map((tipo) => {
                const doc = documentos.find((d) => d.tipo_documento === tipo)
                const isUploading = uploadingDoc === tipo
                const isDeleting  = deletingDoc  === tipo
                return (
                  <div key={tipo}>
                    <div className="flex items-center justify-between gap-3 py-2">
                      <div className="flex items-center gap-3 min-w-0">
                        {doc
                          ? <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                          : <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                        }
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{DOCUMENT_LABELS[tipo]}</p>
                          {doc && (
                            <p className="text-xs text-muted-foreground truncate">
                              {doc.nombre_archivo} · {formatBytes(doc.tamano_bytes)}
                            </p>
                          )}
                        </div>
                      </div>
                      {canEdit && (
                        <div className="flex gap-2 shrink-0">
                          <input
                            ref={(el) => { fileInputRefs.current[tipo] = el }}
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleUpload(tipo, file)
                              e.target.value = ""
                            }}
                          />
                          <Button variant={doc ? "outline" : "default"} size="sm"
                            disabled={isUploading || isDeleting}
                            onClick={() => fileInputRefs.current[tipo]?.click()}
                          >
                            {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                            <span className="ml-1.5">{doc ? "Reemplazar" : "Subir"}</span>
                          </Button>
                          {doc && (
                            <Button variant="ghost" size="sm" disabled={isUploading || isDeleting}
                              onClick={() => handleDelete(tipo)}
                              className="text-destructive hover:text-destructive"
                            >
                              {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                    <Separator className="last:hidden" />
                  </div>
                )
              })}
              <div className="pt-2 text-xs text-muted-foreground">
                {documentos.filter((d) => REQUIRED_DOCS.includes(d.tipo_documento)).length} de {REQUIRED_DOCS.length} documentos subidos
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Aviso de fecha límite próxima ─────────────────────────────── */}
        {showDeadlineWarning && (
          <Alert className={diasParaCierre === 0 ? "border-destructive/60 bg-destructive/10" : "border-amber-400/60 bg-amber-50 dark:bg-amber-950/20"}>
            <AlertCircle className={`h-4 w-4 ${diasParaCierre === 0 ? "text-destructive" : "text-amber-600"}`} />
            <AlertTitle className={`text-sm font-semibold ${diasParaCierre === 0 ? "text-destructive" : "text-amber-800 dark:text-amber-200"}`}>
              {diasParaCierre === 0
                ? "¡El registro cierra hoy!"
                : `El registro cierra en ${diasParaCierre} día${diasParaCierre !== 1 ? "s" : ""}`}
            </AlertTitle>
            <AlertDescription className={`text-sm ${diasParaCierre === 0 ? "text-destructive/90" : "text-amber-700 dark:text-amber-300"}`}>
              La fecha límite para enviar tu solicitud es el <strong>{formatDate(convocatoria!.fecha_fin_registro)}</strong>.
              Asegúrate de tener los 4 documentos requeridos y enviarla antes de que cierre el período de registro.
            </AlertDescription>
          </Alert>
        )}

        {/* ── Enviar / Reenviar solicitud ───────────────────────────────── */}
        {showEnviar && (
          <Card className={
            solicitud?.estado === "rechazada"
              ? "border-destructive/40"
              : docsCompletos
              ? "border-primary/40"
              : ""
          }>
            {solicitud?.estado === "rechazada" && (
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                  <XCircle className="h-4 w-4" />
                  Corrección de solicitud rechazada
                </CardTitle>
                <CardDescription>
                  Reemplaza o elimina los documentos incorrectos y vuelve a enviar tu solicitud para que el departamento la revise de nuevo.
                </CardDescription>
              </CardHeader>
            )}
            <CardContent className={`${solicitud?.estado === "rechazada" ? "pt-2" : "pt-5"} pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
              <div>
                <p className="font-medium text-sm">
                  {docsCompletos
                    ? solicitud?.estado === "rechazada" ? "Documentos actualizados" : "¡Documentos completos!"
                    : "Completa tus documentos para continuar"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {docsCompletos
                    ? solicitud?.estado === "rechazada"
                      ? "Revisa que hayas corregido lo indicado en el motivo de rechazo y reenvía."
                      : "Revisa que todo esté correcto y envía tu solicitud al departamento."
                    : `Faltan ${REQUIRED_DOCS.length - documentos.filter((d) => REQUIRED_DOCS.includes(d.tipo_documento)).length} documento(s) requerido(s).`
                  }
                </p>
              </div>
              <Button
                onClick={handleEnviar}
                disabled={!docsCompletos || enviando}
                className="shrink-0"
                variant={solicitud?.estado === "rechazada" ? "destructive" : "default"}
              >
                {enviando
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</>
                  : solicitud?.estado === "rechazada"
                  ? <><CheckCircle2 className="mr-2 h-4 w-4" />Corregir y reenviar</>
                  : <><CheckCircle2 className="mr-2 h-4 w-4" />Enviar solicitud</>
                }
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── Convocatoria cerrada con solicitud editable ───────────────── */}
        {showConvocatoriaCerrada && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Período de registro cerrado</AlertTitle>
            <AlertDescription>
              {solicitud?.estado === "rechazada"
                ? "Tu solicitud fue rechazada pero el período de registro de la convocatoria ya ha cerrado. No es posible reenviarla. Contacta al departamento en el Edificio 20 si tienes dudas."
                : "El período de registro de la convocatoria ya ha cerrado. No es posible enviar tu solicitud. Contacta al departamento en el Edificio 20 si tienes dudas."}
            </AlertDescription>
          </Alert>
        )}

        {/* ── Turno ─────────────────────────────────────────────────────── */}
        {showTurno && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shuffle className="h-4 w-4 text-primary" />
                Tu Turno de Selección
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!turno ? (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Tu solicitud fue aprobada. El departamento realizará el sorteo de turnos próximamente.
                    Recibirás tu número de turno aquí cuando esté disponible.
                  </AlertDescription>
                </Alert>
              ) : yaSelecciono ? (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    Turno #{turno.numero_turno} utilizado exitosamente.
                  </AlertDescription>
                </Alert>
              ) : turnoVencido ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Tu ventana de selección (Turno #{turno.numero_turno}) venció sin que realizaras una selección.
                    Contacta al departamento en el Edificio 20 para asistencia.
                  </AlertDescription>
                </Alert>
              ) : turnoActivo ? (
                <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    <strong>¡Tu turno está activo ahora!</strong> Turno #{turno.numero_turno} — disponible hasta {formatDateTime(turno.fecha_fin)}.
                    Desplázate hacia abajo para seleccionar tu programa.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Número de turno</p>
                      <p className="font-bold text-2xl text-primary">#{turno.numero_turno}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Tipo</p>
                      <p className="font-medium capitalize">{turno.tipo}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Fecha y hora</p>
                      <p className="font-medium">{formatDateTime(turno.fecha_inicio)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Fin de ventana</p>
                      <p className="font-medium">{formatDateTime(turno.fecha_fin)}</p>
                    </div>
                  </div>
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Tu ventana de selección comenzará el <strong>{formatDateTime(turno.fecha_inicio)}</strong>.
                      Regresa en esa fecha para elegir tu programa.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Programa seleccionado ──────────────────────────────────────── */}
        {yaSelecciono && seleccion && (
          <Card className="border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <PartyPopper className="h-4 w-4 text-green-600" />
                Programa Seleccionado
              </CardTitle>
              <CardDescription>Tu selección es definitiva y ha sido registrada.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold text-base">{seleccion.programa_nombre}</p>
                {seleccion.departamento_nombre && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Building2 className="h-3.5 w-3.5" />{seleccion.departamento_nombre}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Horario</p>
                  <p className="font-medium">{seleccion.dias}</p>
                  <p className="text-muted-foreground">{seleccion.hora_inicio} — {seleccion.hora_fin}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Ubicación</p>
                  <p className="font-medium capitalize">{seleccion.tipo_ubicacion}</p>
                </div>
                {seleccion.responsable_programa_nombre && (
                  <div>
                    <p className="text-muted-foreground text-xs">Responsable</p>
                    <p className="font-medium">{seleccion.responsable_programa_nombre}</p>
                  </div>
                )}
                {seleccion.programa_domicilio && (
                  <div>
                    <p className="text-muted-foreground text-xs">Domicilio</p>
                    <p className="font-medium">{seleccion.programa_domicilio}</p>
                  </div>
                )}
              </div>
              {seleccion.inscripcion_estado === "pendiente_oficio" && (
                <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800 dark:text-amber-200 text-sm font-semibold">Esperando carta de asignación</AlertTitle>
                  <AlertDescription className="text-amber-700 dark:text-amber-300 text-sm">
                    Tu selección fue registrada. El departamento está preparando tu Carta de Asignación. Te avisarán cuando esté lista para descargar.
                  </AlertDescription>
                </Alert>
              )}
              {seleccion.inscripcion_estado === "oficio_enviado" && (
                <div className="space-y-3">
                  <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800 dark:text-blue-200 text-sm font-semibold">Carta lista — llévala a la dependencia</AlertTitle>
                    <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm space-y-2">
                      <p>Descarga tu Carta de Asignación, llévala a la dependencia para que la firmen y regresa a subir el documento firmado escaneado.</p>
                      {seleccion.oficio_url && (
                        <a href={seleccion.oficio_url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="border-blue-400 text-blue-700 hover:bg-blue-100">
                            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                            Descargar carta de asignación
                          </Button>
                        </a>
                      )}
                    </AlertDescription>
                  </Alert>
                  <div className="rounded-lg border border-dashed p-4 space-y-3">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Upload className="h-4 w-4 text-muted-foreground" />
                      Subir carta firmada por la dependencia
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Una vez que la dependencia firme la carta, escanéala y súbela aquí para que el departamento la verifique.
                    </p>
                    <input
                      ref={oficioFirmadoRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleSubirFirmado(file)
                        e.target.value = ""
                      }}
                    />
                    <Button
                      size="sm"
                      disabled={subiendoFirmado}
                      onClick={() => oficioFirmadoRef.current?.click()}
                    >
                      {subiendoFirmado
                        ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Subiendo...</>
                        : <><Upload className="mr-2 h-3.5 w-3.5" />Subir carta firmada</>
                      }
                    </Button>
                  </div>
                </div>
              )}
              {seleccion.inscripcion_estado === "firmado_subido" && (
                <Alert className="border-purple-200 bg-purple-50 dark:bg-purple-950/20">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <AlertTitle className="text-purple-800 dark:text-purple-200 text-sm font-semibold">Carta firmada en revisión</AlertTitle>
                  <AlertDescription className="text-purple-700 dark:text-purple-300 text-sm">
                    Tu carta firmada fue recibida. El departamento la está verificando. Te notificarán cuando se confirme tu inscripción.
                    <br /><span className="text-xs opacity-80">¿Dudas? Visítanos en el Edificio 20.</span>
                  </AlertDescription>
                </Alert>
              )}
              {seleccion.inscripcion_estado === "confirmada" && (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800 dark:text-green-200 text-sm font-semibold">¡Inscripción confirmada!</AlertTitle>
                  <AlertDescription className="text-green-800 dark:text-green-200 text-sm space-y-2">
                    <p>La dependencia aceptó tu carta. Ya puedes acceder al portal de alumno para registrar tus avances.</p>
                    <Button size="sm" className="mt-1 bg-green-600 hover:bg-green-700" onClick={handleGoToAlumno}>
                      Ir al portal de alumno →
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Catálogo informativo (aprobada, esperando turno) ─────────── */}
        {showInfoCatalog && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                Explorar Programas Disponibles
              </CardTitle>
              <CardDescription>
                Tu solicitud fue aprobada. Mientras esperas tu turno de selección, puedes consultar los programas disponibles para preparar tu decisión.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {programas.length === 0 && !loadingProgramas && (
                <Button variant="outline" onClick={loadProgramas}>
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Ver programas disponibles
                </Button>
              )}
              {loadingProgramas && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" /> Cargando programas...
                </div>
              )}
              {programas.length > 0 && (
                <>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre o departamento..."
                      value={searchPrograma}
                      onChange={(e) => setSearchPrograma(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {programasFiltrados.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">Sin resultados.</p>
                    ) : programasFiltrados.map((p) => (
                      <div
                        key={p.id}
                        className="border rounded-lg p-3 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
                        onClick={() => openProgramaDetalle(p)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm">{p.nombre}</p>
                            {p.departamento_nombre && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Building2 className="h-3 w-3" />{p.departamento_nombre}
                              </p>
                            )}
                            {p.descripcion && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{p.descripcion}</p>
                            )}
                          </div>
                          <CupoBadge disponible={Number(p.cupo_disponible)} total={Number(p.plazas_total)} />
                        </div>
                        <div className="flex gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
                          <span>{p.tipo_ubicacion === "interno" ? "Interno" : "Externo"}</span>
                          <span>·</span>
                          <span>{p.total_horarios} horario{Number(p.total_horarios) !== 1 ? "s" : ""}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Solo podrás seleccionar cuando tu turno esté activo.</p>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Catálogo de programas (cuando turno está activo) ──────────── */}
        {showCatalog && !yaSelecciono && (
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                Selecciona tu Programa
              </CardTitle>
              <CardDescription>
                Tu turno está activo. Tienes hasta el <strong>{formatDateTime(turno!.fecha_fin)}</strong> para elegir.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                <TriangleAlert className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800 dark:text-amber-200 text-sm font-semibold">
                  La selección es definitiva
                </AlertTitle>
                <AlertDescription className="text-amber-700 dark:text-amber-300 text-sm">
                  Una vez que confirmes tu programa <strong>no podrás cambiarlo</strong>. Revisa bien los horarios y detalles antes de confirmar.
                </AlertDescription>
              </Alert>

              {programas.length === 0 && !loadingProgramas && (
                <Button variant="outline" onClick={loadProgramas}>
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Ver programas disponibles
                </Button>
              )}

              {loadingProgramas && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando programas...
                </div>
              )}

              {programas.length > 0 && (
                <>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre o departamento..."
                      value={searchPrograma}
                      onChange={(e) => setSearchPrograma(e.target.value)}
                      className="pl-8"
                    />
                  </div>

                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {programasFiltrados.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">Sin resultados para esa búsqueda.</p>
                    ) : programasFiltrados.map((p) => (
                      <div
                        key={p.id}
                        className="border rounded-lg p-3 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
                        onClick={() => openProgramaDetalle(p)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm">{p.nombre}</p>
                            {p.departamento_nombre && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Building2 className="h-3 w-3" />{p.departamento_nombre}
                              </p>
                            )}
                            {p.descripcion && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{p.descripcion}</p>
                            )}
                          </div>
                          <div className="shrink-0">
                            <CupoBadge disponible={Number(p.cupo_disponible)} total={Number(p.plazas_total)} />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
                          <span>{p.tipo_ubicacion === "interno" ? "Interno" : "Externo"}</span>
                          <span>·</span>
                          <span>{p.total_horarios} horario{Number(p.total_horarios) !== 1 ? "s" : ""}</span>
                          {p.requiere_constancia_laboral && <><span>·</span><span className="text-amber-600">Req. constancia laboral</span></>}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

      </main>

      {/* ── Program detail + horario selection dialog ─────────────────────── */}
      <Dialog open={!!programaDetalle} onOpenChange={(open) => { if (!open) { setProgramaDetalle(null); setHorarioElegido(null) } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{programaDetalle?.nombre}</DialogTitle>
            {programaDetalle?.departamento_nombre && (
              <DialogDescription className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />{programaDetalle.departamento_nombre}
              </DialogDescription>
            )}
          </DialogHeader>

          {programaDetalle && (
            <div className="space-y-4 text-sm">
              <div className="flex flex-wrap gap-2">
                <CupoBadge disponible={Number(programaDetalle.cupo_disponible)} total={Number(programaDetalle.plazas_total)} />
                <Badge variant="outline">{programaDetalle.tipo_ubicacion === "interno" ? "Interno" : "Externo"}</Badge>
                {programaDetalle.requiere_constancia_laboral && <Badge variant="outline" className="text-amber-600 border-amber-300">Req. constancia laboral</Badge>}
              </div>

              {programaDetalle.descripcion && (
                <div>
                  <p className="font-medium mb-1">Descripción</p>
                  <p className="text-muted-foreground">{programaDetalle.descripcion}</p>
                </div>
              )}
              {programaDetalle.objetivo && (
                <div>
                  <p className="font-medium mb-1">Objetivo</p>
                  <p className="text-muted-foreground">{programaDetalle.objetivo}</p>
                </div>
              )}
              {programaDetalle.actividades && (
                <div>
                  <p className="font-medium mb-1">Actividades</p>
                  <p className="text-muted-foreground">{programaDetalle.actividades}</p>
                </div>
              )}
              {programaDetalle.requisitos_adicionales && (
                <div>
                  <p className="font-medium mb-1">Requisitos adicionales</p>
                  <p className="text-muted-foreground">{programaDetalle.requisitos_adicionales}</p>
                </div>
              )}

              {/* Horarios */}
              <div>
                <p className="font-medium mb-2">{turnoActivo ? "Selecciona un horario" : "Horarios disponibles"}</p>
                {loadingHorarios ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />Cargando horarios...
                  </div>
                ) : horarios.length === 0 ? (
                  <p className="text-muted-foreground">No hay horarios disponibles para este programa.</p>
                ) : (
                  <div className="space-y-2">
                    {horarios.map((h) => {
                      const sinCupo = Number(h.cupo_disponible) <= 0
                      const selected = horarioElegido === h.id
                      const selectable = turnoActivo && !sinCupo
                      return (
                        <button
                          key={h.id}
                          type="button"
                          disabled={!selectable}
                          onClick={() => selectable && setHorarioElegido(h.id)}
                          className={`w-full text-left border rounded-lg p-3 transition-all ${
                            !selectable
                              ? "opacity-50 cursor-not-allowed bg-muted/50 text-muted-foreground"
                              : selected
                              ? "border-primary bg-primary/10 ring-2 ring-primary/20 text-foreground"
                              : "bg-muted/40 hover:bg-muted/60 hover:border-primary/40 text-foreground"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="font-medium">{h.dias}</p>
                              <p className="text-xs text-muted-foreground">{h.hora_inicio} — {h.hora_fin}</p>
                            </div>
                            <CupoBadge disponible={Number(h.cupo_disponible)} total={h.plazas} />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
                {!turnoActivo && horarios.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    Podrás seleccionar un horario cuando tu turno esté activo.
                  </p>
                )}
              </div>

              {/* Contacto */}
              {(programaDetalle.domicilio || programaDetalle.telefono || programaDetalle.email_contacto) && (
                <div className="border-t pt-3 space-y-1.5">
                  <p className="font-medium">Contacto</p>
                  {programaDetalle.responsable_programa_nombre && (
                    <p className="text-muted-foreground">
                      {programaDetalle.responsable_programa_nombre}
                      {programaDetalle.responsable_programa_puesto && ` — ${programaDetalle.responsable_programa_puesto}`}
                    </p>
                  )}
                  {programaDetalle.domicilio && (
                    <p className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />{programaDetalle.domicilio}
                    </p>
                  )}
                  {programaDetalle.telefono && (
                    <p className="flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />{programaDetalle.telefono}
                    </p>
                  )}
                  {programaDetalle.email_contacto && (
                    <p className="flex items-center gap-1.5 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 shrink-0" />{programaDetalle.email_contacto}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setProgramaDetalle(null); setHorarioElegido(null) }}>Cerrar</Button>
            {turnoActivo && (
              <Button
                disabled={!horarioElegido}
                onClick={() => { if (horarioElegido) setConfirmOpen(true) }}
              >
                Seleccionar este horario
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Final confirmation dialog ─────────────────────────────────────── */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <TriangleAlert className="h-5 w-5" />
              Confirmar selección definitiva
            </DialogTitle>
            <DialogDescription>
              Esta acción <strong>no puede deshacerse</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
              <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm space-y-1">
                <p>Estás a punto de seleccionar:</p>
                <p className="font-semibold">{programaDetalle?.nombre}</p>
                {horarioElegido && horarios.length > 0 && (() => {
                  const h = horarios.find((x) => x.id === horarioElegido)
                  return h ? <p className="text-xs">{h.dias} · {h.hora_inicio} — {h.hora_fin}</p> : null
                })()}
                <p className="mt-2 text-xs">
                  Una vez confirmado, esta selección es <strong>definitiva e irrevocable</strong>.
                  El cupo de este programa disminuirá de forma inmediata.
                </p>
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={seleccionando}>
              Cancelar — seguir revisando
            </Button>
            <Button
              variant="default"
              onClick={handleSeleccionar}
              disabled={seleccionando}
            >
              {seleccionando
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Registrando...</>
                : "Sí, confirmar selección"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
