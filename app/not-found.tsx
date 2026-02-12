"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, ArrowLeft, Clock, BookOpen, Users } from "lucide-react"

export default function NotFound() {
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])

    if (!mounted) return null

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
            <div className="container max-w-4xl mx-auto">
                <Card className="border-2 shadow-2xl animate-fade-in">
                    <CardHeader className="text-center space-y-4 pb-4">
                        {/* Tux Image */}
                        <div className="flex justify-center animate-slide-up">
                            <div className="relative w-48 h-48 md:w-64 md:h-64">
                                <Image
                                    src="ssocial/logos/Tux_404.png"
                                    alt="Tux perdido"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </div>
                        </div>

                        {/* Error Code */}
                        <div className="space-y-2">
                            <h1 className="text-7xl md:text-9xl font-bold text-primary animate-pulse">
                                404
                            </h1>
                            <CardTitle className="text-3xl md:text-4xl">
                                ¡Página No Encontrada!
                            </CardTitle>
                        </div>

                        {/* Creative Message */}
                        <CardDescription className="text-lg md:text-xl max-w-2xl mx-auto">
                            Parece que esta página está cumpliendo su servicio social... ¡en otra dimensión! 🐧
                            <br />
                            <span className="text-muted-foreground text-base mt-2 block">
                                Tux no pudo encontrar las horas que buscas en este servidor Linux.
                            </span>
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6 pt-4">
                        {/* Quick Navigation */}
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-4">
                                ¿A dónde te gustaría ir?
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl mx-auto">
                                <Link href="/">
                                    <Button
                                        variant="default"
                                        className="w-full transition-transform hover:scale-105"
                                        size="lg"
                                    >
                                        <Home className="mr-2 h-5 w-5" />
                                        Volver al Inicio
                                    </Button>
                                </Link>
                                <Link href="/login">
                                    <Button
                                        variant="outline"
                                        className="w-full transition-transform hover:scale-105"
                                        size="lg"
                                    >
                                        <ArrowLeft className="mr-2 h-5 w-5" />
                                        Iniciar Sesión
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Quick Links Section */}
                        <div className="border-t pt-6">
                            <p className="text-sm text-muted-foreground text-center mb-4">
                                O accede directamente a:
                            </p>
                            <div className="flex flex-wrap justify-center gap-3">
                                <Link href="/admin">
                                    <Button variant="secondary" size="sm" className="transition-transform hover:scale-105">
                                        <Users className="mr-2 h-4 w-4" />
                                        Dashboard Admin
                                    </Button>
                                </Link>
                                <Link href="/maestro">
                                    <Button variant="secondary" size="sm" className="transition-transform hover:scale-105">
                                        <BookOpen className="mr-2 h-4 w-4" />
                                        Dashboard Maestro
                                    </Button>
                                </Link>
                                <Link href="/alumno">
                                    <Button variant="secondary" size="sm" className="transition-transform hover:scale-105">
                                        <Clock className="mr-2 h-4 w-4" />
                                        Dashboard Alumno
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Footer Message */}
                        <div className="text-center pt-4 border-t">
                            <p className="text-xs text-muted-foreground">
                                Si crees que esto es un error, contacta a <a href="mailto:soporte.servicetracker@nuevoleon.tecnm.mx" className="text-primary hover:underline">Soporte Técnico</a>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
