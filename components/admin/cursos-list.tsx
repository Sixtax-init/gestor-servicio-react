"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2, Edit, Download } from "lucide-react"
import { EditCursoDialog } from "../admin/edit-curso-dialog"
import { DeleteConfirmDialog } from "../admin/delete-confirm-dialog"

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
}

export function CursosList() {
  const [cursos, setCursos] = useState<Curso[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null)
  const [deletingCurso, setDeletingCurso] = useState<Curso | null>(null)

  useEffect(() => {
    fetchCursos()
  }, [])

  const fetchCursos = async () => {
    try {
      const response = await fetch("/api/admin/cursos")
      const data = await response.json()
      setCursos(data.cursos || [])
    } catch (error) {
      console.error("[v0] Error fetching cursos:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/cursos/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchCursos()
        setDeletingCurso(null)
      } else {
        const data = await response.json()
        alert(data.error || "Error al eliminar curso")
      }
    } catch (error) {
      console.error("[v0] Error deleting curso:", error)
      alert("Error al eliminar curso")
    }
  }

  const getTipoLabel = (tipo: string) => {
    return tipo === "servicio_social" ? "Servicio Social" : "Taller/Curso"
  }

  if (loading) {
    return <div className="text-center py-8">Cargando cursos...</div>
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre del Grupo</TableHead>
              <TableHead>Tipo</TableHead>
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
                <TableCell colSpan={7} className="text-center">
                  No hay cursos registrados
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

      <EditCursoDialog
        curso={editingCurso}
        open={!!editingCurso}
        onOpenChange={(open) => !open && setEditingCurso(null)}
        onSuccess={fetchCursos}
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