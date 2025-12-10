"use client"

import { useState } from "react"
import { ReportForm } from "@/components/alumno/report-form"
import { ReportPreview } from "@/components/alumno/report-preview"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { ReportData } from "@/types/report"

export default function Page() {
  console.log("[v0] Page component rendering")

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
    actividades: []
  })

  const [showPreview, setShowPreview] = useState(false)

  const handlePrint = () => {
    window.print()
  }

  console.log("[v0] Show preview:", showPreview)

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