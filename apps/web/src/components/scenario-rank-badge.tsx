"use client";

import { cn } from "@/lib/utils";
import { getScenarioRank, ScenarioRankInfo } from "@/lib/scenario-ranks";

interface ScenarioRankBadgeProps {
  percentile: number;
  className?: string;
  showName?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export function ScenarioRankBadge({
  percentile,
  className,
  showName = true,
  size = "md"
}: ScenarioRankBadgeProps) {
  const rank = getScenarioRank(percentile);

  const sizeClasses = {
    sm: "text-[9px] px-1.5 py-0.5",
    md: "text-[10px] px-2 py-0.5",
    lg: "text-xs px-3 py-1",
    xl: "text-[14px] px-4 py-1",
  };

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div
        className={cn(
          "font-black uppercase tracking-tighter rounded-sm shadow-sm flex items-center justify-center text-white",
          sizeClasses[size]
        )}
        style={{ background: rank.bg }}
      >
        {rank.name}
      </div>
      {showName && size !== "sm" && (
        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
          {percentile.toFixed(1)}%
        </span>
      )}
    </div>
  );
}
