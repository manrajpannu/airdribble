"use client";

import { X, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SettingsDashboard } from "./SettingsDashboard";

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-13000 flex items-center justify-center bg-background/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div
        className="relative w-full max-w-5xl max-h-[90vh] bg-card/95 border border-primary/20 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-border/10 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
              <Settings2 className="size-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">System Settings</h2>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">In-Game Configuration</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-primary/10 hover:text-primary transition-all"
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-4xl mx-auto pb-8">
            <SettingsDashboard />
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-border/10 bg-muted/20 flex justify-end items-center gap-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mr-auto">
            Changes are applied in real-time
          </p>
          <Button
            onClick={onClose}
            className="rounded-xl px-8 font-bold uppercase tracking-widest text-[11px]"
          >
            Return to Game
          </Button>
        </div>
      </div>
    </div>
  );
}
