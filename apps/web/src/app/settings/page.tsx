"use client";

import { useAppSettings, updateSettings } from "@/lib/settings-store";

export default function SettingsPage() {
  const settings = useAppSettings();

  return (
    <section className="space-y-4">
      <div className="retro-card-gradient-a border-2 border-border p-5 shadow-[var(--shadow-sm)]">
        <h2 className="text-xl font-semibold text-foreground">Settings</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Global app settings are persisted in localStorage and restored on reload.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="retro-card-gradient-b space-y-4 border-2 border-border p-4 shadow-[var(--shadow-xs)]">
          <p className="text-sm font-medium text-foreground">Gameplay</p>

          <label className="flex items-center justify-between text-sm">
            <span>Show HUD</span>
            <input
              type="checkbox"
              checked={settings.showHud}
              onChange={(e) => updateSettings({ showHud: e.target.checked })}
              className="size-4 accent-primary"
            />
          </label>

          <label className="flex items-center justify-between text-sm">
            <span>Deadzone Trail</span>
            <input
              type="checkbox"
              checked={settings.deadzoneTrail}
              onChange={(e) => updateSettings({ deadzoneTrail: e.target.checked })}
              className="size-4 accent-primary"
            />
          </label>
        </div>

        <div className="retro-card-gradient-c space-y-4 border-2 border-border p-4 shadow-[var(--shadow-xs)]">
          <p className="text-sm font-medium text-foreground">Audio</p>

          <label className="grid gap-2 text-sm">
            <span>Master Volume: {settings.masterVolume}%</span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={settings.masterVolume}
              onChange={(e) => updateSettings({ masterVolume: Number(e.target.value) })}
              className="accent-primary"
            />
          </label>
        </div>
      </div>
    </section>
  );
}
