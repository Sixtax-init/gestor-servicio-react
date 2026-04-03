"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2, Edit, Download, Loader2, BookOpen, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { EditCursoDialog } from "../admin/edit-curso-dialog"
import { DeleteConfirmDialog } from "../admin/delete-confirm-dialog"
import { apiFetch } from "@/lib/api-client"
import { toast } from "sonner"

interface Curso {
  id: number
  nombre_grupo: string
  tipo: string
  maestro_nombre: string
  descripcion: string
  activo: boolean
  total_alumnos: number
  archivo_adjunto: string | null
  archivo_nombre: string | null
  maestro_id: number
  departamento_nombre?: string
}

interface CursosListProps {
  isAdminGlobal?: boolean
}

export function CursosList({ isAdminGlobal = false }: CursosListProps) {
  const [cursos, setCursos] = useState<Curso[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null)
  const [deletingCurso, setDeletingCurso] = useState<Curso | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 500)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    fetchCursos()
  }, [page, debouncedSearch])

  const fetchCursos = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "10", search: debouncedSearch })
      const response = await apiFetch(`/api/admin/cursos?${params}`)
      const data = await response.json()
      setCursos(data.cursos || [])
      setTotalPages(data.pages || 1)
    } catch (error) {
      console.error("[admin/cursos-list] Error fetching cursos:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await apiFetch(`/api/admin/cursos/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchCursos()
        setDeletingCurso(null)
      } else {
        const data = await response.json()
        toast.error(data.error || "Error al eliminar curso")
      }
    } catch (error) {
      console.error("[admin/cursos-list] Error deleting curso:", error)
      toast.error("Error al eliminar curso")
    }
  }

  const getTipoLabel = (tipo: string) => {
    return tipo === "servicio_social" ? "Servicio Social" : "Taller/Curso"
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Cargando cursos...</span>
      </div>
    )
  }

  return (
    <>
      <div className="relative w-full sm:w-72 mb-4">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o maestro..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre del Grupo</TableHead>
              <TableHead>Tipo</TableHead>
              {isAdminGlobal && <TableHead>Departamento</TableHead>}
              <TableHead>Maestro</TableHead>
              <TableHead>Alumnos</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Archivo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cursos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdminGlobal ? 8 : 7} className="text-center">
                  <div className="flex flex-col items-center py-6 text-muted-foreground gap-1">
                    <BookOpen className="h-8 w-8 opacity-40" />
                    <p className="font-medium">No hay cursos registrados</p>
                    <p className="text-xs">Crea el primer curso desde el botón de arriba</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              cursos.map((curso) => (
                <TableRow key={curso.id}>
                  <TableCell className="font-medium">{curso.nombre_grupo}</TableCell>
                  <TableCell>
                    <Badge variant={curso.tipo === "servicio_social" ? "default" : "secondary"}>
                      {getTipoLabel(curso.tipo)}
                    </Badge>
                  </TableCell>
                  {isAdminGlobal && (
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm font-medium">
                        {curso.departamento_nombre || "Sin asignar"}
                      </div>
                    </TableCell>
                  )}
                  <TableCell>{curso.maestro_nombre || "Sin asignar"}</TableCell>
                  <TableCell>{curso.total_alumnos}</TableCell>
                  <TableCell>
                    <Badge variant={curso.activo ? "default" : "outline"}>{curso.activo ? "Activo" : "Inactivo"}</Badge>
                  </TableCell>
                  <TableCell>
                    {curso.archivo_adjunto ? (
                      <Button variant="ghost" size="sm" asChild>
                        <a
                          href={curso.archivo_adjunto}
                          download={curso.archivo_nombre}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          {curso.archivo_nombre}
                        </a>
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-sm">Sin archivo</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setEditingCurso(curso)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeletingCurso(curso)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 mt-4">
        <div className="text-sm text-muted-foreground">Página {page} de {totalPages}</div>
        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
          <ChevronLeft className="h-4 w-4" />Anterior
        </Button>
        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
          Siguiente<ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <EditCursoDialog
        curso={editingCurso}
        open={!!editingCurso}
        onOpenChange={(open) => !open && setEditingCurso(null)}
        onSuccess={fetchCursos}
        isAdminGlobal={isAdminGlobal}
      />

      <DeleteConfirmDialog
        open={!!deletingCurso}
        onOpenChange={(open) => !open && setDeletingCurso(null)}
        onConfirm={() => deletingCurso && handleDelete(deletingCurso.id)}
        title="Eliminar Curso"
        description={`¿Estás seguro de que deseas eliminar el curso "${deletingCurso?.nombre_grupo}"? Esta acción eliminará también todas las tareas e inscripciones asociadas.`}
      />
    </>
  )
}