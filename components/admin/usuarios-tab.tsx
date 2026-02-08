"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { UsuariosList } from "./usuarios-list"
import { CreateUsuarioDialog } from "./create-usuario-dialog"

interface UsuariosTabProps {
  isAdminGlobal?: boolean
}

export function UsuariosTab({ isAdminGlobal = false }: UsuariosTabProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleUsuarioCreated = () => {
    setShowCreateDialog(false)
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gestión de Usuarios</CardTitle>
            <CardDescription>Administra usuarios, maestros y alumnos del sistema</CardDescription>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <UsuariosList key={refreshKey} isAdminGlobal={isAdminGlobal} />
      </CardContent>

      <CreateUsuarioDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleUsuarioCreated}
        isAdminGlobal={isAdminGlobal}
      />
    </Card>
  )
}
