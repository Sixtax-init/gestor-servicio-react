"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff, GraduationCap } from "lucide-react"
import Link from "next/link"
import { apiFetch } from "@/lib/api-client"

interface FormState {
  matricula: string
  nombre: string
  apellidos: string
  email: string
  carrera_id: string
  sexo: string
  telefono: string
  domicilio: string
  password: string
  confirmPassword: string
}

export default function RegistroPage() {
  const [form, setForm] = useState<FormState>({
    matricula: "",
    nombre: "",
    apellidos: "",
    email: "",
    carrera_id: "",
    sexo: "",
    telefono: "",
    domicilio: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [carreras, setCarreras] = useState<{ id: number; nombre: string; clave: string }[]>([])

  // Catálogo público: esta página se ve sin sesión.
  useEffect(() => {
    apiFetch("/api/public/carreras")
      .then((res) => res.json())
      .then((data) => setCarreras(data.carreras ?? []))
      .catch(() => setError("No se pudieron cargar las carreras. Recarga la página."))
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }
    if (form.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }
    if (!form.sexo) {
      setError("Selecciona tu sexo")
      return
    }

    setLoading(true)
    try {
      const res = await apiFetch("/api/auth/registro", {
        method: "POST",
        body: JSON.stringify({
          matricula: form.matricula,
          nombre: form.nombre,
          apellidos: form.apellidos,
          email: form.email,
          carrera_id: form.carrera_id ? Number(form.carrera_id) : null,
          sexo: form.sexo,
          telefono: form.telefono,
          domicilio: form.domicilio,
          password: form.password,
          confirmPassword: form.confirmPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Error al registrarse")
        setLoading(false)
        return
      }
      window.location.href = "/inscripcion"
    } catch {
      setError("Error de conexión. Intenta de nuevo.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background animate-fade-in">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Registro de Pre-candidato</CardTitle>
          <CardDescription className="text-center">
            Completa tus datos para solicitar tu inscripción al Servicio Social
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="matricula">Matrícula / N° de Control *</Label>
                <Input
                  id="matricula"
                  name="matricula"
                  placeholder="Ej. 21480680"
                  value={form.matricula}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carrera_id">Carrera *</Label>
                <Select
                  value={form.carrera_id}
                  onValueChange={(v) => setForm((f) => ({ ...f, carrera_id: v }))}
                  disabled={loading || carreras.length === 0}
                >
                  <SelectTrigger id="carrera_id">
                    <SelectValue placeholder={carreras.length === 0 ? "Cargando..." : "Selecciona tu carrera"} />
                  </SelectTrigger>
                  <SelectContent>
                    {carreras.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.nombre} ({c.clave})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre(s) *</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  placeholder="Juan"
                  value={form.nombre}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellidos">Apellidos *</Label>
                <Input
                  id="apellidos"
                  name="apellidos"
                  placeholder="García López"
                  value={form.apellidos}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sexo">Sexo *</Label>
                <Select
                  value={form.sexo}
                  onValueChange={(v) => setForm((prev) => ({ ...prev, sexo: v }))}
                  disabled={loading}
                >
                  <SelectTrigger id="sexo">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="H">Hombre</SelectItem>
                    <SelectItem value="M">Mujer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  id="telefono"
                  name="telefono"
                  placeholder="8112345678"
                  value={form.telefono}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domicilio">Domicilio *</Label>
                <Input
                  id="domicilio"
                  name="domicilio"
                  placeholder="Calle, Colonia, Ciudad"
                  value={form.domicilio}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    value={form.password}
                    onChange={handleChange}
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
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repetir contraseña"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                "Crear cuenta y continuar"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Iniciar sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
