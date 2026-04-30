import type { HTMLAttributes } from "react"

import { cn } from "@/lib/utils"

export function BasicCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card bg-card text-card-foreground", className)} {...props} />
}
