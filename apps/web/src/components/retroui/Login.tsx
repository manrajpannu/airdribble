import type { HTMLAttributes } from "react"

import { cn } from "@/lib/utils"

export function Login({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card max-w-md space-y-4 p-6", className)} {...props} />
}
