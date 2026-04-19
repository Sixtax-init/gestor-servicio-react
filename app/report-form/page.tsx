"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ReportForm } from "@/components/alumno/report-form"
import { ReportPreview } from "@/components/alumno/report-preview"
import { Button } from "@/components/ui/button"
import { Printer, Loader2, Monitor, Smartphone, ArrowLeft } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { apiFetch } from "@/lib/api-client"

export interface ReportData {
  reportNumber: string
  apellidoPaterno: string
  apellidoMaterno: string
  nombre: string
  carrera: string
  numeroControl: string
  fechaInicioDia: string
  fechaInicioMes: string
  fechaInicioAno: string
  fechaFinDia: string
  fechaFinMes: string
  fechaFinAno: string
  dependencia: string
  programa: string
  resumenActividades: string
  horasReporte: string
  horasAcumuladas: string
  nombreJefe: string
  puestoJefe: string
}

export default function Page() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [actividades, setActividades] = useState<Array<{
    actividad: string
    descripcion: string
    fecha_entrega: string
    calificacion?: number
    retroalimentacion?: string | null
    curso: string
    estado?: string
  }>>([])

  const [reportData, setReportData] = useState<ReportData>({
    reportNumber: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    nombre: "",
    carrera: "",
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
    horasAcumuladas: "",
    nombreJefe: "",
    puestoJefe: "",
  })

  const [showPreview, setShowPreview] = useState(false)

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const cargarDatosAlumno = async () => {
      try {
        setIsLoading(true)

        // Obtener datos del alumno
        const [resAlumno, resActividades] = await Promise.all([
          apiFetch('/api/auth/me').then(async res => {
            if (!res.ok) throw new Error(`Error en la API: ${res.status} ${res.statusText}`)
            return res.json()
          }),
          apiFetch('/api/alumno/actividades').then(async res => {
            if (!res.ok) return []
            return res.json()
          })
        ])

        const alumno = resAlumno.user
        const actividadesData = resActividades

        // Separar apellidos (manejar el caso en que apellidos sea null o undefined)
        const apellidos = alumno.apellidos || ''
        const [apellidoPaterno, ...restoApellidos] = apellidos.split(' ')
        const apellidoMaterno = restoApellidos.join(' ')

        // Formatear actividades para el resumen
        const resumenActividades = actividadesData && Array.isArray(actividadesData)
          ? actividadesData.map((act: any) => {
            return `• ${act.actividad}: ${act.descripcion || 'Sin descripción'}`;
          }).join('\n\n')
          : 'No hay actividades registradas'

        setActividades(actividadesData || [])

        // Actualizar el estado con los datos del alumno
        setReportData(prev => ({
          ...prev,
          apellidoPaterno: apellidoPaterno || '',
          apellidoMaterno: apellidoMaterno || '',
          nombre: alumno.nombre || '',
          carrera: alumno.carrera || 'No especificada',
          numeroControl: alumno.matricula || '',
          horasAcumuladas: (alumno.horas_acumuladas || 0).toString(),
          resumenActividades,
          // Establecer fechas por defecto (últimos 30 días)
          fechaInicioDia: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).getDate().toString(),
          fechaInicioMes: (new Date().getMonth() + 1).toString(),
          fechaInicioAno: new Date().getFullYear().toString(),
          fechaFinDia: new Date().getDate().toString(),
          fechaFinMes: (new Date().getMonth() + 1).toString(),
          fechaFinAno: new Date().getFullYear().toString(),
        }))
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        toast({
          title: "Error",
          description: `No se pudieron cargar los datos del alumno: ${errorMessage}`,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    cargarDatosAlumno()
  }, [])

  const handlePrint = () => {
    window.print()
  }


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando datos del alumno...</p>
        </div>
      </div>
    )
  }

  // Mostrar pantalla de bloqueo en móvil
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <Monitor className="h-24 w-24 text-primary" />
              <Smartphone className="h-12 w-12 text-muted-foreground absolute -bottom-2 -right-2" />
            </div>
          </div>

          <Alert>
            <Monitor className="h-4 w-4" />
            <AlertTitle className="text-lg font-semibold">Se requiere una computadora</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p>
                El reporte bimestral de servicio social requiere una pantalla más grande para poder editarse e imprimirse correctamente.
              </p>
              <p className="font-medium">
                Por favor, accede desde una computadora o laptop para continuar.
              </p>
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button
              onClick={() => router.push('/alumno')}
              className="w-full"
              size="lg"
            >
              Volver al Dashboard
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Tamaño mínimo requerido: 1024px de ancho
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8 print:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/alumno")}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Dashboard
          </Button>
          <h1 className="text-3xl font-bold mb-2">Reporte Bimestral de Servicio Social</h1>
          <p className="text-muted-foreground">Tecnológico Nacional de México - Instituto Tecnológico de Nuevo León</p>
        </div>

        {!showPreview ? (
          <div className="space-y-6">
            <ReportForm
              data={reportData}
              onDataChange={setReportData}
              actividades={actividades}
            />
            <div className="flex gap-4">
              <Button onClick={() => setShowPreview(true)} size="lg">
                Ver Vista Previa
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex gap-4 print:hidden">
              <Button onClick={() => setShowPreview(false)} variant="outline">
                Editar Formulario
              </Button>
              <Button onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" />
                Imprimir Reporte
              </Button>
            </div>
            <div className="border rounded-lg p-8 bg-white print:border-0 print:rounded-none print:p-0">
              <ReportPreview data={reportData} actividades={actividades} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}