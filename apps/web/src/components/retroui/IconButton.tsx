import type { ButtonHTMLAttributes } from "react"

import { Button } from "@/components/retroui/Button"

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

export function IconButton(props: IconButtonProps) {
  return <Button {...props} size="icon" />
}
