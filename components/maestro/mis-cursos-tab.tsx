"use client"

import { useState } from "react"
import type { Curso } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, BookOpen } from "lucide-react"
import { CreateCursoDialog } from "./create-curso-dialog"
import { CreateTareaDialog } from "./create-tarea-dialog"

interface MisCursosTabProps {
  cursos: Curso[]
}

export function MisCursosTab({ cursos: initialCursos }: MisCursosTabProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [cursos, setCursos] = useState(initialCursos)
  const [showTareaDialog, setShowTareaDialog] = useState(false)
  const [selectedCursoId, setSelectedCursoId] = useState<number | null>(null)

  const handleCursoCreated = (newCurso: Curso) => {
    setCursos([newCurso, ...cursos])
    setShowCreateDialog(false)
  }

  const handleTareaCreated = () => {
    setShowTareaDialog(false)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mis Cursos</CardTitle>
              <CardDescription>Cursos y servicios sociales que impartes</CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Curso
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {cursos.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tienes cursos creados</h3>
              <p className="text-sm text-muted-foreground mb-4">Crea tu primer curso para comenzar</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Curso
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {cursos.map((curso) => (
                <Card key={curso.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{curso.nombre_grupo}</CardTitle>
                        <CardDescription className="mt-1">{curso.descripcion}</CardDescription>
                      </div>
                      <Badge variant={curso.tipo === "servicio_social" ? "default" : "secondary"}>
                        {curso.tipo === "servicio_social" ? "Servicio Social" : "Taller/Curso"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" className="w-full bg-transparent" onClick={() => {setSelectedCursoId(curso.id); setShowTareaDialog(true)}}>
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Tarea
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateCursoDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onSuccess={handleCursoCreated} />
      <CreateTareaDialog open={showTareaDialog} onOpenChange={setShowTareaDialog} onSuccess={handleTareaCreated} cursoId={selectedCursoId} />
    </>
  )
}
