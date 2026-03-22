"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { KeyRound, Eye, EyeOff, ShieldCheck } from "lucide-react"
import { apiFetch } from "@/lib/api-client"

export default function CambiarPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showActual, setShowActual] = useState(false)
  const [showNuevo, setShowNuevo] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [form, setForm] = useState({
    passwordActual: "",
    passwordNuevo: "",
    passwordConfirm: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (form.passwordNuevo !== form.passwordConfirm) {
      setError("Las contraseñas nuevas no coinciden")
      return
    }

    if (form.passwordNuevo.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres")
      return
    }

    setLoading(true)

    try {
      const res = await apiFetch("/api/auth/cambiar-password", {
        method: "POST",
        body: JSON.stringify({
          passwordActual: form.passwordActual,
          passwordNuevo: form.passwordNuevo,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Error al cambiar la contraseña")
        return
      }

      // Redirigir al dashboard según el rol (el middleware ya dejará pasar)
      router.push("/")
      router.refresh()
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
          <CardTitle className="text-2xl">Cambia tu contraseña</CardTitle>
          <CardDescription>
            Por seguridad, debes establecer una nueva contraseña antes de continuar.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="passwordActual">Contraseña actual</Label>
              <div className="relative">
                <Input
                  id="passwordActual"
                  type={showActual ? "text" : "password"}
                  value={form.passwordActual}
                  onChange={(e) => setForm({ ...form, passwordActual: e.target.value })}
                  placeholder="Tu contraseña temporal"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowActual(!showActual)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showActual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

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
