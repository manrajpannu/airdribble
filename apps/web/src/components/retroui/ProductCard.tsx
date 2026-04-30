import type { HTMLAttributes } from "react"

import { cn } from "@/lib/utils"

export function ProductCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card overflow-hidden bg-card text-card-foreground", className)} {...props} />
}
