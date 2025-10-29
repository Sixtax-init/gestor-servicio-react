"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Clock } from "lucide-react"
import { VerTareasDialog } from "./ver-tareas-dialog"

interface MisCursosAlumnoTabProps {
  inscripciones: any[]
}

export function MisCursosAlumnoTab({ inscripciones }: MisCursosAlumnoTabProps) {
  const [selectedCurso, setSelectedCurso] = useState<{ id: number; nombre: string } | null>(null)

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Mis Cursos</CardTitle>
        <CardDescription>Cursos en los que estás inscrito</CardDescription>
      </CardHeader>
      <CardContent>
        {inscripciones.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No estás inscrito en ningún curso</h3>
            <p className="text-sm text-muted-foreground mb-4">Explora los cursos disponibles para inscribirte</p>
          </div>
        ) : (
          <div className="space-y-4">
            {inscripciones.map((inscripcion) => (
              <Card key={inscripcion.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{inscripcion.nombre_grupo}</CardTitle>
                      <CardDescription className="mt-1">
                        Maestro: {inscripcion.maestro_nombre} {inscripcion.maestro_apellidos}
                      </CardDescription>
                      <p className="text-sm text-muted-foreground mt-2">{inscripcion.descripcion}</p>
                    </div>
                    <Badge variant={inscripcion.tipo === "servicio_social" ? "default" : "secondary"}>
                      {inscripcion.tipo === "servicio_social" ? "Servicio Social" : "Taller/Curso"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {inscripcion.tipo === "servicio_social" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Horas completadas
                        </span>
                        <span className="font-semibold">{inscripcion.horas_completadas} hrs</span>
                      </div>
                      <Progress value={(inscripcion.horas_completadas / 100) * 100} className="h-2" />
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4 bg-transparent"
                    onClick={() => setSelectedCurso({ id: inscripcion.curso_id, nombre: inscripcion.nombre_grupo })}
                  >
                    Ver Tareas
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>

    <VerTareasDialog
      open={!!selectedCurso}
      onOpenChange={(open) => !open && setSelectedCurso(null)}
      cursoId={selectedCurso?.id ?? null}
      cursoNombre={selectedCurso?.nombre}
    />
    </>
  )
}
