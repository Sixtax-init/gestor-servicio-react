"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, User, FileText, Download, Loader2, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RevisarEntregaDialog } from "./RevisarEntregaDialog"
import { RevisarAvanceDialog } from "./RevisarAvanceDialog"
import { apiFetch } from "@/lib/api-client"

interface Tarea {
  id: number
  titulo: string
}

interface Entrega {
  id: number
  nombre: string
  apellidos: string
  matricula: string
  email: string
  fecha_entrega: string
  comentario: string
  estado: string
  calificacion: number | null
  archivo_ruta?: string | null
  archivo_nombre?: string | null
  tiene_avance_final: boolean
}

interface TareaEntregasViewProps {
  tarea: Tarea
  onBack: () => void
}

export function TareaEntregasView({ tarea, onBack }: TareaEntregasViewProps) {
  const [entregas, setEntregas] = useState<Entrega[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEntrega, setSelectedEntrega] = useState<number | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [avanceReviewOpen, setAvanceReviewOpen] = useState(false)
  const [selectedAvanceData, setSelectedAvanceData] = useState<{ id: number; nombre: string } | null>(null)
  const [avances, setAvances] = useState<any[]>([])
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState("pendiente")

  const fetchEntregas = async () => {
    try {
      const response = await apiFetch(`/api/maestro/tareas/${tarea.id}/entregas`)
      if (response.ok) {
        const data = await response.json()
        setEntregas(data)
      }
    } catch (error) {
      console.error("Error al cargar entregas:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvances = async () => {
    try {
      const response = await apiFetch(`/api/maestro/tareas/${tarea.id}/avances`)
      if (response.ok) {
        const data = await response.json()
        setAvances(data)
      }
    } catch (error) {
      console.error("Error al cargar avances:", error)
    }
  }

  useEffect(() => {
    fetchEntregas()
    fetchAvances()
  }, [tarea.id])

  const getEntregasPorEstado = (estado: string) => {
    if (estado === "todas") return entregas.filter(e => e.tiene_avance_final)
    return entregas.filter(e => e.estado === estado && e.tiene_avance_final)
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "aprobada": return "default"
      case "revisada": return "secondary"
      case "rechazada": return "destructive"
      default: return "outline"
    }
  }

  const avancesPendientes = avances.filter(a => a.estado === 'pendiente')
  const hayAvancesPendientesDeAtencion = avancesPendientes.length > 0

  const avancesPorAlumno = avances.reduce<Record<string, { alumno: any; avances: any[] }>>((acc, avance) => {
    const key = `${avance.nombre} ${avance.apellidos}`
    if (!acc[key]) {
      acc[key] = {
        alumno: { nombre: avance.nombre, apellidos: avance.apellidos, matricula: avance.matricula, email: avance.email },
        avances: []
      }
    }
    acc[key].avances.push(avance)
    return acc
  }, {})

  const tabsItems = [
    { id: "pendiente", label: "Pendientes", badge: getEntregasPorEstado("pendiente").length, variant: getEntregasPorEstado("pendiente").length > 0 ? "default" as const : "secondary" as const },
    { id: "revisada", label: "Revisadas", badge: getEntregasPorEstado("revisada").length, variant: "secondary" as const },
    { id: "aprobada", label: "Aprobadas", badge: getEntregasPorEstado("aprobada").length, variant: "secondary" as const },
    { id: "avances", label: "Avances", badge: avancesPendientes.length, variant: hayAvancesPendientesDeAtencion ? "destructive" as const : "secondary" as const },
    { id: "todas", label: "Entregas Finales", badge: entregas.filter(e => e.tiene_avance_final).length, variant: "secondary" as const },
  ]

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[600px] animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* Sidebar de Navegación (Desktop) */}
      <aside 
        className={`hidden lg:flex flex-col gap-4 transition-all duration-300 ease-in-out border-r pr-4 ${isSidebarCollapsed ? 'w-16' : 'w-64'}`}
      >
        <div className="flex items-center justify-between mb-2">
          {!isSidebarCollapsed && <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Categorías</h3>}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 ml-auto" 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          >
            <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        <nav className="space-y-1">
          {tabsItems.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                activeTab === tab.id 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="min-w-[20px] flex justify-center">
                {tab.id === "pendiente" && <Calendar className="h-4 w-4" />}
                {tab.id === "revisada" && <FileText className="h-4 w-4" />}
                {tab.id === "aprobada" && <Badge variant="outline" className="p-0 border-none h-4 w-4 bg-green-500 rounded-full" />}
                {tab.id === "avances" && <Download className="h-4 w-4" />}
                {tab.id === "todas" && <User className="h-4 w-4" />}
              </div>
              
              {!isSidebarCollapsed && (
                <>
                  <span className="flex-1 text-left truncate">{tab.label}</span>
                  <Badge 
                    variant={activeTab === tab.id ? "secondary" : tab.variant}
                    className={`ml-auto transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'bg-white text-primary' : ''}`}
                  >
                    {tab.badge}
                  </Badge>
                </>
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t">
          <Button variant="ghost" className={`w-full justify-start gap-3 px-3 h-10 ${isSidebarCollapsed ? 'px-0 justify-center' : ''}`} onClick={onBack}>
            <ChevronLeft className="h-4 w-4" />
            {!isSidebarCollapsed && <span>Atrás</span>}
          </Button>
        </div>
      </aside>

      {/* Tabs Mobile (Horizontal Scroll) */}
      <div className="lg:hidden w-full overflow-x-auto pb-2 scrollbar-hide border-b mb-2">
        <div className="flex gap-2 min-w-max p-1">
          {tabsItems.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className="rounded-full gap-2"
            >
              {tab.label}
              <Badge variant={activeTab === tab.id ? "secondary" : tab.variant} className="h-5 px-1.5 min-w-[20px]">
                {tab.badge}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Área de Contenido Principal */}
      <main className="flex-1 min-w-0">
        <div className="mb-6">
          <h2 className="text-2xl font-black tracking-tight">{tarea.titulo}</h2>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
             <span className="flex items-center gap-1"><User className="h-3 w-3" /> {entregas.length} alumnos</span>
             <span className="opacity-30">•</span>
             <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {avances.length} avances totales</span>
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 text-muted-foreground gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="animate-pulse">Cargando datos...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === "avances" ? (
              /* Sección de Avances */
              avances.length === 0 ? (
                <Card className="border-dashed flex flex-col items-center py-12 text-muted-foreground gap-2 bg-muted/20">
                  <Download className="h-10 w-10 opacity-20" />
                  <p>No hay avances registrados</p>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {Object.entries(avancesPorAlumno).map(([nombreCompleto, data]) => (
                    <Card key={nombreCompleto} className="shadow-none border-muted overflow-hidden">
                      <CardHeader className="bg-muted/30 py-3 px-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {nombreCompleto}
                          </CardTitle>
                          <Badge variant="outline" className="text-[10px]">{data.avances.length} envíos</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 space-y-4">
                        {data.avances.some(a => a.estado === 'pendiente') && (
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                              <span className="h-1 w-1 rounded-full bg-primary animate-ping" /> Pendiente de revisión
                            </h4>
                            {data.avances.filter(a => a.estado === 'pendiente').map((avance) => (
                              <div key={avance.id} className="p-4 border rounded-2xl bg-primary/5 hover:bg-primary/10 transition-colors shadow-sm">
                                <p className="text-sm mb-4 font-medium leading-relaxed">{avance.comentario || "(Sin comentario)"}</p>
                                <div className="flex items-center justify-between pt-3 border-t">
                                  <span className="text-[10px] text-muted-foreground">{new Date(avance.fecha_entrega).toLocaleString()}</span>
                                  <div className="flex gap-2">
                                    {avance.archivo_url && (
                                      <Button variant="ghost" size="sm" asChild className="h-8 text-xs font-bold text-primary hover:bg-primary/10">
                                        <a href={avance.archivo_url} target="_blank" rel="noopener noreferrer">Ver Archivo</a>
                                      </Button>
                                    )}
                                    <Button size="sm" className="h-8 text-xs font-bold" onClick={() => {
                                      setSelectedAvanceData({ id: avance.id, nombre: nombreCompleto });
                                      setAvanceReviewOpen(true);
                                    }}>
                                      Revisar Ahora
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Historial de avances revisados */}
                        {data.avances.some(a => a.estado !== 'pendiente') && (
                          <div className="space-y-3 pt-2">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
                              Historial de revisiones
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {data.avances.filter(a => a.estado !== 'pendiente').map((avance) => (
                                <div key={avance.id} className="p-3 border border-dashed rounded-xl bg-muted/20 opacity-80 group hover:opacity-100 transition-opacity">
                                  <div className="flex justify-between items-start mb-2">
                                    <Badge variant="outline" className="text-[9px]">#{data.avances.length - data.avances.indexOf(avance)}</Badge>
                                    <Badge variant={avance.estado === 'revisada' ? 'secondary' : 'outline'} className="text-[9px] capitalize px-1 py-0 h-4">
                                      {avance.estado}
                                    </Badge>
                                  </div>
                                  <p className="text-xs mb-2 italic line-clamp-2">&quot;{avance.comentario || "Sin comentario"}&quot;</p>
                                  <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-1 border-t border-muted">
                                    <span>{new Date(avance.fecha_entrega).toLocaleDateString()}</span>
                                    {avance.archivo_url && (
                                      <Button variant="link" size="sm" asChild className="h-4 p-0 text-[9px] font-bold">
                                        <a href={avance.archivo_url} target="_blank" rel="noopener noreferrer">Ver</a>
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )
            ) : (
              /* Sección de Entregas Finales por Estado */
              getEntregasPorEstado(activeTab).length === 0 ? (
                <Card className="border-dashed flex flex-col items-center py-12 text-muted-foreground gap-2 bg-muted/20">
                  <FileText className="h-10 w-10 opacity-20" />
                  <p className="text-sm">No hay entregas en esta sección</p>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {getEntregasPorEstado(activeTab).map((entrega) => (
                    <Card key={entrega.id} className="group hover:border-primary/30 transition-all duration-200 shadow-sm hover:shadow-md">
                      <CardContent className="p-0">
                        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex gap-3 items-center min-w-0">
                            <div className="bg-primary/10 p-2.5 rounded-full hidden sm:block group-hover:bg-primary/20 transition-colors">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <h3 className="font-bold text-sm truncate">{entrega.nombre} {entrega.apellidos}</h3>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                <span className="font-mono">{entrega.matricula}</span>
                                <span>•</span>
                                <Badge variant={getEstadoColor(entrega.estado)} className="h-4 px-1.5 text-[9px] uppercase tracking-tighter">{entrega.estado}</Badge>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {entrega.archivo_ruta && (
                              <Button variant="outline" size="sm" asChild className="h-8 text-xs hover:bg-muted font-medium">
                                <a href={entrega.archivo_ruta} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-3 w-3 mr-1.5" /> Archivo
                                </a>
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              className="h-8 text-xs font-bold shadow-sm"
                              onClick={() => {
                                setSelectedEntrega(entrega.id)
                                setReviewOpen(true)
                              }}
                              disabled={entrega.estado === 'aprobada'}
                            >
                              {entrega.estado === 'aprobada' ? 'Aprobada' : 'Calificar'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </main>

      {selectedEntrega && (
        <RevisarEntregaDialog
          open={reviewOpen}
          onOpenChange={(open) => {
            setReviewOpen(open)
            if (!open) setSelectedEntrega(null)
          }}
          tareaId={tarea.id}
          entregaId={selectedEntrega}
          onSuccess={fetchEntregas}
        />
      )}

      {selectedAvanceData && (
        <RevisarAvanceDialog
          open={avanceReviewOpen}
          onOpenChange={(open) => {
            setAvanceReviewOpen(open)
            if (!open) setSelectedAvanceData(null)
          }}
          avanceId={selectedAvanceData.id}
          alumnoNombre={selectedAvanceData.nombre}
          onSuccess={() => {
            fetchAvances();
            fetchEntregas();
          }}
        />
      )}
    </div>
  )
}
