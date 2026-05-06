"use client";

import { useEffect, useState, useRef } from "react";
import { AppSettings, updateSettings } from "@/lib/settings-store";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function DeadzoneSettings({ settings }: { settings: AppSettings }) {
  const [input, setInput] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const updateInput = () => {
      const gamepads = navigator.getGamepads();
      const gp = gamepads[0];
      if (gp) {
        setInput({ x: gp.axes[0], y: gp.axes[1] });
      }
      rafRef.current = requestAnimationFrame(updateInput);
    };
    rafRef.current = requestAnimationFrame(updateInput);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleChange = (key: keyof AppSettings["deadzone"], value: any) => {
    updateSettings({
      deadzone: {
        ...settings.deadzone,
        [key]: value,
      },
    });
  };

  const deadzoneSize = settings.deadzone.size * 100;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70">Type</Label>
            <Select
              value={settings.deadzone.type}
              onValueChange={(v) => handleChange("type", v)}
            >
              <SelectTrigger className="h-8 bg-background/40 border-border/40 text-[11px] font-bold">
                <SelectValue placeholder="Shape" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cross">Cross</SelectItem>
                <SelectItem value="square">Square</SelectItem>
                <SelectItem value="circle">Circle</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70">Deadzone</Label>
              <span className="text-[10px] font-mono font-bold text-primary">{settings.deadzone.size.toFixed(2)}</span>
            </div>
            <Slider
              value={[settings.deadzone.size]}
              min={0}
              max={0.5}
              step={0.01}
              onValueChange={(v) => handleChange("size", v[0])}
              className="h-1.5"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70">Sensitivity</Label>
              <span className="text-[10px] font-mono font-bold text-primary">{settings.deadzone.sensitivity.toFixed(2)}</span>
            </div>
            <Slider
              value={[settings.deadzone.sensitivity]}
              min={0.0}
              max={5.0}
              step={0.01}
              onValueChange={(v) => handleChange("sensitivity", v[0])}
              className="h-1.5"
            />
          </div>
        </div>

        {/* Mini Visualizer */}
        <div className="relative aspect-square w-full max-w-[140px] mx-auto bg-black/40 rounded-2xl border border-border/30 flex items-center justify-center overflow-hidden group shadow-inner">
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-px bg-white/20" />
              <div className="h-full w-px bg-white/20" />
            </div>
            <div className="absolute inset-0 border border-white/5 rounded-full m-4" />
            <div className="absolute inset-0 border border-white/5 rounded-full m-8" />
          </div>

          {/* Deadzone Boundary Area */}
          <div
            className={cn(
              "border border-primary/40 bg-primary/10 transition-all duration-300 shadow-[0_0_20px_rgba(var(--primary),0.1)]",
              settings.deadzone.type === "circle" ? "rounded-full" : "rounded-sm"
            )}
            style={{
              width: `${deadzoneSize}%`,
              height: `${deadzoneSize}%`,
              ...(settings.deadzone.type === "cross" && {
                width: "100%",
                height: `${deadzoneSize}%`,
                borderWidth: "1px 0",
              })
            }}
          >
            {settings.deadzone.type === "cross" && (
              <div
                className="absolute inset-0 border-x border-primary/40"
                style={{
                  width: `${deadzoneSize}%`,
                  left: `${50 - deadzoneSize / 2}%`,
                  borderWidth: "0 1px",
                }}
              />
            )}
          </div>

          {/* Current Input Marker */}
          <div
            className="absolute size-2.5 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)] z-20 border border-white/20 transition-transform duration-75"
            style={{
              transform: `translate(${input.x * 60}px, ${input.y * 60}px)`
            }}
          />

          {/* Origin Point */}
          <div className="size-1 bg-primary/40 rounded-full z-10" />

          <div className="absolute bottom-2 inset-x-0 text-center">
            <span className="text-[7px] font-black text-white/30 uppercase tracking-[0.3em]">Precision Hub</span>
          </div>
        </div>
      </div>
    </div>
  );
}
