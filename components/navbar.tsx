"use client"

import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"
import { usePathname } from "next/navigation"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <nav className="print:hidden w-full border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50 px-4">
      <div className="max-w-5xl mx-auto h-16 flex items-center justify-between">

        {/* Logo y Nombre del sistema */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-12 h-12 transition-transform group-hover:scale-105">
            <Image
              src="/logos/GUL_logo.png"
              alt="Grupo de Usuarios de Linux ITNL"
              fill
              className="object-contain"
            />
          </div>
          <span className="text-lg font-bold">Service Tracker</span>
        </Link>

        {/* Botón de tema — oculto en páginas que usan tema fijo */}
        {pathname !== "/report-form" && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        )}

      </div>
    </nav>
  )
}
