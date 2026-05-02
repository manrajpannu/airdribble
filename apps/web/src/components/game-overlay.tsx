"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface GameOverlayProps {
  isPaused: boolean;
  countdownValue: number | null;
  scenarioTitle: string;
  scenarioDescription: string;
  bestScore: number;
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onExit: () => void;
}

export default function GameOverlay({
  isPaused,
  countdownValue,
  scenarioTitle,
  scenarioDescription,
  bestScore,
  onResume,
  onRestart,
  onOpenSettings,
  onExit,
}: GameOverlayProps) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDarkMode(document.documentElement.classList.contains("dark"));

    const observer = new MutationObserver(() => {
      setDarkMode(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  if (countdownValue !== null) {
    return (
      <div className="pointer-events-none absolute inset-0 z-[13000] flex items-center justify-center">
        <div
          key={countdownValue}
          className="text-[18rem] font-black text-white leading-none animate-in zoom-in-150 fade-out duration-800 ease-out fill-mode-forwards tracking-tighter"
        >
          {countdownValue > 0 ? countdownValue : "GO"}
        </div>
      </div>
    );
  }
  if (isPaused) {
    return (
      <div className="pointer-events-auto absolute inset-0 z-[12000] backdrop-blur-2xl bg-black/10 flex flex-col items-center justify-center animate-in fade-in duration-500">
        {/* Decorative Gradients */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-black/60 to-transparent opacity-40" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/60 to-transparent opacity-40" />

        {/* Top-Left: Scenario Info */}
        <div className="absolute left-6 top-4 z-10 space-y-1 animate-in slide-in-from-top-4 duration-500">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 backdrop-blur-md mb-2">
            Session Paused
          </Badge>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase">{scenarioTitle}</h1>
          <p className="text-white/60 font-medium max-w-md line-clamp-2">{scenarioDescription}</p>
          {bestScore > 0 && (
            <div className="flex items-center gap-4 mt-1 border-t border-white/5">
              <div className="text-sm font-bold uppercase tracking-[0.2em] text-white/60">Personal Best</div>
              <div className="text-xl font-mono font-bold text-white tracking-widest">{bestScore}</div>
            </div>
          )}
        </div>

        {/* Center: Main Menu */}
        <div className="relative z-10 w-full flex flex-col items-center animate-in zoom-in-95 duration-500">
          <div className="mb-12 text-center w-full px-4">
            <h2 className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/10 tracking-tight leading-none select-none whitespace-nowrap">
              PAUSED
            </h2>
          </div>

          <div className="grid gap-4 w-full max-w-[360px]">
            <Button
              onClick={onResume}
              className="group relative w-full h-16 rounded-[12px] bg-white text-black font-bold uppercase tracking-[0.2em] hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 shadow-2xl"
            >
              Resume
            </Button>
            <Button
              variant="outline"
              onClick={onRestart}
              className="w-full h-16 rounded-[12px] bg-white/[0.06] border border-white/[0.12] backdrop-blur-3xl text-white font-bold uppercase tracking-[0.2em] hover:bg-white/[0.12] hover:border-white/[0.2] hover:scale-[1.02] active:scale-[0.98] transition-all duration-500"
            >
              Restart
            </Button>
            <Button
              variant="outline"
              onClick={onOpenSettings}
              className="w-full h-16 rounded-[12px] bg-white/[0.06] border border-white/[0.12] backdrop-blur-3xl text-white font-bold uppercase tracking-[0.2em] hover:bg-white/[0.12] hover:border-white/[0.2] hover:scale-[1.02] active:scale-[0.98] transition-all duration-500"
            >
              Settings
            </Button>
            <Button
              variant="outline"
              onClick={onExit}
              className="w-full h-16 rounded-[12px] bg-white/[0.06] border border-white/[0.12] backdrop-blur-3xl text-white font-bold uppercase tracking-[0.2em] hover:text-white hover:bg-red-500/10 hover:border-red-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-500"
            >
              Exit Training
            </Button>
          </div>
        </div>

        {/* Bottom-Left: Branding */}
        <div className="absolute bottom-4 left-6 z-10 flex items-center gap-2 select-none">
          <div className="relative h-16 w-64">
            <Image
              src={"/icons/logo-white-fill.png"}
              alt="airdribble logo"
              fill
              sizes="256px"
              className="object-contain object-left"
              priority
            />
          </div>
        </div>

        {/* Bottom-Right: Shortcuts (Horizontal Stacked) */}
        <div className="absolute bottom-4 right-6 z-10 flex flex-row items-center gap-8 opacity-80 animate-in slide-in-from-bottom-4 duration-500 select-none">
          <div className="flex items-center gap-3">
            <kbd className="bg-white/10 rounded-lg px-2.5 py-1 text-sm  font-bold text-white border border-white/20 min-w-[36px] text-center shadow-lg">F11</kbd>
            <span className="text-sm font-bold uppercase tracking-[0.3em] text-white/50">Fullscreen</span>
          </div>
          <div className="flex items-center gap-3">
            <kbd className="bg-white/10 rounded-lg px-2.5 py-1 text-sm  font-bold text-white border border-white/20 min-w-[36px] text-center shadow-lg">R</kbd>
            <span className="text-sm  font-bold uppercase tracking-[0.3em] text-white/50">Restart</span>
          </div>
          <div className="flex items-center gap-3">
            <kbd className="bg-white/10 rounded-lg px-2.5 py-1 text-sm  font-bold text-white border border-white/20 min-w-[36px] text-center shadow-lg">ESC</kbd>
            <span className="text-sm  font-bold uppercase tracking-[0.3em] text-white/50">Resume</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
