"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Clock } from "lucide-react"

interface MisHorasTabProps {
  inscripciones: any[]
}

export function MisHorasTab({ inscripciones }: MisHorasTabProps) {
  const serviciosSociales = inscripciones.filter((i) => i.tipo === "servicio_social")
  const horasTotales = serviciosSociales.reduce((sum, insc) => sum + (insc.horas_completadas || 0), 0)
  const metaHoras = 100 // Meta de horas de servicio social

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seguimiento de Horas</CardTitle>
        <CardDescription>Horas de servicio social completadas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Total de Horas</span>
                </div>
                <span className="text-3xl font-bold text-primary">
                  {horasTotales} / {metaHoras}
                </span>
              </div>
              <Progress value={(horasTotales / metaHoras) * 100} className="h-3" />
              <p className="text-sm text-muted-foreground mt-2">
                {metaHoras - horasTotales > 0
                  ? `Te faltan ${metaHoras - horasTotales} horas para completar tu servicio social`
                  : "Has completado tu servicio social"}
              </p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="font-semibold">Desglose por Curso</h3>
            {serviciosSociales.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No estás inscrito en ningún servicio social
              </p>
            ) : (
              serviciosSociales.map((inscripcion) => (
                <Card key={inscripcion.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{inscripcion.nombre_grupo}</span>
                      <span className="font-semibold">{inscripcion.horas_completadas} hrs</span>
                    </div>
                    <Progress value={(inscripcion.horas_completadas / metaHoras) * 100} className="h-2" />
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
