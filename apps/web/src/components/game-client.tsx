"use client";

import { useEffect, useRef, memo } from "react";
import { useAppSettings } from "@/lib/settings-store";

type RuntimeHandle = {
  dispose?: () => void;
};

type GameClientProps = {
  fullscreen?: boolean;
  onModeStateChange?: (state: any) => void;
  challengeConfig?: any;
  darkMode?: boolean;
  modeName?: string;
};

export const GameClient = memo(({
  fullscreen = false,
  onModeStateChange,
  challengeConfig,
  darkMode = false,
  modeName = "Challenge",
}: GameClientProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<any>(null);
  const settings = useAppSettings();

  const darkModeRef = useRef(darkMode);
  darkModeRef.current = darkMode;

  // Sync dark mode changes to the engine reactively
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setDarkMode(darkMode);
    }
  }, [darkMode]);

  // Sync settings reactively
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.applySettings(settings);
    }
  }, [settings]);

  useEffect(() => {
    let cancelled = false;
    let handle: any = null;

    const mount = async () => {
      if (!containerRef.current) return;

      const currentDarkMode = document.documentElement.classList.contains("dark");

      const { initRlDartApp } = await import("../../../../src/main.js");
      const runtime = initRlDartApp(containerRef.current, {
        modeName,
        challengeConfig,
        darkMode: currentDarkMode,
        appSettings: settings,
        onModeStateChange: (state: any) => {
          if (!cancelled && onModeStateChange) {
            onModeStateChange(state);
          }
        },
      });

      if (cancelled) {
        runtime.dispose?.();
        return;
      }

      handle = runtime;
      engineRef.current = runtime.engine;
      engineRef.current.setDarkMode(darkModeRef.current);
      engineRef.current.applySettings(settings);
    };

    mount();

    return () => {
      cancelled = true;
      handle?.dispose?.();
      engineRef.current = null;
    };
  }, [onModeStateChange, modeName]);

  // Hot-reload config changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setModeByName(modeName, challengeConfig);
    }
  }, [challengeConfig, modeName]);

  return (
    <div
      className={
        fullscreen
          ? "relative h-full w-full overflow-hidden"
          : "relative h-[calc(100vh-4.5rem)] min-h-[560px] w-full overflow-hidden rounded-lg"
      }
    >
      <div className="h-full w-full" id="three-container" ref={containerRef} />
    </div>
  );
});

export default GameClient;
