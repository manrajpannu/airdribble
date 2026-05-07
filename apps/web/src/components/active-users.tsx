"use client";

import { useActiveCount } from "@/hooks/use-api";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

export function ActiveUsers() {
  const { data, isLoading } = useActiveCount();

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border backdrop-blur-sm shadow-sm transition-all hover:bg-muted">
      <div className="relative flex size-2 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500"></span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-bold tracking-tight">
          {isLoading ? "..." : (data?.active_users ?? 0)}
        </span>
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Active
        </span>
      </div>
    </div>
  );
}
