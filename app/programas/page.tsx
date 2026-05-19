"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Loader2,
  Search,
  MapPin,
  Phone,
  Mail,
  Clock,
  Users,
  Building2,
  GraduationCap,
  RefreshCw,
  AlertCircle,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Programa {
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

interface Convocatoria {
  id: number
  nombre: string
  estado: string
  fecha_inicio_registro: string
  fecha_fin_registro: string
  fecha_platica: string | null
  fecha_inicio_seleccion: string | null
}

function formatDate(d: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })
}

function CupoBadge({ disponible, total }: { disponible: number; total: number }) {
  if (Number(total) === 0) return <Badge variant="outline">Sin cupo definido</Badge>
  if (Number(disponible) === 0) return <Badge variant="destructive">Cupo lleno</Badge>
  if (Number(disponible) <= 3) return (
    <Badge className="bg-amber-100 text-amber-700 border-amber-200 border">
      {disponible} lugar{Number(disponible) !== 1 ? "es" : ""} disponible{Number(disponible) !== 1 ? "s" : ""}
    </Badge>
  )
  return (
    <Badge className="bg-green-100 text-green-700 border-green-200 border">
      {disponible} de {total} disponibles
    </Badge>
  )
}

export default function ProgramasPage() {
  const [programas, setProgramas] = useState<Programa[]>([])
  const [convocatoria, setConvocatoria] = useState<Convocatoria | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [detalle, setDetalle] = useState<Programa | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/public/programas")
      const data = await res.json()
      setProgramas(data.programas ?? [])
      setConvocatoria(data.convocatoria ?? null)
    } catch {
      // silently fail — will show empty state
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtrados = programas.filter((p) =>
    !search ||
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (p.departamento_nombre ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (p.tipo_programa ?? "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">Service Tracker</h1>
              <p className="text-xs text-muted-foreground">Catálogo de Programas de Servicio Social</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">Iniciar sesión</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/registro">Registrarse</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
        {/* Convocatoria banner */}
        {convocatoria && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div>
                  <p className="font-semibold">{convocatoria.nombre}</p>
                  <p className="text-sm text-muted-foreground">
                    Registro abierto hasta {formatDate(convocatoria.fecha_fin_registro)}
                    {convocatoria.fecha_platica && ` · Plática: ${formatDate(convocatoria.fecha_platica)}`}
                  </p>
                </div>
                <Button size="sm" asChild>
                  <Link href="/registro">Inscribirme a esta convocatoria</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
            Este catálogo es informativo. El cupo se actualiza en tiempo real conforme los alumnos realizan su selección.
            Para inscribirte a un programa, debes <Link href="/registro" className="underline font-medium">registrarte en la plataforma</Link>.
          </AlertDescription>
        </Alert>

        {/* Search & refresh */}
        <div className="flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por programa, departamento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button variant="outline" size="icon" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <span className="text-sm text-muted-foreground self-center">
            {filtrados.length} programa{filtrados.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Programs */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !convocatoria ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No hay convocatoria activa en este momento</p>
              <p className="text-sm mt-1">Consulta las fechas de la próxima convocatoria con el departamento.</p>
            </CardContent>
          </Card>
        ) : filtrados.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No se encontraron programas con ese criterio de búsqueda.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtrados.map((p) => (
              <Card
                key={p.id}
                className="cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all"
                onClick={() => setDetalle(p)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-semibold leading-snug">{p.nombre}</CardTitle>
                    <CupoBadge disponible={Number(p.cupo_disponible)} total={Number(p.plazas_total)} />
                  </div>
                  {p.departamento_nombre && (
                    <CardDescription className="flex items-center gap-1 text-xs">
                      <Building2 className="h-3 w-3" />
                      {p.departamento_nombre}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  {p.descripcion && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{p.descripcion}</p>
                  )}
                  <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {p.tipo_ubicacion === "interno" ? "Interno" : "Externo"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {p.total_horarios} horario{Number(p.total_horarios) !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {p.plazas_total} plaza{Number(p.plazas_total) !== 1 ? "s" : ""}
                    </span>
                    {p.requiere_constancia_laboral && (
                      <Badge variant="outline" className="text-xs px-1 py-0">Req. constancia laboral</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Detail dialog */}
      <Dialog open={!!detalle} onOpenChange={(open) => !open && setDetalle(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detalle?.nombre}</DialogTitle>
            {detalle?.departamento_nombre && (
              <DialogDescription className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {detalle.departamento_nombre}
              </DialogDescription>
            )}
          </DialogHeader>

          {detalle && (
            <div className="space-y-4 text-sm">
              <div className="flex gap-3 flex-wrap">
                <CupoBadge disponible={Number(detalle.cupo_disponible)} total={Number(detalle.plazas_total)} />
                <Badge variant="outline">{detalle.tipo_ubicacion === "interno" ? "Interno" : "Externo"}</Badge>
                {detalle.tipo_programa && <Badge variant="outline">{detalle.tipo_programa}</Badge>}
                {detalle.requiere_constancia_laboral && <Badge variant="outline">Req. constancia laboral</Badge>}
              </div>

              {detalle.descripcion && (
                <div>
                  <p className="font-medium mb-1">Descripción</p>
                  <p className="text-muted-foreground">{detalle.descripcion}</p>
                </div>
              )}
              {detalle.objetivo && (
                <div>
                  <p className="font-medium mb-1">Objetivo</p>
                  <p className="text-muted-foreground">{detalle.objetivo}</p>
                </div>
              )}
              {detalle.actividades && (
                <div>
                  <p className="font-medium mb-1">Actividades</p>
                  <p className="text-muted-foreground">{detalle.actividades}</p>
                </div>
              )}
              {detalle.carreras_permitidas && detalle.carreras_permitidas.length > 0 && (
                <div>
                  <p className="font-medium mb-1">Carreras permitidas</p>
                  <div className="flex flex-wrap gap-1">
                    {detalle.carreras_permitidas.map((c) => (
                      <Badge key={c} variant="secondary">{c}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {detalle.requisitos_adicionales && (
                <div>
                  <p className="font-medium mb-1">Requisitos adicionales</p>
                  <p className="text-muted-foreground">{detalle.requisitos_adicionales}</p>
                </div>
              )}

              {/* Contacto */}
              {(detalle.domicilio || detalle.telefono || detalle.email_contacto || detalle.responsable_programa_nombre) && (
                <div className="border-t pt-3 space-y-1.5">
                  <p className="font-medium">Contacto</p>
                  {detalle.responsable_programa_nombre && (
                    <p className="text-muted-foreground">
                      {detalle.responsable_programa_nombre}
                      {detalle.responsable_programa_puesto && ` — ${detalle.responsable_programa_puesto}`}
                    </p>
                  )}
                  {detalle.domicilio && (
                    <p className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />{detalle.domicilio}
                    </p>
                  )}
                  {detalle.telefono && (
                    <p className="flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />{detalle.telefono}
                    </p>
                  )}
                  {detalle.email_contacto && (
                    <p className="flex items-center gap-1.5 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 shrink-0" />{detalle.email_contacto}
                    </p>
                  )}
                </div>
              )}

              <div className="border-t pt-3">
                <p className="text-xs text-muted-foreground">
                  Para seleccionar este programa debes{" "}
                  <Link href="/registro" className="text-primary hover:underline font-medium">
                    registrarte en la plataforma
                  </Link>{" "}
                  y esperar tu turno asignado.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
