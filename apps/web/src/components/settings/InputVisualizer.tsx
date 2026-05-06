"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Keyboard, Gamepad as GamepadIcon, Wifi, WifiOff } from "lucide-react";

export function InputVisualizer() {
  const [keysDown, setKeysDown] = useState<Set<string>>(new Set());
  const [gamepadState, setGamepadState] = useState<{
    connected: boolean;
    buttons: boolean[];
    axes: number[];
  }>({
    connected: false,
    buttons: Array(16).fill(false),
    axes: [0, 0, 0, 0],
  });

  const rafRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeysDown((prev) => new Set(prev).add(e.key.toLowerCase()));
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      setKeysDown((prev) => {
        const next = new Set(prev);
        next.delete(e.key.toLowerCase());
        return next;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const updateGamepad = () => {
      const gamepads = navigator.getGamepads();
      const primary = gamepads[0];

      if (primary) {
        setGamepadState({
          connected: true,
          buttons: primary.buttons.map((b) => b.pressed),
          axes: [...primary.axes],
        });
      } else {
        setGamepadState((prev) => (prev.connected ? { ...prev, connected: false } : prev));
      }
      rafRef.current = requestAnimationFrame(updateGamepad);
    };

    rafRef.current = requestAnimationFrame(updateGamepad);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 overflow-hidden">
      {/* Keyboard Visualizer */}
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <div className="flex items-center gap-1.5 px-1">
          <Keyboard className="text-primary size-3" />
          <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Keys</span>
        </div>

        <div className="grid gap-1 select-none">
          <div className="flex gap-1 justify-center">
            <Key label="W" pressed={keysDown.has("w")} />
          </div>
          <div className="flex gap-1 justify-center">
            <Key label="A" pressed={keysDown.has("a")} />
            <Key label="S" pressed={keysDown.has("s")} />
            <Key label="D" pressed={keysDown.has("d")} />
          </div>
          <div className="flex gap-1 justify-center">
            <Key label="Sft" pressed={keysDown.has("shift")} className="w-8" />
            <Key label="Space" pressed={keysDown.has(" ")} className="w-20" />
            <Key label="Q" pressed={keysDown.has("q")} />
            <Key label="E" pressed={keysDown.has("e")} />
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="hidden sm:block w-px h-12 bg-border/20" />

      {/* Controller Visualizer */}
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <GamepadIcon className="text-primary size-3" />
            <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Controller</span>
          </div>
          <div className={cn(
            "size-1.5 rounded-full",
            gamepadState.connected ? "bg-green-500 animate-pulse" : "bg-red-500/50"
          )} />
        </div>

        <div className="h-14 flex items-center justify-center">
          {!gamepadState.connected ? (
            <span className="text-[8px] text-muted-foreground uppercase tracking-tighter opacity-40 italic">Waiting...</span>
          ) : (
            <div className="flex items-center gap-6">
              {/* Face Buttons */}
              <div className="grid grid-cols-3 gap-0.5">
                <div />
                <ControllerButton label="Y" pressed={gamepadState.buttons[3]} />
                <div />
                <ControllerButton label="X" pressed={gamepadState.buttons[2]} />
                <div />
                <ControllerButton label="B" pressed={gamepadState.buttons[1]} />
                <div />
                <ControllerButton label="A" pressed={gamepadState.buttons[0]} />
                <div />
              </div>

              {/* Joysticks */}
              <div className="flex gap-3">
                <Joystick x={gamepadState.axes[0]} y={gamepadState.axes[1]} />
                <Joystick x={gamepadState.axes[2]} y={gamepadState.axes[3]} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Key({ label, pressed, className }: { label: string; pressed: boolean; className?: string }) {
  return (
    <div className={cn(
      "h-6 min-w-[1.5rem] px-1 flex items-center justify-center rounded border text-[8px] font-bold transition-all duration-75 uppercase",
      pressed 
        ? "bg-primary text-primary-foreground border-primary scale-95 shadow-[0_0_8px_rgba(var(--primary),0.4)]" 
        : "bg-background/40 border-border/40 text-muted-foreground"
      , className
    )}>
      {label}
    </div>
  );
}

function ControllerButton({ label, pressed }: { label: string; pressed: boolean }) {
  return (
    <div className={cn(
      "size-5 flex items-center justify-center rounded-full border text-[7px] font-bold transition-all duration-75",
      pressed 
        ? "bg-primary text-primary-foreground border-primary scale-90" 
        : "bg-background/40 border-border/40 text-muted-foreground"
    )}>
      {label}
    </div>
  );
}

function Joystick({ x, y }: { x: number; y: number }) {
  return (
    <div className="relative size-8 bg-background/40 border border-border/40 rounded-full flex items-center justify-center">
      <div 
        className="size-3 bg-primary/80 rounded-full shadow-sm transition-transform duration-75"
        style={{
          transform: `translate(${x * 8}px, ${y * 8}px)`
        }}
      />
    </div>
  );
}
