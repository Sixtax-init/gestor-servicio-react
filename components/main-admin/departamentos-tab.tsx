"use client"

import { useState, useEffect } from "react"
import {
    Building2,
    Plus,
    Search,
    MoreVertical,
    Edit2,
    Trash2,
    Users,
    BookOpen,
    CheckCircle2,
    XCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { CreateDepartamentoDialog } from "./create-departamento-dialog"
import { EditDepartamentoDialog } from "./edit-departamento-dialog"
import { DeleteConfirmDialog } from "@/components/admin/delete-confirm-dialog"
import { apiFetch } from "@/lib/api-client"

interface Departamento {
    id: number
    nombre: string
    codigo: string
    descripcion: string
    activo: boolean
    total_usuarios: number
    total_cursos: number
    created_at: string
}

export function DepartamentosTab() {
    const [departamentos, setDepartamentos] = useState<Departamento[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const { toast } = useToast()

    // Dialog states
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [selectedDept, setSelectedDept] = useState<Departamento | null>(null)

    const fetchDepartamentos = async () => {
        try {
            setLoading(true)
            const res = await apiFetch("/api/main-admin/departamentos")
            const data = await res.json()
            if (data.departamentos) {
                setDepartamentos(data.departamentos)
            }
        } catch (error) {
            console.error("Error fetching departamentos:", error)
            toast({
                title: "Error",
                description: "No se pudieron cargar los departamentos",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDepartamentos()
    }, [])

    const handleDelete = async () => {
        if (!selectedDept) return

        try {
            const res = await apiFetch(`/api/main-admin/departamentos/${selectedDept.id}`, {
                method: "DELETE",
            })

            const data = await res.json()

            if (!res.ok) {
                toast({
                    title: "Error",
                    description: data.error || "No se pudo eliminar el departamento",
                    variant: "destructive",
                })
                return
            }

            toast({
                title: "Éxito",
                description: "Departamento eliminado correctamente",
            })
            fetchDepartamentos()
        } catch (error) {
            console.error("Error deleting departamento:", error)
            toast({
                title: "Error",
                description: "Error de conexión",
                variant: "destructive",
            })
        }
    }

    const filteredDepartamentos = departamentos.filter(d =>
        d.nombre.toLowerCase().includes(search.toLowerCase()) ||
        d.codigo.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar departamento por nombre o código..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button className="w-full md:w-auto" onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Departamento
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Departamentos del Sistema</CardTitle>
                    <CardDescription>
                        Gestiona las diferentes áreas o grupos de la institución.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">Cargando departamentos...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Código</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-center">Usuarios</TableHead>
                                    <TableHead className="text-center">Cursos</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredDepartamentos.map((dept) => (
                                    <TableRow key={dept.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-blue-500" />
                                                {dept.nombre}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-mono">
                                                {dept.codigo}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {dept.activo ? (
                                                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200">
                                                    <CheckCircle2 className="mr-1 h-3 w-3" /> Activo
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200">
                                                    <XCircle className="mr-1 h-3 w-3" /> Inactivo
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Users className="h-3 w-3 text-muted-foreground" />
                                                {dept.total_usuarios}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <BookOpen className="h-3 w-3 text-muted-foreground" />
                                                {dept.total_cursos}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => {
                                                        setSelectedDept(dept)
                                                        setIsEditOpen(true)
                                                    }}>
                                                        <Edit2 className="mr-2 h-4 w-4" /> Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                        onClick={() => {
                                                            setSelectedDept(dept)
                                                            setIsDeleteOpen(true)
                                                        }}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredDepartamentos.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No se encontraron departamentos.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <CreateDepartamentoDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onSuccess={fetchDepartamentos}
            />

            <EditDepartamentoDialog
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                departamento={selectedDept}
                onSuccess={fetchDepartamentos}
            />

            <DeleteConfirmDialog
                open={isDeleteOpen}
                onOpenChange={setIsDeleteOpen}
                onConfirm={handleDelete}
                title="Eliminar Departamento"
                description={
                    selectedDept && (selectedDept.total_usuarios > 0 || selectedDept.total_cursos > 0)
                        ? `ATENCIÓN: El departamento "${selectedDept.nombre}" tiene ${selectedDept.total_usuarios} usuarios y ${selectedDept.total_cursos} cursos asociados. Por seguridad, no puedes eliminar un departamento con registros activos. Debes reasignar o eliminar a estos usuarios y cursos antes de proceder.`
                        : `¿Estás seguro de que deseas eliminar el departamento "${selectedDept?.nombre}"? Esta acción no se puede deshacer.`
                }
            />
        </div>
    )
}
