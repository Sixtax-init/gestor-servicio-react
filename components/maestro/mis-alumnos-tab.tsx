"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function MisAlumnosTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mis Alumnos</CardTitle>
        <CardDescription>Alumnos inscritos en tus cursos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">Funcionalidad de alumnos en desarrollo</div>
      </CardContent>
    </Card>
  )
}
