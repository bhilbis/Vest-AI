import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-bold border-2 border-foreground shadow-[4px_4px_0_var(--foreground)] transition-[box-shadow,transform] duration-100 ease-out active:shadow-[1px_1px_0_var(--foreground)] active:translate-x-[3px] active:translate-y-[3px] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:outline-3 focus-visible:outline-ring focus-visible:outline-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:shadow-[5px_5px_0_var(--foreground)] hover:translate-x-[-1px] hover:translate-y-[-1px]",
        destructive:
          "bg-destructive text-white hover:shadow-[5px_5px_0_var(--foreground)] hover:translate-x-[-1px] hover:translate-y-[-1px]",
        outline:
          "bg-background hover:bg-accent hover:text-accent-foreground hover:shadow-[5px_5px_0_var(--foreground)] hover:translate-x-[-1px] hover:translate-y-[-1px]",
        secondary:
          "bg-secondary text-secondary-foreground hover:shadow-[5px_5px_0_var(--foreground)] hover:translate-x-[-1px] hover:translate-y-[-1px]",
        ghost:
          "border-transparent shadow-none hover:bg-accent hover:text-accent-foreground",
        link: "border-transparent shadow-none text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
