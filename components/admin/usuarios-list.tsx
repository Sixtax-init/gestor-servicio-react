
import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2, Edit } from "lucide-react"
import { EditUsuarioDialog } from "./edit-usuario-dialog"
import { DeleteConfirmDialog } from "./delete-confirm-dialog"
import type { Usuario } from "@/lib/db"

export function UsuariosList() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null)
  const [deletingUsuario, setDeletingUsuario] = useState<Usuario | null>(null)

  useEffect(() => {
    fetchUsuarios()
  }, [])

  const fetchUsuarios = async () => {
    try {
      const response = await fetch("/api/admin/usuarios")
      const data = await response.json()
      setUsuarios(data.usuarios || [])
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

  if (loading) {
    return <div className="text-center py-8">Cargando usuarios...</div>
  }

  return (
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
                <TableCell colSpan={6} className="text-center">
                  No hay usuarios registrados
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
  )
}

