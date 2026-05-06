"use client";

import { AppSettings, updateSettings } from "@/lib/settings-store";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const CARS = [
  { id: "octane", name: "Octane" },
  { id: "fennec", name: "Fennec" },
  { id: "dominus", name: "Dominus" },
] as const;

export function CarSettings({ settings }: { settings: AppSettings }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {CARS.map((car) => (
        <button
          key={car.id}
          onClick={() => updateSettings({ carBody: car.id })}
          className={cn(
            "relative group flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 overflow-hidden",
            settings.carBody === car.id
              ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(var(--primary),0.2)]"
              : "border-border bg-card hover:border-primary/50 hover:bg-primary/5"
          )}
        >
          {settings.carBody === car.id && (
            <div className="absolute top-2 right-2 size-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg z-10">
              <Check className="size-4" />
            </div>
          )}

          <span className={cn(
            "text-lg font-bold tracking-tight uppercase",
            settings.carBody === car.id ? "text-primary" : "text-muted-foreground"
          )}>
            {car.name}
          </span>

          <div className={cn(
            "absolute bottom-0 left-0 h-1 bg-primary transition-all duration-500",
            settings.carBody === car.id ? "w-full" : "w-0"
          )} />
        </button>
      ))}
    </div>
  );
}
