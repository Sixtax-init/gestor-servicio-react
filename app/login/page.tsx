"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useTheme } from "next-themes"
import { apiFetch } from "@/lib/api-client"

import { Eye, EyeOff, Monitor, Loader2 } from "lucide-react"
import { AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

export default function LoginPage() {
  const router = useRouter()
  const [matricula, setMatricula] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetLoading, setResetLoading] = useState(false)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    // ... (rest of handleSubmit is unchanged, but included for context if needed, or I can just target the specific blocks)
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ matricula, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Error al iniciar sesión")
        setLoading(false)
        return
      }

      // Redirigir según el tipo de usuario
      const { user } = data
      if (user.tipo_usuario === "main_admin") {
        router.push("/main-admin")
      } else if (user.tipo_usuario === "administrador") {
        router.push("/admin")
      } else if (user.tipo_usuario === "maestro") {
        router.push("/maestro")
      } else {
        router.push("/alumno")
      }
    } catch (err) {
      console.error("[login] Error:", err)
      setError("Error de conexión. Intenta de nuevo.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background transition-colors duration-300 animate-fade-in">

      <Card className="w-full max-w-md backdrop-blur-md bg-card/80 border-white/20 shadow-xl animate-slide-up">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Service Tracker</CardTitle>
          <CardDescription className="text-center">Ingresa tu matrícula y contraseña para acceder</CardDescription>
        </CardHeader>
        <CardContent>
          {isMobile && (
            <Alert className="mb-6 bg-primary/5 border-primary/20 animate-in fade-in slide-in-from-top-2 duration-500">
              <Monitor className="h-4 w-4 text-primary" />
              <AlertTitle className="text-sm font-semibold">Uso en Dispositivos Móviles</AlertTitle>
              <AlertDescription className="text-xs">
                Para experimentar o usar de mejor manera el sistema, te recomendamos usar un ordenador.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="matricula">Matrícula / Número de Control</Label>
              <Input
                id="matricula"
                type="text"
                placeholder="Ej. 21480680"
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <button
                  type="button"
                  onClick={() => setResetDialogOpen(true)}
                  className="text-xs text-primary hover:underline transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Si tiene algun problema contacte al administrador</p>
            <p> o visitanos en el Edificio 20 Grupo Usuarios de Linux</p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Recuperar Contraseña</DialogTitle>
            <DialogDescription>
              Ingresa tu correo electrónico registrado y te enviaremos un enlace para restablecer tu contraseña.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Correo Electrónico</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="ejemplo@correo.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResetDialogOpen(false)}
              disabled={resetLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (!resetEmail) {
                  toast.error("Ingresa un correo electrónico");
                  return;
                }
                setResetLoading(true);
                try {
                  const res = await apiFetch("/api/auth/recuperar-password", {
                    method: "POST",
                    body: JSON.stringify({ email: resetEmail }),
                  });
                  const data = await res.json();
                  if (res.ok) {
                    toast.success("Solicitud procesada", {
                      description: data.message,
                      duration: 6000
                    });
                    setResetDialogOpen(false);
                    setResetEmail("");
                  } else {
                    toast.error("Error", { description: data.error });
                  }
                } catch (err) {
                  toast.error("Error de conexión");
                } finally {
                  setResetLoading(false);
                }
              }}
              disabled={resetLoading}
            >
              {resetLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Enlace"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
