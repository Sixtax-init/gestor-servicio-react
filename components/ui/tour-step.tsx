"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

interface TourStepProps {
    targetSelector: string
    title: string
    content: string
    currentStep: number
    totalSteps: number
    onNext: () => void
    onPrev: () => void
    onSkip: () => void
    isActive: boolean
    placement?: "top" | "bottom" | "left" | "right"
}

export function TourStep({
    targetSelector,
    title,
    content,
    currentStep,
    totalSteps,
    onNext,
    onPrev,
    onSkip,
    isActive,
    placement = "bottom",
}: TourStepProps) {
    const [position, setPosition] = useState({ top: 0, left: 0 })
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        if (!isActive) {
            setIsVisible(false)
            return
        }

        const element = document.querySelector(targetSelector)
        if (element) {
            // Hacemos scroll sólo una vez cuando cambia el elemento objetivo (nuevo paso)
            element.scrollIntoView({ behavior: "smooth", block: "center" })
        }

        const updatePosition = () => {
            if (element) {
                const rect = element.getBoundingClientRect()
                const tooltipWidth = 320
                const tooltipHeight = 200
                const offset = 16

                let top = 0
                let left = 0

                switch (placement) {
                    case "bottom":
                        top = rect.bottom + offset
                        left = rect.left + rect.width / 2 - tooltipWidth / 2
                        break
                    case "top":
                        top = rect.top - tooltipHeight - offset
                        left = rect.left + rect.width / 2 - tooltipWidth / 2
                        break
                    case "right":
                        top = rect.top + rect.height / 2 - tooltipHeight / 2
                        left = rect.right + offset
                        break
                    case "left":
                        top = rect.top + rect.height / 2 - tooltipHeight / 2
                        left = rect.left - tooltipWidth - offset
                        break
                }

                // Asegurar que el tooltip permanezca dentro del viewport (responsivo)
                const padding = 16
                if (left < padding) left = padding
                if (left + tooltipWidth > window.innerWidth - padding) {
                    left = window.innerWidth - tooltipWidth - padding
                }
                if (top < padding) top = padding
                if (top + tooltipHeight > window.innerHeight - padding) {
                    top = window.innerHeight - tooltipHeight - padding
                }

                setPosition({ top, left })
                setIsVisible(true)
            }
        }

        updatePosition()
        window.addEventListener("resize", updatePosition)
        window.addEventListener("scroll", updatePosition)

        return () => {
            window.removeEventListener("resize", updatePosition)
            window.removeEventListener("scroll", updatePosition)
        }
    }, [targetSelector, isActive, placement])

    if (!isActive || !isVisible) return null

    const isFirstStep = currentStep === 0
    const isLastStep = currentStep === totalSteps - 1

    return (
        <Card
            className="fixed z-[100] w-80 shadow-2xl animate-slide-up"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
            }}
        >
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-lg">{title}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                            Paso {currentStep + 1} de {totalSteps}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onSkip} className="h-6 w-6">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pb-3">
                <p className="text-sm text-muted-foreground">{content}</p>
            </CardContent>
            <CardFooter className="flex justify-between gap-2">
                <Button variant="outline" size="sm" onClick={onPrev} disabled={isFirstStep}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                </Button>
                <Button size="sm" onClick={onNext}>
                    {isLastStep ? "Finalizar" : "Siguiente"}
                    {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
                </Button>
            </CardFooter>
        </Card>
    )
}
