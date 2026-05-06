"use client";

import { AppSettings, updateSettings } from "@/lib/settings-store";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export function CameraSettings({ settings }: { settings: AppSettings }) {
  const handleChange = (key: keyof AppSettings["camera"], value: number[]) => {
    updateSettings({
      camera: {
        ...settings.camera,
        [key]: value[0],
      },
    });
  };

  const parameters = [
    { id: "fov", label: "Field of View", min: 60, max: 110, step: 1, suffix: "°" },
    { id: "distance", label: "Distance", min: 1, max: 10, step: 0.1, suffix: "" },
    { id: "height", label: "Height", min: 1, max: 10, step: 1, suffix: "" },
  ] as const;

  return (
    <div className="grid gap-5">
      {parameters.map((param) => (
        <div key={param.id} className="group space-y-2.5">
          <div className="flex justify-between items-center">
            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70 group-hover:text-primary transition-colors">
              {param.label}
            </Label>
            <span className="text-[10px] font-mono font-bold text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
              {settings.camera[param.id as keyof AppSettings["camera"]]}{param.suffix}
            </span>
          </div>
          <Slider
            value={[settings.camera[param.id as keyof AppSettings["camera"]]]}
            min={param.min}
            max={param.max}
            step={param.step}
            onValueChange={(v) => handleChange(param.id as keyof AppSettings["camera"], v)}
            className="h-1.5"
          />
        </div>
      ))}
    </div>
  );
}
