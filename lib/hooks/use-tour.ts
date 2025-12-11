"use client"

import { useState, useEffect, useCallback } from "react"

export interface TourStep {
    target: string
    title: string
    content: string
    placement?: "top" | "bottom" | "left" | "right"
    switchToTab?: string // Tab value to switch to before showing this step
}

export interface Tour {
    id: string
    steps: TourStep[]
}

export function useTour(tour: Tour, onTabChange?: (tab: string) => void) {
    const [isRunning, setIsRunning] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [hasCompleted, setHasCompleted] = useState(false)

    // Check if tour has been completed before
    useEffect(() => {
        const completed = localStorage.getItem(`tour-completed-${tour.id}`)
        setHasCompleted(completed === "true")
    }, [tour.id])

    // Auto-start tour on first visit
    useEffect(() => {
        if (!hasCompleted && !isRunning) {
            // Small delay to ensure DOM is ready
            const timer = setTimeout(() => {
                setIsRunning(true)
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [hasCompleted, isRunning])

    // Handle tab switching when step changes
    useEffect(() => {
        if (isRunning && tour.steps[currentStep]?.switchToTab && onTabChange) {
            onTabChange(tour.steps[currentStep].switchToTab!)
        }
    }, [currentStep, isRunning, tour.steps, onTabChange])

    const startTour = useCallback(() => {
        setCurrentStep(0)
        setIsRunning(true)
    }, [])

    const nextStep = useCallback(() => {
        if (currentStep < tour.steps.length - 1) {
            setCurrentStep((prev) => prev + 1)
        } else {
            finishTour()
        }
    }, [currentStep, tour.steps.length])

    const prevStep = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1)
        }
    }, [currentStep])

    const skipTour = useCallback(() => {
        setIsRunning(false)
        localStorage.setItem(`tour-completed-${tour.id}`, "true")
        setHasCompleted(true)
    }, [tour.id])

    const finishTour = useCallback(() => {
        setIsRunning(false)
        localStorage.setItem(`tour-completed-${tour.id}`, "true")
        setHasCompleted(true)
    }, [tour.id])

    const resetTour = useCallback(() => {
        localStorage.removeItem(`tour-completed-${tour.id}`)
        setHasCompleted(false)
        setCurrentStep(0)
        setIsRunning(true)
    }, [tour.id])

    return {
        isRunning,
        currentStep,
        hasCompleted,
        startTour,
        nextStep,
        prevStep,
        skipTour,
        resetTour,
        totalSteps: tour.steps.length,
        currentStepData: tour.steps[currentStep],
    }
}
