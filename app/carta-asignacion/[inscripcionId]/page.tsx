"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { CartaAsignacionPreview, type CartaData } from "@/components/inscripcion/carta-asignacion-preview"
import { Button } from "@/components/ui/button"
import { Printer, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { apiFetch } from "@/lib/api-client"

export default function CartaAsignacionPage() {
  const params = useParams()
  const inscripcionId = params.inscripcionId as string

  const [carta, setCarta] = useState<CartaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch(`/api/inscripcion/carta-asignacion/${inscripcionId}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? "Error al cargar la carta"); return }
        setCarta(data.carta)
      })
      .catch(() => setError("Error de conexión"))
      .finally(() => setLoading(false))
  }, [inscripcionId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !carta) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error ?? "Carta no encontrada"}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4 print:bg-white print:p-0">
      {/* Barra de acciones — oculta al imprimir */}
      <div className="container mx-auto max-w-3xl mb-6 print:hidden">
        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={() => window.print()} className="gap-2">
            <Printer className="h-4 w-4" />
            Imprimir / Guardar como PDF
          </Button>
          <p className="text-xs text-muted-foreground">
            En el diálogo de impresión selecciona "Guardar como PDF" y desmarca encabezados y pies de página.
            Una vez descargado, <strong>cierra esta ventana</strong> para regresar al portal.
          </p>
        </div>
      </div>

      {/* Carta */}
      <div className="container mx-auto max-w-3xl">
        <div className="border rounded-lg bg-white p-12 shadow-sm print:border-0 print:rounded-none print:p-0 print:shadow-none">
          <CartaAsignacionPreview data={carta} />
        </div>
      </div>
    </div>
  )
}
