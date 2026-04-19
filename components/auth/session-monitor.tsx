"use client"

import { useEffect, useState, useCallback } from "react"
import { usePathname } from "next/navigation"

// Tiempo de inactividad permitido antes de cerrar sesión (ej. 15 min total, avisa a los 14)
const MAX_IDLE_TIME_MS = 15 * 60 * 1000 
const WARNING_TIME_MS = 14 * 60 * 1000

export function SessionMonitor() {
  const pathname = usePathname()
  
  const [lastActive, setLastActive] = useState<number>(Date.now())
  const [showWarning, setShowWarning] = useState(false)

  // Ignorar páginas públicas
  const isPublicPage = pathname.startsWith("/login") || pathname === "/"
  
  const updateActivity = useCallback(() => {
    setLastActive(Date.now())
    if (showWarning) {
      setShowWarning(false)
    }
  }, [showWarning])

  useEffect(() => {
    if (isPublicPage) return

    // Registrar eventos de actividad del usuario
    const events = ["mousedown", "keydown", "scroll", "touchstart"]
    events.forEach(event => document.addEventListener(event, updateActivity, { passive: true }))

    const intervalId = setInterval(() => {
      const now = Date.now()
      const idleTime = now - lastActive

      if (idleTime >= MAX_IDLE_TIME_MS) {
        // Expiró por inactividad prolongada
        window.location.href = "/api/auth/logout?motivo=inactividad" // Hacer logout limpio por seguridad
      } else if (idleTime >= WARNING_TIME_MS) {
        // Advertencia previa
        setShowWarning(true)
      }
    }, 10000)

    return () => {
      events.forEach(event => document.removeEventListener(event, updateActivity))
      clearInterval(intervalId)
    }
  }, [isPublicPage, lastActive, updateActivity])

  if (!showWarning || isPublicPage) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in pt-safe">
      <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-xl p-4 shadow-xl shadow-yellow-500/10 backdrop-blur-md max-w-sm">
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div>
            <h4 className="font-semibold text-sm">Tu sesión está a punto de expirar</h4>
            <p className="text-xs mt-1 text-yellow-500/80">Por tu seguridad, cerraremos tu sesión en menos de un minuto si no hay actividad.</p>
            <button 
                onClick={updateActivity}
                className="mt-3 text-xs font-semibold bg-yellow-500 text-yellow-950 px-3 py-1.5 rounded-md hover:bg-yellow-400 transition-colors"
            >
                Mantener sesión abierta
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
