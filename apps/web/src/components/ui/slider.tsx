"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn("relative flex w-full touch-none select-none items-center py-1.5", className)}>
        <div className="h-1.5 w-full grow overflow-hidden rounded-full bg-black/20 dark:bg-white/15 backdrop-blur-sm ring-1 ring-black/10 dark:ring-white/10" />
      </div>
    );
  }

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center py-1.5",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-black/20 dark:bg-white/15 backdrop-blur-sm ring-1 ring-black/10 dark:ring-white/10">
        <SliderPrimitive.Range className="absolute h-full bg-primary/90 shadow-[0_0_12px_rgba(var(--primary),0.6)]" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block size-4 rounded-full border-2 border-white/60 bg-white/100 dark:bg-white/30 backdrop-blur-xl shadow-[0_2px_8px_rgba(0,0,0,0.4)] transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:pointer-events-none disabled:opacity-50 hover:scale-110 active:scale-95" />
    </SliderPrimitive.Root>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
