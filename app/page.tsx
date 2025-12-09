"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Users, BookOpen, Clock, FileText, Shield } from "lucide-react"

const features = [
  {
    icon: Users,
    title: "Gestión de Usuarios",
    description: "Administra estudiantes, maestros y administradores con roles y permisos específicos",
    items: ["Registro con matrícula", "Roles diferenciados", "Autenticación segura"],
  },
  {
    icon: BookOpen,
    title: "Cursos y Talleres",
    description: "Crea y gestiona cursos de servicio social y talleres con límites de inscripción",
    items: ["Servicio social", "Talleres y cursos", "Inscripción automática"],
  },
  {
    icon: Clock,
    title: "Seguimiento de Horas",
    description: "Registra y monitorea las horas de servicio social de cada estudiante",
    items: ["Registro automático", "Progreso visual", "Reportes detallados"],
  },
  {
    icon: FileText,
    title: "Gestión de Tareas",
    description: "Asigna tareas con prioridades, fechas límite y subida de archivos",
    items: ["Prioridades", "Fechas de vencimiento", "Subida de archivos"],
  },
  {
    icon: Shield,
    title: "Dashboards Personalizados",
    description: "Interfaces específicas para cada tipo de usuario con sus funciones",
    items: ["Dashboard Admin", "Dashboard Maestro", "Dashboard Alumno"],
  },
]

export default function HomePage() {
  const [mounted, setMounted] = useState(false)

  // Indicamos que estamos en cliente para evitar hydration mismatch
  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Gestor de Horas</h1>
          </div>
          <Link href="/login">
            <Button className="transition-transform hover:scale-105">Iniciar Sesión</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 text-center space-y-6">
        <Badge variant="secondary" className="mb-4">Sistema de Gestión Académica</Badge>
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">
          Gestión de Servicio Social y Cursos
        </h2>
        <p className="text-xl text-muted-foreground text-pretty">
          Plataforma completa para administrar horas de servicio social, cursos, tareas y seguimiento de estudiantes
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link href="/login">
            <Button size="lg" className="transition-transform duration-200 hover:scale-105 hover:shadow-md">Comenzar</Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline" className="transition-transform duration-200 hover:scale-105 hover:shadow-md">Ver Características</Button>
          </Link>
        </div>
      </section>

      {/* Features Carousel */}
      <section id="features" className="py-16 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Características Principales</h3>
        </div>

        {/* Carousel Container with Gradients */}
        <div className="relative">
          {/* Left Gradient Overlay */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background via-background/80 to-transparent z-10 pointer-events-none" />

          {/* Right Gradient Overlay */}
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none" />

          {/* Scrolling Container */}
          <div className="carousel-track-container overflow-hidden">
            <div className="carousel-track flex gap-6">
              {/* Triplicamos las features para un loop más suave */}
              {features.concat(features, features).map((feature, idx) => (
                <div key={idx} className="carousel-card flex-shrink-0 w-80">
                  <Card className="h-full transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/10">
                    <CardHeader>
                      {React.createElement(feature.icon, { className: "h-10 w-10 text-primary mb-2" })}
                      <CardTitle>{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {feature.items.map((item, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="max-w-3xl mx-auto text-center bg-gradient-to-r from-background to-muted/10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl">¿Listo para comenzar?</CardTitle>
            <CardDescription className="text-lg">Inicia sesión para acceder al sistema de gestión</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button size="lg" className="mt-4 transition-transform duration-200 hover:scale-105 hover:shadow-md">Ir al Login</Button>
            </Link>
            <p className="text-sm text-muted-foreground mt-6">
              Consulta la documentación en <code className="bg-muted px-2 py-1 rounded">docs/INICIO_RAPIDO.md</code> para configurar la base de datos
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>Sistema de Gestión de Servicio Social - Desarrollado con Next.js y PostgreSQL</p>
        </div>
      </footer>
    </div>
  )
}
