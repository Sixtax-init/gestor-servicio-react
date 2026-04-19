"use client"

import Image from "next/image"
import Link from "next/link"

export function Footer() {
    return (
        <footer className="w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-auto print:hidden">
            <div className="container mx-auto px-4 py-6">
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm text-muted-foreground">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10">
                            <Image
                                src="/logos/GUL_logo.png"
                                alt="Grupo de Usuarios de Linux ITNL"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <div className="text-center md:text-left">
                            <p className="font-medium text-foreground">
                                Proyecto desarrollado y mantenido por el
                            </p>
                            <p className="font-semibold">
                                Capítulo Linux del TECNL
                            </p>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="text-center mt-4 text-xs text-muted-foreground">
                    <p>© {new Date().getFullYear()} Grupo de Usuarios de Linux - Instituto Tecnológico de Nuevo León</p>
                    <p className="mt-2">
                        Soporte:{" "}
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                const subject = encodeURIComponent(`Error en ${window.location.pathname} el ${new Date().toLocaleDateString('es-MX')}`);
                                const body = encodeURIComponent("Hola,\n\nMe he encontrado con el siguiente error al intentar:\n");
                                window.location.href = `mailto:soporte.servicetracker@nuevoleon.tecnm.mx?subject=${subject}&body=${body}`;
                            }}
                            className="text-primary hover:underline transition-colors break-all"
                        >
                            soporte.servicetracker@nuevoleon.tecnm.mx
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    )
}
