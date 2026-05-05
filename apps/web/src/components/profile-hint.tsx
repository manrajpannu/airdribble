"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ProfileHintProps {
  /** Unique key stored in localStorage to remember dismissal */
  id: string;
  /** The hint text shown in the bubble */
  label: string;
  /** Which side the arrow points from */
  side?: "left" | "right" | "bottom" | "top";
  /** Extra classes on the wrapper */
  className?: string;
  /** Whether the parent element was interacted with */
  dismissed: boolean;
  /** How long to wait before showing the hint (ms). Default: 600 */
  delayMs?: number;
}

export function ProfileHint({
  id,
  label,
  side = "bottom",
  className,
  dismissed,
  delayMs = 600,
}: ProfileHintProps) {
  const [visible, setVisible] = useState(false);

  // On mount, check if this hint has been dismissed before
  useEffect(() => {
    const stored = localStorage.getItem(`hint_dismissed_${id}`);
    if (!stored) {
      // Small delay so the page has settled before the hint pops in
      const t = setTimeout(() => setVisible(true), delayMs);
      return () => clearTimeout(t);
    }
  }, [id]);

  // When the parent element is interacted with, dismiss permanently
  useEffect(() => {
    if (dismissed && visible) {
      setVisible(false);
      localStorage.setItem(`hint_dismissed_${id}`, "1");
    }
  }, [dismissed, visible, id]);

  if (!visible) return null;

  const arrowClasses: Record<string, string> = {
    bottom: "top-full left-1/2 -translate-x-1/2 mt-0.5 border-t-[6px] border-t-foreground/80 border-x-[5px] border-x-transparent border-b-0",
    top:    "bottom-full left-1/2 -translate-x-1/2 mb-0.5 border-b-[6px] border-b-foreground/80 border-x-[5px] border-x-transparent border-t-0",
    left:   "right-full top-1/2 -translate-y-1/2 mr-0.5 border-r-[6px] border-r-foreground/80 border-y-[5px] border-y-transparent border-l-0",
    right:  "left-full top-1/2 -translate-y-1/2 ml-0.5 border-l-[6px] border-l-foreground/80 border-y-[5px] border-y-transparent border-r-0",
  };

  const containerClasses: Record<string, string> = {
    bottom: "flex-col items-center",
    top:    "flex-col-reverse items-center",
    left:   "flex-row items-center",
    right:  "flex-row-reverse items-center",
  };

  return (
    <span
      className={cn(
        "pointer-events-none absolute z-50 flex",
        containerClasses[side],
        "animate-in fade-in slide-in-from-bottom-2 duration-500",
        className
      )}
    >
      {/* Bubble */}
      <span className="whitespace-nowrap rounded-full bg-foreground/85 px-3 py-1 text-[11px] font-semibold tracking-wide text-background shadow-lg backdrop-blur-sm">
        {label}
      </span>
      {/* Arrow */}
      <span className={cn("absolute w-0 h-0", arrowClasses[side])} />
    </span>
  );
}
