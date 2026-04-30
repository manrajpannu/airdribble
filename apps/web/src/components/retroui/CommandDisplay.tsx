import type { HTMLAttributes } from "react"

import { cn } from "@/lib/utils"

export function CommandDisplay({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card bg-background font-mono text-sm", className)} {...props} />
}
