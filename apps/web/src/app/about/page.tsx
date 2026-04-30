"use client";

import { useEffect, useState } from "react";
import {
  Rocket,
  Target,
  ShieldCheck,
  Cpu,
  Zap,
  Gamepad2,
  Music,
  Code2,
  Terminal
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Image from "next/image";

import { MeshGradient } from '@paper-design/shaders-react';

export default function AboutPage() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("airdribble-theme");
    const prefersDark = saved === "dark";
    setDarkMode(prefersDark);
  }, []);

  return (
    <div className="flex flex-col gap-16 py-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl px-8 py-16 bg-[#000000] text-white shadow-2xl">
        {/* Professional Mesh Gradient Shader */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none ">
          <MeshGradient
            width={1920}
            height={1080}
            colors={["#44f7fd", "#2e31ff", "#ff29c9", "#66ff6b"]}
            distortion={0.65}
            swirl={0.56}
            grainMixer={0}
            grainOverlay={0}
            speed={1.06}
            scale={0.8}
            rotation={96}
            fit={"cover"}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="mb-4 border-white/30 bg-white/10 text-white hover:bg-white/20">
            Open Source • Built by the Community
          </Badge>
          {/* <h1 className="mb-6 text-5xl font-black tracking-tighter md:text-7xl">
            RL <span className="bg-gradient-to-r from-sky-400 to-blue-600 bg-clip-text text-transparent">DART</span>
          </h1> */}
          <div className="mb-6 text-5xl font-black">
            <Image
              src={"/icons/logo-white.png"}
              alt="airdribble logo"
              width={512}
              height={512}
              className="mx-auto"
              priority
            />
          </div>
          <p className="mb-8 text-lg text-white md:text-xl leading-relaxed">
            The ultimate mechanical trainer for high-stakes competition. Built for precision,
            engineered for performance, and designed to help you dominate the field.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-bold tracking-tight">
              LAUNCH TRAINING
            </Button>
            <Button size="lg" variant="outline" className="border-zinc-800 bg-zinc-900/50 text-white hover:bg-zinc-800">
              <Terminal className="mr-2 h-4 w-4" /> SOURCE CODE
            </Button>
          </div>
        </div>
      </section>

      {/* Core Philosophy */}
      <section className="grid gap-8 md:grid-cols-3">
        <div className="flex flex-col gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-500 ring-1 ring-sky-500/20">
            <Target className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold tracking-tight">Precision First</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Frame-perfect hit detection and sub-millisecond input processing ensure that every
            movement counts toward your muscle memory.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-500 ring-1 ring-purple-500/20">
            <Zap className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold tracking-tight">High Performance</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            A centralized Three.js engine and optimized Web Audio API manager provide a seamless,
            lag-free environment for peak performance.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold tracking-tight">Scientifically Modeled</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Scenario logic built on established training principles to maximize retention and
            accelerate mechanical improvement.
          </p>
        </div>
      </section>

      <Separator />

      {/* Tech Stack Section */}
      <section>
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-black uppercase tracking-widest italic mb-2">The Engine Room</h2>
          <p className="text-muted-foreground">Cutting edge technologies driving the trainer.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-blue-500" />
                Graphics Core
              </CardTitle>
              <CardDescription>Advanced rendering pipeline</CardDescription>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Powered by Three.js with custom toon shaders and dithering for a crisp,
              modern aesthetic that maintains high framerates on any device.
            </CardContent>
          </Card>
          <Card className="bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-emerald-500" />
                Scenario Logic
              </CardTitle>
              <CardDescription>Fully Parameterized</CardDescription>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              A dynamic scenario registry allows for infinite variety in training patterns,
              from simple tracking to complex aerial direction control.
            </CardContent>
          </Card>
          <Card className="bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-orange-500" />
                Modern Frontend
              </CardTitle>
              <CardDescription>Next.js & Shadcn UI</CardDescription>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              A professional-grade interface built with React, Tailwind CSS, and Shadcn UI
              for a responsive, accessibility-first user experience.
            </CardContent>
          </Card>
        </div>
      </section>
      <Separator />

      {/* Evolution Section */}
      <section>
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-black uppercase tracking-widest italic mb-2">Project Evolution</h2>
          <p className="text-muted-foreground">From humble beginnings to a modern powerhouse.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="relative overflow-hidden border-zinc-200 dark:border-zinc-800">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <span className="text-4xl font-black italic">V1</span>
            </div>
            <CardHeader>
              <Badge className="w-fit mb-2 bg-zinc-500">Legacy</Badge>
              <CardTitle>rldart</CardTitle>
              <CardDescription>The Original Foundation</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              V1 focused on the core concept of mechanical precision. It established the
              fundamental physics and logic that still power the heart of the trainer today.
              The community's feedback on RLdart was the catalyst for this modernization.
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-fuchsia-500/50 bg-fuchsia-500/5">
            <div className="absolute top-0 right-0 p-3 opacity-20">
              <span className="text-4xl font-black italic text-fuchsia-500">V2</span>
            </div>
            <CardHeader>
              <Badge className="w-fit mb-2 bg-fuchsia-500">Modernized</Badge>
              <CardTitle>airdribble</CardTitle>
              <CardDescription>The High-Performance Evolution</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              V2 is a complete modernization. Re-engineered as "airdribble", it brings
              Web Audio API for zero-latency sound, a refined Shadcn UI, and
              highly parameterized scenarios for advanced training flexibility.
            </CardContent>
          </Card>
        </div>
      </section>


    </div>
  );
}
