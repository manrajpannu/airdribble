"use client";

import { Settings2 } from "lucide-react";
import { SettingsDashboard } from "@/components/settings/SettingsDashboard";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl w-full py-8 px-4 space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-primary/5 rounded-lg border border-primary/10">
            <Settings2 className="size-4 text-primary" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Settings</h1>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md border border-border/50">
          <div className="size-1.5 bg-green-500 rounded-full animate-pulse" />
          SYSTEM LIVE
        </div>
      </div>

      <SettingsDashboard />
    </div>
  );
}
