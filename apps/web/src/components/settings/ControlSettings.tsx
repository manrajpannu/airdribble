"use client";

import { useState, useEffect } from "react";
import { AppSettings, updateSettings, ControlBinding } from "@/lib/settings-store";
import { cn } from "@/lib/utils";
import { RotateCcw, Keyboard as KeyboardIcon, Gamepad as GamepadIcon, MousePointer2, X } from "lucide-react";

type BindingSlot = "primary" | "secondary";
type BindingTarget = { action: keyof AppSettings["controls"]; slot: BindingSlot } | null;

export function ControlSettings({ settings }: { settings: AppSettings }) {
  const [bindingTarget, setBindingTarget] = useState<BindingTarget>(null);

  useEffect(() => {
    if (!bindingTarget) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      updateBinding(bindingTarget.action, bindingTarget.slot, { key: e.key });
      setBindingTarget(null);
    };

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      updateBinding(bindingTarget.action, bindingTarget.slot, { mouse: e.button });
      setBindingTarget(null);
    };

    const pollGamepad = () => {
      const gamepads = navigator.getGamepads();
      const gp = gamepads[0];
      if (gp) {
        gp.buttons.forEach((btn, index) => {
          if (btn.pressed) {
            updateBinding(bindingTarget.action, bindingTarget.slot, { button: index });
            setBindingTarget(null);
          }
        });
      }
      if (bindingTarget) requestAnimationFrame(pollGamepad);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("contextmenu", (e) => e.preventDefault());
    const rafId = requestAnimationFrame(pollGamepad);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleMouseDown);
      cancelAnimationFrame(rafId);
    };
  }, [bindingTarget]);

  const updateBinding = (action: keyof AppSettings["controls"], slot: BindingSlot, input: { key?: string; mouse?: number; button?: number }) => {
    const newControls = { ...settings.controls };
    const key = slot === "primary" ? "key" : "key2";
    const mouse = slot === "primary" ? "mouse" : "mouse2";
    const button = slot === "primary" ? "button" : "button2";

    const altKey = slot === "primary" ? "key2" : "key";
    const altMouse = slot === "primary" ? "mouse2" : "mouse";
    const altButton = slot === "primary" ? "button2" : "button";

    Object.keys(newControls).forEach((k) => {
      const act = k as keyof AppSettings["controls"];
      const binding = { ...newControls[act] };

      if (input.key) {
        if (binding.key === input.key) binding.key = undefined;
        if (binding.key2 === input.key) binding.key2 = undefined;
      }
      if (input.mouse !== undefined) {
        if (binding.mouse === input.mouse) binding.mouse = undefined;
        if (binding.mouse2 === input.mouse) binding.mouse2 = undefined;
      }
      if (input.button !== undefined) {
        if (binding.button === input.button) binding.button = undefined;
        if (binding.button2 === input.button) binding.button2 = undefined;
      }
      newControls[act] = binding;
    });

    const targetBinding = { ...newControls[action] };
    targetBinding[key] = input.key;
    targetBinding[mouse] = input.mouse;
    targetBinding[button] = input.button;

    if (input.key && targetBinding[altKey] === input.key) targetBinding[altKey] = undefined;
    if (input.mouse !== undefined && targetBinding[altMouse] === input.mouse) targetBinding[altMouse] = undefined;
    if (input.button !== undefined && targetBinding[altButton] === input.button) targetBinding[altButton] = undefined;

    newControls[action] = targetBinding;
    updateSettings({ controls: newControls });
  };

  const resetControls = () => {
    updateSettings({
      controls: {
        yawLeft: { key: "a" },
        yawRight: { key: "d" },
        pitchUp: { key: "s" },
        pitchDown: { key: "w" },
        airRollLeft: { key: "q", button: 4 },
        airRollRight: { key: "e", button: 5 },
        freeAirRoll: { key: "Shift", button: 2 },
        boost: { key: " ", button: 1 },
      },
    });
  };

  const actions: { id: keyof AppSettings["controls"]; label: string }[] = [
    { id: "boost", label: "Boost" },
    { id: "pitchUp", label: "Pitch Up" },
    { id: "pitchDown", label: "Pitch Down" },
    { id: "yawLeft", label: "Yaw Left" },
    { id: "yawRight", label: "Yaw Right" },
    { id: "airRollLeft", label: "Air Roll Left" },
    { id: "airRollRight", label: "Air Roll Right" },
    { id: "freeAirRoll", label: "Free Air Roll" },
  ];

  const getBindingDisplay = (binding: ControlBinding, slot: BindingSlot) => {
    const key = slot === "primary" ? binding.key : binding.key2;
    const mouse = slot === "primary" ? binding.mouse : binding.mouse2;
    const button = slot === "primary" ? binding.button : binding.button2;

    if (key) return { icon: <KeyboardIcon className="size-2.5 opacity-60" />, text: key === " " ? "SPC" : key };
    if (mouse !== undefined) {
      const mouseLabels = ["LMB", "MMB", "RMB", "M4", "M5"];
      return { icon: <MousePointer2 className="size-2.5 opacity-60" />, text: mouseLabels[mouse] || `M${mouse}` };
    }
    if (button !== undefined) return { icon: <GamepadIcon className="size-2.5 opacity-60" />, text: `B${button}` };
    return null;
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Keymap</h3>
        <button
          onClick={resetControls}
          className="text-[9px] font-bold text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors uppercase tracking-widest"
        >
          <RotateCcw className="size-2.5" />
          Reset
        </button>
      </div>

      <div className="grid gap-1.5">
        {actions.map((action) => (
          <div
            key={action.id}
            className="group flex items-center justify-between p-2.5 bg-background/20 rounded-xl border border-border/40 hover:border-primary/30 transition-all duration-300"
          >
            <span className="text-xs font-bold text-foreground/80 tracking-tight">{action.label}</span>

            <div className="flex gap-1.5">
              {(["primary", "secondary"] as const).map((slot) => {
                const display = getBindingDisplay(settings.controls[action.id], slot);
                const isTarget = bindingTarget?.action === action.id && bindingTarget?.slot === slot;

                return (
                  <button
                    key={slot}
                    onClick={() => setBindingTarget({ action: action.id, slot })}
                    className={cn(
                      "min-w-[65px] h-8 px-2 rounded-lg border flex items-center justify-center gap-1.5 transition-all duration-300",
                      isTarget
                        ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                        : "bg-background/40 border-border/50 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    )}
                  >
                    {isTarget ? (
                      <span className="text-[8px] font-black animate-pulse uppercase">...</span>
                    ) : display ? (
                      <>
                        {display.icon}
                        <span className="text-[9px] font-mono font-bold uppercase truncate max-w-[35px]">
                          {display.text}
                        </span>
                      </>
                    ) : (
                      <span className="text-[8px] font-bold opacity-30">EMPTY</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {bindingTarget && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="relative bg-card/80 border border-primary/20 p-8 rounded-4xl shadow-2xl text-center max-w-sm w-full animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setBindingTarget(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary/50 text-muted-foreground transition-colors"
            >
              <X className="size-4" />
            </button>

            <div className="flex flex-col items-center gap-6">
              <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 animate-bounce shadow-[0_0_30px_rgba(var(--primary),0.1)]">
                <KeyboardIcon className="size-8 text-primary" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold tracking-tight">
                  {bindingTarget.slot === "primary" ? "Primary" : "Secondary"} Binding
                </h2>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
                  Press any key, mouse button, or controller button for <span className="text-primary font-bold">{actions.find(a => a.id === bindingTarget.action)?.label}</span>
                </p>
              </div>

              <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-[shimmer_2s_infinite] w-1/3" />
              </div>

              <button
                onClick={() => setBindingTarget(null)}
                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
