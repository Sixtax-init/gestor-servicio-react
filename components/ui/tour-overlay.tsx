"use client"

import { useEffect, useState } from "react"

interface TourOverlayProps {
    targetSelector: string
    isActive: boolean
}

export function TourOverlay({ targetSelector, isActive }: TourOverlayProps) {
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

    useEffect(() => {
        if (!isActive) return

        const updateTargetPosition = () => {
            const element = document.querySelector(targetSelector)
            if (element) {
                setTargetRect(element.getBoundingClientRect())
            }
        }

        updateTargetPosition()
        window.addEventListener("resize", updateTargetPosition)
        window.addEventListener("scroll", updateTargetPosition)

        return () => {
            window.removeEventListener("resize", updateTargetPosition)
            window.removeEventListener("scroll", updateTargetPosition)
        }
    }, [targetSelector, isActive])

    if (!isActive || !targetRect) return null

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 z-40 animate-fade-in" />

            {/* Spotlight cutout */}
            <div
                className="fixed z-50 pointer-events-none transition-all duration-300 ease-out"
                style={{
                    top: targetRect.top - 8,
                    left: targetRect.left - 8,
                    width: targetRect.width + 16,
                    height: targetRect.height + 16,
                    boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.5)",
                    borderRadius: "8px",
                }}
            />
        </>
    )
}
