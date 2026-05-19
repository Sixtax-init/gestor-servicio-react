"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MailCheck, Loader2, RefreshCw, LogOut } from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import { toast } from "sonner"

export default function PendienteVerificacionPage() {
  const [resending, setResending] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [reenviado, setReenviado] = useState(false)
  const [userInfo, setUserInfo] = useState<{ nombre: string; apellidos: string; email: string; matricula: string } | null>(null)

  useEffect(() => {
    apiFetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.user) setUserInfo(d.user) })
      .catch(() => {})
  }, [])

  async function handleReenviar() {
    setResending(true)
    try {
      const res = await apiFetch("/api/auth/reenviar-verificacion", { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        setReenviado(true)
        toast.success("Correo enviado", {
          description: "Revisa tu bandeja de entrada y la carpeta de spam.",
          duration: 6000,
        })
      } else {
        toast.error(data.error || "Error al reenviar el correo")
      }
    } catch {
      toast.error("Error de conexión. Intenta de nuevo.")
    } finally {
      setResending(false)
    }
  }

  async function handleLogout() {
    setLoggingOut(true)
    await apiFetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/login"
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background animate-fade-in">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-3 pb-4 text-center">
          <div className="flex justify-center">
            <div className="p-4 bg-primary/10 rounded-full">
              <MailCheck className="h-10 w-10 text-primary" />
            </div>
          </div>
          {userInfo && (
            <p className="text-sm font-medium text-foreground">
              {userInfo.nombre} {userInfo.apellidos} · <span className="font-mono">{userInfo.matricula}</span>
            </p>
          )}
          <CardTitle className="text-2xl font-bold">Verifica tu correo</CardTitle>
          <CardDescription>
            {userInfo
              ? <>Te enviamos un enlace de confirmación a <strong>{userInfo.email}</strong>. Haz clic en él para activar tu cuenta y continuar con tu inscripción.</>
              : "Te enviamos un enlace de confirmación. Haz clic en él para activar tu cuenta y continuar con tu inscripción al Servicio Social."
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert className="border-primary/20 bg-primary/5">
            <MailCheck className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              Revisa tu bandeja de entrada y también la <strong>carpeta de spam</strong>. El enlace
              tiene una validez de <strong>24 horas</strong>.
            </AlertDescription>
          </Alert>

          {reenviado && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <AlertDescription className="text-green-800 dark:text-green-200 text-sm">
                Correo reenviado. Si no lo recibes en unos minutos, revisa spam.
              </AlertDescription>
            </Alert>
          )}

          <Button
            className="w-full"
            variant="outline"
            onClick={handleReenviar}
            disabled={resending || loggingOut}
          >
            {resending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reenviando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reenviar correo de verificación
              </>
            )}
          </Button>

          <Button
            className="w-full"
            variant="ghost"
            onClick={handleLogout}
            disabled={resending || loggingOut}
          >
            {loggingOut ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            Cerrar sesión
          </Button>

          <p className="text-center text-xs text-muted-foreground pt-2">
            ¿Problemas? Contacta al departamento en el Edificio 20.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
