"use client"

import Link from "next/link"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const { theme, setTheme } = useTheme()

  return (
    <nav className="w-full border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50 px-4">
      <div className="max-w-5xl mx-auto h-16 flex items-center justify-between">

        {/* Nombre del sistema */}
        <Link href="/" className="text-lg font-bold">
          Gestor Horas Linux
        </Link>

        {/* Botón de tema */}
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

      </div>
    </nav>
  )
}
