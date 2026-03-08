"use client"

import { cn } from "@/lib/utils"

interface PageWrapperProps {
  children: React.ReactNode
  /** Maximum width constraint. Default is "default" (max-w-7xl) */
  maxWidth?: "sm" | "md" | "default" | "lg" | "full"
  /** Additional class names */
  className?: string
  /** Whether to animate the page entry */
  animate?: boolean
}

const maxWidthMap = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  default: "max-w-7xl",
  lg: "max-w-[1600px]",
  full: "max-w-none",
} as const

/**
 * Consistent page layout wrapper.
 * Provides unified padding, max-width, and entry animation
 * across all pages in the app.
 */
export function PageWrapper({
  children,
  maxWidth = "default",
  className,
  animate = true,
}: PageWrapperProps) {
  return (
    <div
      className={cn(
        // Consistent padding across all pages
        "mx-auto w-full px-4 py-6 sm:px-6 lg:px-8",
        // Max width
        maxWidthMap[maxWidth],
        // Page entry animation
        animate && "animate-page-enter",
        className
      )}
    >
      {children}
    </div>
  )
}
