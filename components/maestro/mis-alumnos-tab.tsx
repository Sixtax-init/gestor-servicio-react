"use client"

import { useEffect, useState } from "react"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { ProgressBar } from "@/components/ui/progress-bar"
import { StudentProgressDialog } from "./student-progress-dialog"
import { BarChart3, UserPlus, Search, Loader2, UserMinus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"
import { useRouter } from "next/navigation"
import { DeleteConfirmDialog } from "../admin/delete-confirm-dialog"

interface Curso {
  id: number
  nombre_grupo: string
  tipo: string
}

interface Alumno {
  id: number
  nombre: string
  apellidos: string
  matricula: string
  email: string
  horas_acumuladas: number
  horas_requeridas: number
  progreso_porcentaje: number
  estado: string
}

interface AlumnoConCursos extends Alumno {
  cursoId: number
  nombre_curso: string
  cursos: { id: number; nombre: string }[]
}

interface AlumnoBusqueda {
  id: number
  nombre: string
  apellidos: string
  matricula: string
}

export function MisAlumnosTab() {
  const router = useRouter()
  const [cursos, setCursos] = useState<Curso[]>([])
  const [alumnosPorCurso, setAlumnosPorCurso] = useState<Record<string, Alumno[]>>({})
  const [alumnosGlobal, setAlumnosGlobal] = useState<(Alumno & { cursoId: number; nombre_curso: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<{ id: number; nombre: string } | null>(null)

  // Estado para agregar alumno
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false)
  const [selectedCursoId, setSelectedCursoId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<AlumnoBusqueda[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [deletingStudentId, setDeletingStudentId] = useState<number | null>(null)
  const [deletingCourseId, setDeletingCourseId] = useState<number | null>(null)

  // Función para buscar alumnos
  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.length < 3) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const res = await apiFetch(`/api/maestro/alumnos/buscar?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setSearchResults(data.alumnos || [])
    } catch (error) {
      console.error("Error buscando alumnos:", error)
    } finally {
      setIsSearching(false)
    }
  }

  // Función para agregar alumno al curso
  const handleAddStudent = async (alumnoId: number) => {
    if (!selectedCursoId) return

    setIsAdding(true)
    try {
      const res = await apiFetch(`/api/maestro/cursos/${selectedCursoId}/agregar-alumno`, {
        method: "POST",
        body: JSON.stringify({ alumnoId }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al agregar alumno")
      }

      toast.success("Alumno agregado correctamente")
      setIsAddStudentOpen(false)
      setSearchQuery("")
      setSearchResults([])

      // Recargar datos suavemente sin refrescar página completa
      loadData()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al agregar alumno")
    } finally {
      setIsAdding(false)
    }
  }

  // Función para eliminar alumno del curso
  const handleRemoveStudent = async (alumnoId: number, cursoIdParam?: number) => {
    const cursoId = cursoIdParam || selectedCursoId
    if (!cursoId) return

    setIsRemoving(true)
    try {
      const res = await apiFetch(`/api/maestro/cursos/${cursoId}/eliminar-alumno`, {
        method: "DELETE",
        body: JSON.stringify({ alumnoId }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al eliminar alumno")
      }

      toast.success("Alumno eliminado correctamente")
      // Actualizamos todo el estado para mantener consistencia global
      loadData()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar alumno")
    } finally {
      setIsRemoving(false)
      setDeletingStudentId(null)
      setDeletingCourseId(null)
    }
  }

  const openAddStudentModal = (cursoId: number) => {
    setSelectedCursoId(cursoId)
    setSearchQuery("")
    setSearchResults([])
    setIsAddStudentOpen(true)
  }

  // 🟦 1. Función para cargar cursos y alumnos (Reutilizable)
  const loadData = async () => {
    try {
      const resCursos = await apiFetch("/api/maestro/cursos")
      const dataCursos = await resCursos.json()

      setCursos(dataCursos.cursos || [])

      // ---- Cargar alumnos de todos los cursos ----
      const globalList: (Alumno & { cursoId: number; nombre_curso: string })[] = []
      const alumnosPorCursoTemp: Record<string, Alumno[]> = {}

      for (const curso of dataCursos.cursos || []) {
        const resA = await apiFetch(`/api/maestro/cursos/${curso.id}/alumnos`)
        const dataA = await resA.json()

        alumnosPorCursoTemp[curso.id] = dataA.alumnos || []

        dataA.alumnos?.forEach((al: Alumno) =>
          globalList.push({ ...al, cursoId: curso.id, nombre_curso: curso.nombre_grupo })
        )
      }

      setAlumnosPorCurso(alumnosPorCursoTemp)
      setAlumnosGlobal(globalList)
    } catch (e) {
      console.error("Error al cargar datos:", e)
      toast.error("Error al actualizar la lista de alumnos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // 🟦 2. Filtrado global de alumnos
  // Agrupar por alumno.id
  const alumnosUnicos = Object.values(
    alumnosGlobal.reduce<Record<number, AlumnoConCursos>>((acc, al) => {
      if (!acc[al.id]) {
        acc[al.id] = {
          id: al.id,
          nombre: al.nombre,
          apellidos: al.apellidos,
          email: al.email,
          matricula: al.matricula,
          horas_acumuladas: al.horas_acumuladas || 0,
          horas_requeridas: al.horas_requeridas || 500,
          progreso_porcentaje: al.progreso_porcentaje || 0,
          estado: al.estado || "on_track",
          cursoId: al.cursoId,
          nombre_curso: al.nombre_curso,
          cursos: []
        }
      }
      acc[al.id].cursos.push({ id: al.cursoId, nombre: al.nombre_curso })
      return acc
    }, {})
  )

  const alumnosFiltrados = alumnosUnicos.filter((al) =>
    `${al.nombre} ${al.apellidos}`.toLowerCase().includes(search.toLowerCase()) ||
    al.email.toLowerCase().includes(search.toLowerCase()) ||
    al.matricula.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "completed":
        return <Badge variant="default" className="bg-green-500">✅ Completado</Badge>
      case "on_track":
        return <Badge variant="secondary" className="bg-blue-500 text-white">🟢 Al día</Badge>
      case "at_risk":
        return <Badge variant="destructive">🟡 En riesgo</Badge>
      default:
        return <Badge variant="outline">Sin estado</Badge>
    }
  }


  return (
    <>
      <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Alumnos por Curso</CardTitle>
      </CardHeader>
      <CardContent>

        {/* 🔍 BÚSQUEDA GLOBAL */}
        <Input
          placeholder="Buscar alumno en todos los cursos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4" data-tour="search-input"
        />

        {/* MOSTRAR RESULTADOS GLOBALES */}
        {search.length > 0 && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-2">
              Resultados: {alumnosFiltrados.length} alumno(s)
            </p>

            {alumnosFiltrados.length === 0 && (
              <p className="text-muted-foreground text-sm">No se encontraron alumnos.</p>
            )}

            {alumnosFiltrados.map((al) => (
              <div
                key={al.id}
                className="p-4 border rounded-xl mb-3 bg-card shadow-sm"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <p className="font-semibold text-card-foreground">{al.nombre} {al.apellidos}</p>
                    <p className="text-sm text-muted-foreground">{al.email}</p>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    {getStatusBadge(al.estado)}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedStudent({ id: al.id, nombre: `${al.nombre} ${al.apellidos}` })}
                      className="gap-2"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Ver Progreso
                    </Button>
                  </div>
                </div>

                <div className="mb-3">
                  <ProgressBar
                    current={al.horas_acumuladas}
                    max={al.horas_requeridas}
                    size="sm"
                  />
                </div>

                <div className="mt-2">
                  <span className="text-xs font-bold bg-primary text-primary-foreground px-2 py-1 rounded">
                    {al.matricula}
                  </span>
                </div>

                <div className="mt-3 text-sm text-primary">
                  <p className="font-semibold">Cursos:</p>
                  <ul className="list-disc ml-5">
                    {al.cursos.map((curso) => (
                      <li key={curso.id}>{curso.nombre}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}


            <hr className="my-6 border-border" />
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        )}

        {/* LISTA DE CURSOS CON CONTADOR */}
        {!loading && cursos.length > 0 && (
          <Accordion type="single" collapsible className="space-y-4" data-tour="alumnos-content">
            {cursos.map(curso => {
              const total = alumnosPorCurso[curso.id]?.length || 0
              return (
                <AccordionItem key={curso.id} value={String(curso.id)} className="border rounded-lg px-2" data-tour="alumnos-data">
                  <div className="flex items-center w-full pr-2">
                    <AccordionTrigger className="text-left flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{curso.nombre_grupo}</span>
                        <Badge variant="secondary">{total} alumnos</Badge>
                      </div>
                    </AccordionTrigger>
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-2 gap-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        openAddStudentModal(curso.id)
                      }}
                    >
                      <UserPlus className="h-4 w-4" />
                      Agregar Alumno
                    </Button>
                  </div>

                  <AccordionContent data-tour="alumnos-data">
                    {total === 0 && (
                      <p className="text-sm text-gray-500 mt-2">No hay alumnos inscritos aún.</p>
                    )}

                    <div className="space-y-2 mt-2">
                      {alumnosPorCurso[curso.id]?.map((al) => (
                        <div
                          key={`${al.id}-${curso.id}`}
                          className="flex items-center gap-3 p-2 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          {/* Student Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm truncate">{al.nombre} {al.apellidos}</p>
                              <Badge variant="outline" className="text-xs">{al.matricula}</Badge>
                              {getStatusBadge(al.estado)}
                            </div>
                            <div className="flex items-center gap-2">
                              <ProgressBar
                                current={al.horas_acumuladas || 0}
                                max={al.horas_requeridas || 480}
                                size="sm"
                                className="flex-1"
                              />
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {al.horas_acumuladas || 0}/{al.horas_requeridas || 480} hrs
                              </span>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedStudent({ id: al.id, nombre: `${al.nombre} ${al.apellidos}` })}
                              className="flex-shrink-0"
                              title="Ver Progreso"
                            >
                              <BarChart3 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setDeletingStudentId(al.id)
                                setDeletingCourseId(curso.id)
                              }}
                              className="flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Eliminar del curso"
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        )}
      </CardContent>

      {/* Progress Dialog */}
      <StudentProgressDialog
        open={!!selectedStudent}
        onOpenChange={(open) => !open && setSelectedStudent(null)}
        studentId={selectedStudent?.id || null}
        studentName={selectedStudent?.nombre}
      />

      {/* Dialog para Agregar Alumno */}
      <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Alumno al Curso</DialogTitle>
            <DialogDescription>
              Busca un alumno por nombre o matrícula para agregarlo a este curso.
            </DialogDescription>
          </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o matrícula..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {isSearching ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((alumno) => {
                const isEnrolled = selectedCursoId && alumnosPorCurso[selectedCursoId]?.some((a) => a.id === alumno.id)

                return (
                  <div key={alumno.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{alumno.nombre} {alumno.apellidos}</p>
                      <p className="text-xs text-muted-foreground">{alumno.matricula}</p>
                      {isEnrolled && <Badge variant="secondary" className="mt-1 text-[10px]">Ya inscrito</Badge>}
                    </div>

                    {isEnrolled ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveStudent(alumno.id)}
                        disabled={isRemoving}
                      >
                        {isRemoving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleAddStudent(alumno.id)}
                        disabled={isAdding}
                      >
                        {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Agregar"}
                      </Button>
                    )}
                  </div>
                )
              })
            ) : searchQuery.length >= 3 ? (
              <p className="text-center text-sm text-muted-foreground py-4">
                No se encontraron alumnos.
              </p>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">
                Escribe al menos 3 caracteres para buscar.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
    
    <DeleteConfirmDialog
      open={!!deletingStudentId}
      onOpenChange={(open) => !open && setDeletingStudentId(null)}
      onConfirm={() => deletingStudentId && handleRemoveStudent(deletingStudentId, deletingCourseId || undefined)}
      title="Eliminar Alumno del Curso"
      description="¿Estás seguro de que deseas eliminar a este alumno del curso? Esta acción no se puede deshacer."
    />
  </Card>
</>
)
}
