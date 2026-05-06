"use client";

import { useState, useEffect } from "react";
import { Star, X, Heart } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "airdribble-star-modal-dismissed";
const USAGE_KEY = "airdribble-cumulative-usage";
const TRIGGER_THRESHOLD = 120; // 2 minutes in seconds

export function StarProjectModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(true);

  useEffect(() => {
    // Check if already dismissed
    if (typeof window === "undefined") return;
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) return;
    
    setHasDismissed(false);

    const timer = setInterval(() => {
      const usage = parseInt(localStorage.getItem(USAGE_KEY) || "0", 10);
      const newUsage = usage + 5;
      localStorage.setItem(USAGE_KEY, newUsage.toString());

      if (newUsage >= TRIGGER_THRESHOLD) {
        setIsOpen(true);
        clearInterval(timer);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const dismiss = (forever = true) => {
    setIsOpen(false);
    if (forever && typeof window !== "undefined") {
      localStorage.setItem(DISMISS_KEY, "true");
    }
  };

  if (hasDismissed || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-100000 flex items-center justify-center p-4 bg-background/40 backdrop-blur-md animate-in fade-in duration-500">
      <div 
        className="relative w-full max-w-md bg-card/90 border border-primary/20 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 size-48 bg-primary/20 blur-[80px] rounded-full animate-pulse" />
        <div className="absolute -bottom-24 -right-24 size-48 bg-primary/10 blur-[80px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />

        <button 
          onClick={() => dismiss(false)}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-secondary/50 text-muted-foreground transition-colors z-10"
        >
          <X className="size-4" />
        </button>

        <div className="relative p-10 flex flex-col items-center text-center gap-8">
          <div className="relative">
            <div className="p-5 bg-primary/10 rounded-[2rem] border border-primary/20 shadow-[0_0_40px_rgba(var(--primary),0.15)]">
              <Star className="size-10 text-primary fill-primary/20 animate-pulse" />
            </div>
            <div className="absolute -top-1 -right-1 size-6 bg-red-500 rounded-full flex items-center justify-center border-4 border-card">
              <Heart className="size-2.5 text-white fill-white" />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-black tracking-tight text-foreground uppercase italic">Enjoying the Project?</h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
              Airdribble is open-source and built for the community. If you like it, a star on <span className="text-foreground font-bold">GitHub</span> would mean the world to us!
            </p>
          </div>

          <div className="flex flex-col w-full gap-3">
            <a 
              href="https://github.com/manrajpannu/airdribble" 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={() => dismiss(true)}
              className={cn(
                buttonVariants({ variant: "default" }),
                "w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold uppercase tracking-widest text-[11px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(var(--primary),0.3)] flex items-center justify-center gap-2 border-none"
              )}
            >
              <Star className="size-4 fill-current" />
              Star on GitHub
            </a>
            
            <button 
              onClick={() => dismiss(true)}
              className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Maybe later
            </button>
          </div>
        </div>

        {/* Status indicator */}
        <div className="absolute bottom-0 inset-x-0 h-1 bg-linear-to-r from-transparent via-primary/20 to-transparent" />
      </div>
    </div>
  );
}
