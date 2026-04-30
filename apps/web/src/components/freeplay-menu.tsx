"use client";

import React, { useState, useEffect } from "react";
import { motion, PanInfo, useDragControls } from "framer-motion";
import { GripHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FreeplayMenuProps {
  config: any;
  onChange: (newConfig: any) => void;
}

const getSingleValue = (val: number | number[]) => (Array.isArray(val) ? val[0] : val);

const SectionTitle = ({ title }: { title: string }) => (
  <div className="text-[11px] font-black tracking-widest text-muted-foreground uppercase mt-1 mb-1.5">{title}</div>
);

const CompactSlider = ({ label, value, min, max, step, param, format = (v: any) => v, onChange }: any) => (
  <div className="flex flex-col gap-1 px-0.5">
    <div className="flex justify-between items-center">
      <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">{label}</Label>
      <span className="text-[11px] font-mono font-bold text-primary">{format(value)}</span>
    </div>
    <Slider 
      value={[typeof value === 'number' ? value : min]} 
      min={min} 
      max={max} 
      step={step} 
      onValueChange={(val) => onChange(param, getSingleValue(val))} 
      className="py-1" 
    />
  </div>
);

const CompactSwitch = ({ label, checked, param, onChange }: any) => (
  <div className="flex items-center justify-between bg-muted/20 rounded-lg px-3 py-2 border border-border/50 hover:bg-muted/30 transition-colors">
    <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">{label}</Label>
    <Switch size="sm" checked={!!checked} onCheckedChange={(val) => onChange(param, val)} />
  </div>
);

const CompactSelect = ({ label, value, options, param, onChange }: any) => (
  <div className="flex flex-col gap-1 px-0.5">
    <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">{label}</Label>
    <Select value={value || "None"} onValueChange={(val) => onChange(param, val === "None" ? null : val)}>
      <SelectTrigger className="h-7 w-full text-[11px] px-3 bg-muted/20 border-border/50 rounded-lg hover:bg-muted/30 transition-colors">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt: string) => (
          <SelectItem key={opt} value={opt} className="text-[11px]">{opt}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export const FreeplayMenu = React.memo(function FreeplayMenu({ config, onChange }: FreeplayMenuProps) {
  const [localConfig, setLocalConfig] = useState(config);
  const [side, setSide] = useState<"left" | "right">("right");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragControls = useDragControls();

  const handleDragEnd = (event: any, info: PanInfo) => {
    setIsDragging(false);
    setIsCollapsed(false);
    if (typeof window !== "undefined") {
      if (info.point.x < window.innerWidth / 2) {
        setSide("left");
      } else {
        setSide("right");
      }
    }
  };

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (JSON.stringify(localConfig) !== JSON.stringify(config)) {
        onChange(localConfig);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [localConfig, onChange, config]);

  const handleChange = (key: string, value: any) => {
    setLocalConfig((prev: any) => ({ ...prev, [key]: value }));
  };

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-[14000] p-4 flex animate-in fade-in duration-500"
      style={{ 
        justifyContent: side === "right" ? "flex-end" : "flex-start",
        alignItems: "flex-start",
        paddingTop: "25px"
      }}
    >
      <motion.div
        layout
        drag
        dragControls={dragControls}
        dragListener={false}
        dragSnapToOrigin
        onDragStart={() => {
          setIsCollapsed(true);
          setIsDragging(true);
        }}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 0.95, opacity: 0.8 }}
        className="pointer-events-auto w-72 flex flex-col"
      >
        <Card className="bg-background/60 dark:bg-background/45 backdrop-blur-3xl border-border shadow-2xl flex flex-col w-full overflow-hidden ring-1 ring-border/20 py-0 gap-0">
          <CardHeader 
            className="py-2 px-4 flex-none border-b border-border bg-muted/40 dark:bg-muted/20 flex flex-row items-center justify-between space-y-0 select-none"
            style={{ cursor: isDragging ? "grabbing" : "grab" }}
            onPointerDown={(e) => dragControls.start(e)}
          >
            <div className="flex items-center gap-2">
              <GripHorizontal className="w-4 h-4 text-muted-foreground/70" />
              <CardTitle className="text-xs font-black uppercase tracking-[0.25em] text-foreground/90 flex items-center">
                Freeplay
                <Badge variant="outline" className="ml-2 text-[10px] h-4.5 px-1.5 bg-primary/10 text-primary border-primary/20 animate-pulse">LIVE</Badge>
              </CardTitle>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsCollapsed(!isCollapsed); }}
              className="text-muted-foreground/70 hover:text-foreground transition-colors p-1"
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </CardHeader>
          <motion.div
            initial={false}
            animate={{ height: isCollapsed ? 0 : "auto", opacity: isCollapsed ? 0 : 1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <CardContent className="p-0 overflow-y-auto custom-scrollbar max-h-[calc(100vh-6rem)]">
              <div className="p-3 space-y-3">
            
            <div className="space-y-2.5">
              <SectionTitle title="Targets & Health" />
              <CompactSlider label="Target Count" value={localConfig.numBalls} min={1} max={20} step={1} param="numBalls" onChange={handleChange} />
              <CompactSlider label="Target Size" value={localConfig.size} min={0.5} max={5} step={0.1} param="size" format={(v: any) => `${(v || 1.5).toFixed(1)}x`} onChange={handleChange} />
              <CompactSlider label="Health Points" value={localConfig.health} min={1} max={50} step={1} param="health" onChange={handleChange} />
              <CompactSelect label="Movement Pattern" value={localConfig.movement} param="movement" options={["None", "CoolMovement", "CurvyMovement", "FlowMovement", "NaturalMovement", "OrbitingMovement", "ProceduralMovement", "SinusoidalMovement"]} onChange={handleChange} />
            </div>

            <Separator className="opacity-10" />

            <div className="space-y-2.5">
              <SectionTitle title="Environment & HUD" />
              <CompactSlider label="Spawn Boundary" value={localConfig.boundary} min={5} max={100} step={1} param="boundary" format={(v: any) => `${v || 20}m`} onChange={handleChange} />
              <CompactSwitch label="Display HUD" checked={localConfig.showHud ?? true} param="showHud" onChange={handleChange} />
            </div>

            <Separator className="opacity-10" />

            <div className="space-y-2.5">
              <SectionTitle title="Logic & Mechanics" />
              <CompactSwitch label="Tracking Mode" checked={localConfig.holdSliderEnabled ?? false} param="holdSliderEnabled" onChange={handleChange} />
              <CompactSlider label="Hold Duration" value={localConfig.holdSliderSeconds} min={0.1} max={10} step={0.1} param="holdSliderSeconds" format={(v: any) => `${(v || 2.5).toFixed(1)}s`} onChange={handleChange} />
              <CompactSlider label="Miss Rate" value={localConfig.missSampleRate} min={1} max={20} step={1} param="missSampleRate" onChange={handleChange} />
            </div>

            <Separator className="opacity-10" />

            <div className="space-y-2.5">
              <SectionTitle title="Visual Effects" />
              <CompactSelect label="Kill Animation" value={localConfig.killEffect ?? "confetti"} param="killEffect" options={["None", "confetti", "bubble", "rainbowBubblePop", "neonStarburst", "plasmaRing", "holoShockwave", "whiteGlitterExplosion", "whiteGlitter", "rainbowGlitterExplosion", "rainbowGlitter", "glitterExplosion", "glitter", "shockwave"]} onChange={handleChange} />
              <CompactSwitch label="Striped Skins" checked={localConfig.isStriped ?? false} param="isStriped" onChange={handleChange} />
              <CompactSlider label="Stripe Angle" value={localConfig.stripedAngle} min={0} max={360} step={1} param="stripedAngle" format={(v: any) => `${v || 0}°`} onChange={handleChange} />
            </div>



            <div className="space-y-2.5 pb-4">
              <SectionTitle title="Combat" />
              <CompactSwitch label="Bullet Visuals" checked={localConfig.bulletsEnabled ?? false} param="bulletsEnabled" onChange={handleChange} />
              <CompactSlider label="Max Ammo" value={localConfig.bulletAmmo === 'infinite' ? 100 : (localConfig.bulletAmmo ?? 100)} min={1} max={100} step={1} param="bulletAmmo" format={(v: any) => (v === 100 ? 'inf' : v)} onChange={handleChange} />
              <CompactSlider label="Fire Rate (s)" value={localConfig.bulletCooldownSeconds} min={0.05} max={2} step={0.01} param="bulletCooldownSeconds" format={(v: any) => (v || 0.18).toFixed(2)} onChange={handleChange} />
              <CompactSlider label="Reload (s)" value={localConfig.bulletReloadSeconds} min={0.1} max={5} step={0.1} param="bulletReloadSeconds" format={(v: any) => (v || 1.25).toFixed(2)} onChange={handleChange} />
            </div>

              </div>
            </CardContent>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
});
