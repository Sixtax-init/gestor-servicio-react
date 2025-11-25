"use client"

import { useEffect, useState } from "react"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"

export function MisAlumnosTab() {
  const [cursos, setCursos] = useState<any[]>([])
  const [alumnosPorCurso, setAlumnosPorCurso] = useState<Record<string, any[]>>({})
  const [alumnosGlobal, setAlumnosGlobal] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  // 🟦 1. Cargar cursos y alumnos una sola vez
  useEffect(() => {
    async function loadData() {
      try {
        const resCursos = await fetch("/api/maestro/cursos")
        const dataCursos = await resCursos.json()

        setCursos(dataCursos.cursos || [])

        // ---- Cargar alumnos de todos los cursos ----
        const globalList: any[] = []
        const alumnosPorCursoTemp: Record<string, any[]> = {}

        for (const curso of dataCursos.cursos || []) {
          const resA = await fetch(`/api/maestro/cursos/${curso.id}/alumnos`)
          const dataA = await resA.json()

          alumnosPorCursoTemp[curso.id] = dataA.alumnos || []

          dataA.alumnos?.forEach((al: any) =>
            globalList.push({ ...al, cursoId: curso.id, nombre_curso: curso.nombre_grupo })
          )
        }

        setAlumnosPorCurso(alumnosPorCursoTemp)
        setAlumnosGlobal(globalList)
      } catch (e) {
        console.error("Error al cargar datos:", e)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // 🟦 2. Filtrado global de alumnos
  // Agrupar por alumno.id
  const alumnosUnicos = Object.values(
    alumnosGlobal.reduce((acc, al) => {
      if (!acc[al.id]) {
        acc[al.id] = {
          id: al.id,
          nombre: al.nombre,
          apellidos: al.apellidos,
          email: al.email,
          matricula: al.matricula,
          cursos: []
        };
      }

      acc[al.id].cursos.push({
        id: al.cursoId,
        nombre: al.nombre_curso,   // ← Este sí existe
      });


      return acc;
    }, {})
  );

  // Filtrar por nombre, matrícula o email
  const alumnosFiltrados = alumnosUnicos.filter((al: any) =>
    `${al.nombre} ${al.apellidos}`.toLowerCase().includes(search.toLowerCase()) ||
    al.email.toLowerCase().includes(search.toLowerCase()) ||
    al.matricula.toLowerCase().includes(search.toLowerCase())
  );


  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Alumnos por Curso</CardTitle>
      </CardHeader>
      <CardContent>

        {/* 🔍 BÚSQUEDA GLOBAL */}
        <Input
          placeholder="Buscar alumno en todos los cursos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4"
        />

        {/* MOSTRAR RESULTADOS GLOBALES */}
        {search.length > 0 && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-2">
              Resultados: {alumnosFiltrados.length} alumno(s)
            </p>

            {alumnosFiltrados.length === 0 && (
              <p className="text-muted-foreground text-sm">No se encontraron alumnos.</p>
            )}

            {alumnosFiltrados.map((al: any) => (
              <div
                key={al.id}
                className="p-4 border rounded-xl mb-3 bg-card shadow-sm"
              >
                <p className="font-semibold text-card-foreground">{al.nombre} {al.apellidos}</p>
                <p className="text-sm text-muted-foreground">{al.email}</p>

                <div className="mt-2">
                  <span className="text-xs font-bold bg-primary text-primary-foreground px-2 py-1 rounded">
                    {al.matricula}
                  </span>
                </div>

                <div className="mt-3 text-sm text-primary">
                  <p className="font-semibold">Cursos:</p>
                  <ul className="list-disc ml-5">
                    {al.cursos.map((curso: any) => (
                      <li key={curso.id}>{curso.nombre}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}


            <hr className="my-6 border-border" />
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        )}

        {/* LISTA DE CURSOS CON CONTADOR */}
        {!loading && cursos.length > 0 && (
          <Accordion type="single" collapsible className="space-y-4">
            {cursos.map(curso => {
              const total = alumnosPorCurso[curso.id]?.length || 0
              return (
                <AccordionItem key={curso.id} value={String(curso.id)} className="border rounded-lg px-2">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{curso.nombre_grupo}</span>
                      <Badge variant="secondary">{total} alumnos</Badge>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent>
                    {total === 0 && (
                      <p className="text-sm text-gray-500 mt-2">No hay alumnos inscritos aún.</p>
                    )}

                    <div className="space-y-3 mt-2">
                      {alumnosPorCurso[curso.id]?.map((al: any) => (
                        <div key={`${al.id}-${curso.id}`} className="flex items-center justify-between p-3 border rounded-xl">

                          <div>
                            <p className="font-semibold">{al.nombre} {al.apellidos}</p>
                            <p className="text-xs text-gray-600">{al.email}</p>
                          </div>
                          <Badge>{al.matricula}</Badge>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        )}
      </CardContent>
    </Card>
  )
}
