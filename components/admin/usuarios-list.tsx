import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2, Edit, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { EditUsuarioDialog } from "./edit-usuario-dialog"
import { DeleteConfirmDialog } from "./delete-confirm-dialog"
import type { Usuario } from "@/lib/db"

export function UsuariosList() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null)
  const [deletingUsuario, setDeletingUsuario] = useState<Usuario | null>(null)
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive">("active")

  // Pagination & Search State
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // Reset to page 1 on new search
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    fetchUsuarios()
  }, [statusFilter, page, debouncedSearch])

  const fetchUsuarios = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        page: page.toString(),
        limit: "10",
        search: debouncedSearch
      })

      const response = await fetch(`/api/admin/usuarios?${params}`)
      const data = await response.json()

      setUsuarios(data.usuarios || [])
      setTotalPages(data.pages || 1)
    } catch (error) {
      console.error("[v0] Error fetching usuarios:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/usuarios/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchUsuarios()
        setDeletingUsuario(null)
      } else {
        const data = await response.json()
        alert(data.error || "Error al eliminar usuario")
      }
    } catch (error) {
      console.error("[v0] Error deleting usuario:", error)
      alert("Error al eliminar usuario")
    }
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "administrador":
        return "destructive"
      case "maestro":
        return "default"
      case "alumno":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Tabs value={statusFilter} onValueChange={(v) => {
          setStatusFilter(v as "active" | "inactive")
          setPage(1)
        }}>
          <TabsList>
            <TabsTrigger value="active">Usuarios Activos</TabsTrigger>
            <TabsTrigger value="inactive">Usuarios Inactivos</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por matrícula o nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Cargando usuarios...</div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                      No se encontraron usuarios
                    </TableCell>
                  </TableRow>
                ) : (
                  usuarios.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell className="font-mono">{usuario.matricula}</TableCell>
                      <TableCell>
                        {usuario.nombre} {usuario.apellidos}
                      </TableCell>
                      <TableCell>{usuario.email}</TableCell>
                      <TableCell>
                        <Badge variant={getTipoColor(usuario.tipo_usuario)}>{usuario.tipo_usuario}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={usuario.activo ? "default" : "outline"}>
                          {usuario.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => setEditingUsuario(usuario)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingUsuario(usuario)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-end space-x-2">
            <div className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <EditUsuarioDialog
            usuario={editingUsuario}
            open={!!editingUsuario}
            onOpenChange={(open) => !open && setEditingUsuario(null)}
            onSuccess={fetchUsuarios}
          />

          <DeleteConfirmDialog
            open={!!deletingUsuario}
            onOpenChange={(open) => !open && setDeletingUsuario(null)}
            onConfirm={() => deletingUsuario && handleDelete(deletingUsuario.id)}
            title="Eliminar Usuario"
            description={`¿Estás seguro de que deseas eliminar a ${deletingUsuario?.nombre} ${deletingUsuario?.apellidos}? Esta acción no se puede deshacer.`}
          />
        </>
      )}
    </div>
  )
}

