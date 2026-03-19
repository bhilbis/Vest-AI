import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-muted animate-pulse rounded-md border-2 border-foreground/20", className)}
      {...props}
    />
  )
}

export { Skeleton }
