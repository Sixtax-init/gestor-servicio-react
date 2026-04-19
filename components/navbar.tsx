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
        <Link href="/" className="flex items-center gap-4 group">
          <div className="relative w-20 h-20 ml-1 transition-transform group-hover:scale-110 flex items-center justify-center">
            <Image
              src="/logos/original.png"
              alt="Service Tracker Tux"
              fill
              className="object-contain dark:drop-shadow-[0px_0px_0px_#ffffff]"
              priority
            />
          </div>
          <span className="text-lg font-bold ml-2">Service Tracker</span>
        </Link>

        {/* Botón de tema */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            const next = theme === "dark" ? "light" : "dark"
            if (!document.startViewTransition) {
              setTheme(next)
              return
            }
            document.startViewTransition(() => setTheme(next))
          }}
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
