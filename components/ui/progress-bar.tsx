"use client"

import { cn } from "@/lib/utils"

interface ProgressBarProps {
    current: number
    max: number
    label?: string
    showPercentage?: boolean
    className?: string
    size?: "sm" | "md" | "lg"
}

export function ProgressBar({
    current,
    max,
    label,
    showPercentage = true,
    className,
    size = "md",
}: ProgressBarProps) {
    const percentage = Math.min(Math.round((current / max) * 100), 100)

    // Color based on progress
    const getColor = () => {
        if (percentage >= 100) return "bg-green-500"
        if (percentage >= 80) return "bg-green-500"
        if (percentage >= 50) return "bg-yellow-500"
        return "bg-red-500"
    }

    const heights = {
        sm: "h-2",
        md: "h-3",
        lg: "h-4",
    }

    return (
        <div className={cn("w-full", className)}>
            {label && (
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-muted-foreground">{label}</span>
                    {showPercentage && (
                        <span className="text-sm font-semibold">{percentage}%</span>
                    )}
                </div>
            )}
            <div className={cn("w-full bg-muted rounded-full overflow-hidden", heights[size])}>
                <div
                    className={cn(
                        "h-full transition-all duration-500 ease-out rounded-full",
                        getColor()
                    )}
                    style={{ width: `${percentage}%` }}
                    role="progressbar"
                    aria-valuenow={percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={label || `Progress: ${percentage}%`}
                />
            </div>
            {!label && showPercentage && (
                <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-muted-foreground">
                        {current} / {max} hrs
                    </span>
                    <span className="text-xs font-semibold">{percentage}%</span>
                </div>
            )}
        </div>
    )
}
