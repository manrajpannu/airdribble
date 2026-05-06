"use client";

import { useAppSettings, updateSettings } from "@/lib/settings-store";
import { CarSettings } from "@/components/settings/CarSettings";
import { CameraSettings } from "@/components/settings/CameraSettings";
import { DeadzoneSettings } from "@/components/settings/DeadzoneSettings";
import { ControlSettings } from "@/components/settings/ControlSettings";
import { InputVisualizer } from "@/components/settings/InputVisualizer";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Car, Gamepad2, Volume2, Monitor } from "lucide-react";

export function SettingsDashboard() {
  const settings = useAppSettings();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Input Status Bar */}
      <div className="bg-card/30 backdrop-blur-md rounded-xl border border-border/50 p-1">
        <InputVisualizer />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Performance & Aesthetics */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1 opacity-80">
              <Car className="size-3.5 text-primary" />
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em]">Vehicle Config</h2>
            </div>

            <div className="bg-card/40 rounded-xl border border-border/40 p-4 space-y-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase">Car Body</Label>
                <CarSettings settings={settings} />
              </div>

              <div className="pt-4 border-t border-border/10">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase block mb-4">View parameters</Label>
                <CameraSettings settings={settings} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1 opacity-80">
              <Volume2 className="size-3.5 text-primary" />
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em]">Audio & System</h2>
            </div>
            <div className="bg-card/40 rounded-xl border border-border/40 p-4 space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Master Volume</Label>
                  <span className="text-[10px] font-mono text-primary font-bold">{settings.masterVolume}%</span>
                </div>
                <Slider
                  value={[settings.masterVolume]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(v) => updateSettings({ masterVolume: v[0] })}
                  className="h-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex items-center justify-between px-3 py-2 bg-background/20 rounded-lg border border-border/20">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">HUD</span>
                  <Switch
                    className="scale-75"
                    checked={settings.showHud}
                    onCheckedChange={(checked) => updateSettings({ showHud: checked })}
                  />
                </div>
                <div className="flex items-center justify-between px-3 py-2 bg-background/20 rounded-lg border border-border/20">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">TRAIL</span>
                  <Switch
                    className="scale-75"
                    checked={settings.deadzoneTrail}
                    onCheckedChange={(checked) => updateSettings({ deadzoneTrail: checked })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Input & Precision */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1 opacity-80">
              <Gamepad2 className="size-3.5 text-primary" />
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em]">Input Mapping</h2>
            </div>
            <div className="bg-card/40 rounded-xl border border-border/40 p-4">
              <ControlSettings settings={settings} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1 opacity-80">
              <Monitor className="size-3.5 text-primary" />
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em]">Precision Engine</h2>
            </div>
            <div className="bg-card/40 rounded-xl border border-border/40 p-4">
              <DeadzoneSettings settings={settings} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
