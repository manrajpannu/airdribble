"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { InteractiveBalls } from "./interactive-balls";

export function WebGLHeroBanner() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setDarkMode(document.documentElement.classList.contains("dark"));

    const observer = new MutationObserver(() => {
      setDarkMode(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <InteractiveBalls opacity={0.6} blur="26px" />

      <div className="relative w-full py-24 px-4 flex flex-col items-center justify-center text-center pointer-events-none select-none">
        <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out fill-mode-forwards">
          <div className="relative z-10 translate-y-2 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-md">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 dark:text-white/40">Directional Air Lab v2.0</span>
          </div>
          <div className="flex justify-center items-center mt-0 mb-8 w-full px-4 pointer-events-auto">
            <Image
              src={darkMode ? "/icons/logo-white.png" : "/icons/logo-black.png"}
              alt="airdribble logo"
              width={1000}
              height={300}
              className="w-full max-w-[850px] h-auto object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] dark:drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]"
              priority
            />
          </div>

          <div className="h-px w-24 bg-linear-to-r from-transparent via-black/10 dark:via-white/20 to-transparent mx-auto mb-2 -mt-4" />

          <p className="max-w-xl mx-auto text-sm md:text-base text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed mb-8">
            The next generation of high-fidelity target practice.
            <br />
            <span className="text-zinc-800 dark:text-zinc-200">Interact with the environment to begin.</span>
          </p>
        </div>
      </div>
    </>
  );
}
