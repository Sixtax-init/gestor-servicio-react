"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { KeyRound, Eye, EyeOff, ShieldCheck, CheckCircle2, XCircle, Loader2 } from "lucide-react"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [verificando, setVerificando] = useState(true)
  const [tokenValido, setTokenValido] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [showNuevo, setShowNuevo] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [form, setForm] = useState({ passwordNuevo: "", passwordConfirm: "" })

  // Verificar validez del token al cargar la página
  useEffect(() => {
    if (!token) {
      setVerificando(false)
      return
    }

    fetch(`/api/auth/reset-password?token=${token}`)
      .then(res => res.json())
      .then(data => setTokenValido(data.valid === true))
      .catch(() => setTokenValido(false))
      .finally(() => setVerificando(false))
  }, [token])

  if (verificando) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">Verificando enlace...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!token || !tokenValido) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-7 w-7 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Enlace expirado o ya usado</CardTitle>
            <CardDescription>
              Este enlace ya fue utilizado o ha expirado. Solicita uno nuevo desde tu panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => router.push("/login")}>
              Ir al inicio de sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </div>
            <CardTitle className="text-2xl">¡Contraseña actualizada!</CardTitle>
            <CardDescription>Tu contraseña ha sido cambiada exitosamente. Ya puedes iniciar sesión.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => router.push("/login")}>
              Iniciar sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (form.passwordNuevo !== form.passwordConfirm) {
      setError("Las contraseñas no coinciden")
      return
    }

    if (form.passwordNuevo.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, passwordNuevo: form.passwordNuevo }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Error al cambiar la contraseña")
        return
      }

      setSuccess(true)
    } catch {
      setError("Error de conexión. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <KeyRound className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">Nueva contraseña</CardTitle>
          <CardDescription>
            Ingresa tu nueva contraseña. El enlace es de un solo uso y válido por 1 hora.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="passwordNuevo">Nueva contraseña</Label>
              <div className="relative">
                <Input
                  id="passwordNuevo"
                  type={showNuevo ? "text" : "password"}
                  value={form.passwordNuevo}
                  onChange={(e) => setForm({ ...form, passwordNuevo: e.target.value })}
                  placeholder="Mínimo 8 caracteres"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNuevo(!showNuevo)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showNuevo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="passwordConfirm">Confirmar nueva contraseña</Label>
              <div className="relative">
                <Input
                  id="passwordConfirm"
                  type={showConfirm ? "text" : "password"}
                  value={form.passwordConfirm}
                  onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })}
                  placeholder="Repite la nueva contraseña"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full gap-2" disabled={loading}>
              <ShieldCheck className="h-4 w-4" />
              {loading ? "Guardando..." : "Establecer nueva contraseña"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
