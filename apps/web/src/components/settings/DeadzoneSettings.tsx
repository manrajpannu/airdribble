"use client";

import { useEffect, useState, useRef } from "react";
import { AppSettings, updateSettings } from "@/lib/settings-store";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function DeadzoneSettings({ settings }: { settings: AppSettings }) {
  const [rawInput, setRawInput] = useState({ x: 0, y: 0 });
  const [processedInput, setProcessedInput] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const updateInput = () => {
      const gamepads = navigator.getGamepads();
      const gp = gamepads[0];
      if (gp) {
        const rx = gp.axes[0];
        const ry = gp.axes[1];
        setRawInput({ x: rx, y: ry });

        // Calculate Processed Input
        let px = 0;
        let py = 0;
        const dz = settings.deadzone.size;
        const sens = settings.deadzone.sensitivity;

        if (settings.deadzone.type === "circle") {
          const mag = Math.sqrt(rx * rx + ry * ry);
          if (mag > dz) {
            const normalizedMag = Math.min(1, (mag - dz) / (1 - dz));
            const finalMag = normalizedMag * sens;
            px = (rx / mag) * finalMag;
            py = (ry / mag) * finalMag;
          }
        } else if (settings.deadzone.type === "square") {
          if (Math.abs(rx) > dz || Math.abs(ry) > dz) {
            px = rx * sens;
            py = ry * sens;
          }
        } else if (settings.deadzone.type === "cross") {
          if (Math.abs(rx) > dz) px = rx * sens;
          if (Math.abs(ry) > dz) py = ry * sens;
        }

        // Clamp to [-1, 1]
        setProcessedInput({
          x: Math.max(-1, Math.min(1, px)),
          y: Math.max(-1, Math.min(1, py))
        });
      }
      rafRef.current = requestAnimationFrame(updateInput);
    };
    rafRef.current = requestAnimationFrame(updateInput);
    return () => cancelAnimationFrame(rafRef.current);
  }, [settings.deadzone]);

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
              min={1.0}
              max={10.0}
              step={0.1}
              onValueChange={(v) => handleChange("sensitivity", v[0])}
              className="h-1.5"
            />
          </div>
        </div>

        {/* Mini Visualizer */}
        <div className="relative aspect-square w-full  mx-auto rounded-2xl border flex items-center justify-center overflow-hidden group ">
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
              "border border-primary/40 transition-all duration-100",
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

          {/* Raw Input Marker (Ghost) */}
          <div
            className="absolute size-1.5 bg-red-500/20 rounded-full z-10 transition-transform duration-75"
            style={{
              transform: `translate(${rawInput.x * 60}px, ${rawInput.y * 60}px)`
            }}
          />

          {/* Processed Input Marker (Active) */}
          <div
            className="absolute size-2.5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.8)] z-20 border border-white/20 transition-transform duration-75"
            style={{
              transform: `translate(${processedInput.x * 60}px, ${processedInput.y * 60}px)`
            }}
          />

          {/* Origin Point */}
          {/* <div className="size-1 bg-primary/40 rounded-full z-10" /> */}

          {/* <div className="absolute bottom-2 inset-x-0 text-center">
            <span className="text-[7px] font-black text-white/30 uppercase tracking-[0.3em]">Precision Hub</span>
          </div> */}
        </div>
      </div>
    </div>
  );
}
