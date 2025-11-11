"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ReportForm } from "@/components/alumno/report-form"
import { ReportPreview } from "@/components/alumno/report-preview"
import { Button } from "@/components/ui/button"
import { Printer, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

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

  useEffect(() => {
    const cargarDatosAlumno = async () => {
      try {
        setIsLoading(true)
        
        console.log('Iniciando carga de datos del alumno...')
        
        // Obtener datos del alumno
        const [resAlumno, resActividades] = await Promise.all([
          fetch('/api/auth/me').then(async res => {
            if (!res.ok) {
              const error = await res.text()
              console.error('Error en respuesta de /api/auth/me:', error)
              throw new Error(`Error en la API: ${res.status} ${res.statusText}`)
            }
            return res.json()
          }),
          fetch('/api/alumno/actividades').then(async res => {
            if (!res.ok) {
              const error = await res.text()
              console.error('Error en respuesta de /api/alumno/actividades:', error)
              return [] // Retornar array vacío en caso de error
            }
            return res.json()
          })
        ])

        console.log('Datos recibidos del alumno:', resAlumno)
        console.log('Actividades recibidas:', resActividades)

        // Extraer los datos del usuario de la respuesta
        const alumno = resAlumno.user; // Asegurarse de acceder a la propiedad 'user'
        const actividadesData = resActividades;

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
        console.error('Error al cargar datos:', error)
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        toast({
          title: "Error",
          description: `No se pudieron cargar los datos del alumno: ${errorMessage}`,
          variant: "destructive",
        })
        // No redirigir automáticamente para permitir la depuración
        // router.push('/alumno')
      } finally {
        setIsLoading(false)
      }
    }

    cargarDatosAlumno()
  }, [])

  const handlePrint = () => {
    window.print()
  }

  console.log("[v0] Show preview:", showPreview)

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