import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md border-2 border-foreground bg-background px-3 py-1 text-base shadow-[3px_3px_0_var(--foreground)] transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:shadow-[4px_4px_0_var(--ring)] focus-visible:border-ring",
        "aria-invalid:border-destructive aria-invalid:shadow-[3px_3px_0_var(--destructive)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
