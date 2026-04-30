import type { HTMLAttributes } from "react"

import { cn } from "@/lib/utils"

export function Empty({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card flex flex-col items-center justify-center gap-2 p-8 text-center", className)} {...props} />
}
