"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { CreateCursoDialog } from "./create-curso-dialog"
import { CursosList } from "./cursos-list"

interface CursosTabProps {
  isAdminGlobal?: boolean
}

export function CursosTab({ isAdminGlobal = false }: CursosTabProps) {
  const [refreshKey, setRefreshKey] = useState(0)
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gestión de Cursos</CardTitle>
            <CardDescription>Administra cursos y servicios sociales</CardDescription>
          </div>
          <div>
            <CreateCursoDialog
              onSuccess={() => setRefreshKey((prev) => prev + 1)}
              isAdminGlobal={isAdminGlobal}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CursosList key={refreshKey} isAdminGlobal={isAdminGlobal} />
      </CardContent>
    </Card>
  )
}
