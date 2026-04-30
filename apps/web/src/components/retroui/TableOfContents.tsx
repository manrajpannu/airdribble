import type { HTMLAttributes } from "react"

import { cn } from "@/lib/utils"

export function TableOfContents({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <nav className={cn("card space-y-2 p-4 text-sm", className)} {...props} />
}
