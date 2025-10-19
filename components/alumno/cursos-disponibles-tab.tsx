"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Users } from "lucide-react"
import { useRouter } from "next/navigation"

interface CursosDisponiblesTabProps {
  cursos: any[]
}

export function CursosDisponiblesTab({ cursos: initialCursos }: CursosDisponiblesTabProps) {
  const router = useRouter()
  const [cursos, setCursos] = useState(initialCursos)
  const [loading, setLoading] = useState<number | null>(null)

  const handleInscribirse = async (cursoId: number) => {
    setLoading(cursoId)

    try {
      const response = await fetch("/api/alumno/inscripciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ curso_id: cursoId }),
      })

      if (response.ok) {
        // Remover el curso de la lista de disponibles
        setCursos(cursos.filter((c) => c.id !== cursoId))
        router.refresh()
      }
    } catch (error) {
      console.error("[v0] Error inscribiéndose:", error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cursos Disponibles</CardTitle>
        <CardDescription>Explora y inscríbete en cursos y servicios sociales</CardDescription>
      </CardHeader>
      <CardContent>
        {cursos.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay cursos disponibles</h3>
            <p className="text-sm text-muted-foreground">Vuelve más tarde para ver nuevos cursos</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {cursos.map((curso) => (
              <Card key={curso.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{curso.nombre_grupo}</CardTitle>
                      <CardDescription className="mt-1">
                        Maestro: {curso.maestro_nombre} {curso.maestro_apellidos}
                      </CardDescription>
                      <p className="text-sm text-muted-foreground mt-2">{curso.descripcion}</p>
                    </div>
                    <Badge variant={curso.tipo === "servicio_social" ? "default" : "secondary"}>
                      {curso.tipo === "servicio_social" ? "Servicio Social" : "Taller/Curso"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {curso.alumnos_inscritos} alumnos inscritos
                    </span>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => handleInscribirse(curso.id)}
                    disabled={loading === curso.id}
                  >
                    {loading === curso.id ? "Inscribiendo..." : "Inscribirse"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
