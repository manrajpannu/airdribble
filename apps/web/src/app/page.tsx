"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMe } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Zap, Target, ArrowRight } from "lucide-react";
import Image from "next/image";
import { MeshGradient } from "@paper-design/shaders-react";
import { InteractiveBalls } from "@/components/interactive-balls";
import { AppFooter } from "@/components/app-footer";

export default function LandingPage() {
  const router = useRouter();
  const { data: user, isLoading } = useMe();

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/app/play");
    }
  }, [user, isLoading, router]);

  if (isLoading || user) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="size-12 rounded-full border-4 border-slate-200 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white overflow-hidden flex flex-col">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 opacity-20">
          {/* <MeshGradient
            width={1920}
            height={1080}
            colors={["#65FF6A", "#FF28C9", "#2D31FF", "#43F6FD", "#FFFFFF"]}
            distortion={0.4}
            swirl={0.3}
            speed={0.4}
            scale={1.1}
          /> */}
        </div>
        <div className="absolute inset-0 z-9">
          <InteractiveBalls
            opacity={0.3}
            blur="30px"
            count={12}
            interactive={true}
          />
        </div>
      </div>

      {/* Navigation */}
      <header className=" relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="relative w-64 h-14">
          <Image
            src="/icons/logo-black.png"
            alt="Airdribble Logo"
            fill
            className="object-contain"
          />
        </div>

        <div className="flex items-center gap-6">
          <Button
            variant="ghost"
            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            onClick={() => router.push("/app/play")}
          >
            Sign In
          </Button>
          <Button
            className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl px-8"
            onClick={() => router.push("/app/play")}
          >
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 max-w-5xl mx-auto py-20">
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 bg-white/50 backdrop-blur-sm shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-[#65FF6A] animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">v2.0 Mechanical Lab</span>
          </div>

          <div className="space-y-6">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-slate-900 uppercase italic leading-[0.85]">
              Master the <br />
              <span className="bg-linear-to-r from-[#2D31FF] via-[#FF28C9] to-[#43F6FD] bg-clip-text text-transparent">
                Air Roll
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
              Airdribble is a high-fidelity simulator designed to perfect your Directional Air Roll mechanics through data-driven training scenarios.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              size="lg"
              className="h-16 px-10 rounded-2xl bg-blue-300/20 text-black font-bold uppercase tracking-[0.2em] text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-[#2D31FF]/20 group border-none"
              onClick={() => router.push("/app/play")}
            >
              Start Training Now
              <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-16 px-10 rounded-2xl border-slate-200 bg-white text-slate-600 font-bold uppercase tracking-[0.2em] text-xs hover:bg-slate-50 transition-all"
              onClick={() => {
                const el = document.getElementById('features');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Learn More
            </Button>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section id="features" className="relative z-10 py-32 px-8 bg-slate-50/50 backdrop-blur-xl border-t border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
          <div className="space-y-5">
            <div className="size-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
              <Zap className="size-6 text-[#FF28C9]" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Real-Time Physics</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Experience the same physics model used in top-tier competition, running directly in your browser with zero latency.
            </p>
          </div>

          <div className="space-y-5">
            <div className="size-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
              <Target className="size-6 text-[#2D31FF]" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Adaptive Challenges</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              From ball tracking to direction control, our scenarios adapt to your skill level to ensure consistent mechanical growth.
            </p>
          </div>

          <div className="space-y-5">
            <div className="size-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
              <Trophy className="size-6 text-[#65FF6A]" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Global Rankings</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Compete against the best. Climb the leaderboards and track your percentile rank across every training session.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <AppFooter />
    </div>
  );
}
