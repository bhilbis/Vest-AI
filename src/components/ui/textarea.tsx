import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-muted-foreground flex field-sizing-content min-h-16 w-full rounded-md border-2 border-foreground bg-background px-3 py-2 text-base shadow-[3px_3px_0_var(--foreground)] transition-all outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:shadow-[4px_4px_0_var(--ring)] focus-visible:border-ring",
        "aria-invalid:border-destructive aria-invalid:shadow-[3px_3px_0_var(--destructive)]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
