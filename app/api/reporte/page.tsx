// app/reporte/page.tsx
"use client"

import { useState, useEffect } from "react"
import { ReportForm } from "@/components/alumno/report-form"
import { ReportPreview } from "@/components/alumno/report-preview"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { useRouter } from "next/navigation"
import { ReportData } from "@/types/report"

export default function ReportePage() {
  const router = useRouter()
  const [reportData, setReportData] = useState<ReportData>({
    reportNumber: "1",
    apellidoPaterno: "",
    apellidoMaterno: "",
    nombre: "",
    carrera: "Ingeniería en Sistemas Computacionales",
    numeroControl: "",
    fechaInicioDia: "",
    fechaInicioMes: "",
    fechaInicioAno: "",
    fechaFinDia: "",
    fechaFinMes: "",
    fechaFinAno: "",
    dependencia: "",
    programa: "",
    resumenActividades: "",
    horasReporte: "",
    horasAcumuladas: "0",
    nombreJefe: "",
    puestoJefe: "Jefe de Departamento",
    actividades: []
  })

  const [showPreview, setShowPreview] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const sessionResponse = await fetch('/api/auth/session')
        if (!sessionResponse.ok) {
          router.push('/login')
          return
        }
        const session = await sessionResponse.json()

        if (!session) {
          router.push('/login')
          return
        }

        // Obtener tareas del usuario
        const tareasResponse = await fetch('/api/alumno/tareas')
        if (!tareasResponse.ok) throw new Error('Error al cargar tareas')
        const tareas = await tareasResponse.json()

        // Obtener datos del usuario
        const userResponse = await fetch(`/api/alumno/${session.id}`)
        if (!userResponse.ok) throw new Error('Error al cargar datos del usuario')
        const userData = await userResponse.json()

        // Configurar fechas
        const hoy = new Date()
        const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
        const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)

        // Separar apellidos
        const [apellidoPaterno, ...restoApellidos] = session.apellidos?.split(' ') || ['', '']
        const apellidoMaterno = restoApellidos.join(' ')

        setReportData(prev => ({
          ...prev,
          apellidoPaterno,
          apellidoMaterno,
          nombre: session.nombre || '',
          numeroControl: session.matricula || '',
          fechaInicioDia: primerDiaMes.getDate().toString().padStart(2, '0'),
          fechaInicioMes: (primerDiaMes.getMonth() + 1).toString().padStart(2, '0'),
          fechaInicioAno: primerDiaMes.getFullYear().toString(),
          fechaFinDia: ultimoDiaMes.getDate().toString().padStart(2, '0'),
          fechaFinMes: (ultimoDiaMes.getMonth() + 1).toString().padStart(2, '0'),
          fechaFinAno: ultimoDiaMes.getFullYear().toString(),
          horasAcumuladas: userData.horas_acumuladas?.toString() || "0",
          resumenActividades: generarResumenActividades(tareas)
        }))

      } catch (error) {
        console.error('Error al cargar datos:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [router])

  const generarResumenActividades = (tareas: any[]): string => {
    if (!tareas || tareas.length === 0) {
      return "No se encontraron actividades registradas para este período."
    }

    return tareas
      .map((tarea, index) => {
        const fecha = tarea.fecha_vencimiento
          ? new Date(tarea.fecha_vencimiento).toLocaleDateString()
          : 'Sin fecha'
        return `${index + 1}. ${tarea.titulo || 'Sin título'}${tarea.asignacion_horas ? ` (${tarea.asignacion_horas} horas)` : ''} - ${fecha}`
      })
      .join('\n')
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Cargando datos del usuario...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8 print:hidden">
          <h1 className="text-3xl font-bold mb-2">Reporte Bimestral de Servicio Social</h1>
          <p className="text-gray-600">Tecnológico Nacional de México - Instituto Tecnológico de Nuevo León</p>
        </div>

        {!showPreview ? (
          <div className="space-y-6">
            <ReportForm
              data={reportData}
              onDataChange={setReportData}
              actividades={reportData.actividades}
            />
            <div className="flex gap-4">
              <Button
                onClick={() => setShowPreview(true)}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Ver Vista Previa
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex gap-4 print:hidden">
              <Button
                onClick={() => setShowPreview(false)}
                variant="outline"
                className="border-gray-300"
              >
                Editar Formulario
              </Button>
              <Button
                onClick={handlePrint}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Printer className="h-4 w-4" />
                Imprimir Reporte
              </Button>
            </div>
            <div className="border rounded-lg p-8 bg-white print:border-0 print:rounded-none print:p-0">
              <ReportPreview
                data={reportData}
                actividades={reportData.actividades}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}