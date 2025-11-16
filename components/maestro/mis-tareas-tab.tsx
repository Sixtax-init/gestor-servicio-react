"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { TareasList } from "./tareas-list"
import { CreateTareaDialog } from "./create-tarea-dialog"

export function MisTareasTab() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mis Tareas</CardTitle>
              <CardDescription>Tareas asignadas en tus cursos</CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Tarea
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <TareasList key={refreshKey} />
        </CardContent>
      </Card>

      <CreateTareaDialog
        cursoId={null}
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          setShowCreateDialog(false)
          setRefreshKey((prev) => prev + 1)
        }}
      />
    </>
  )
}