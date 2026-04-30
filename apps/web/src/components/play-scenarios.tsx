"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleDot, Crosshair, Layers, Zap, Loader2, MoreVertical } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { SCENARIOS, Scenario } from "@/lib/scenarios";

function ScenarioIcon({ icon }: { icon: Scenario["icon"] }) {
  if (icon === "flick") return <Zap className="h-4 w-4" />;
  if (icon === "tracking") return <Layers className="h-4 w-4" />;
  return <Crosshair className="h-4 w-4" />;
}

export default function PlayScenarios() {
  const router = useRouter();
  const [loadingScenario, setLoadingScenario] = useState<Scenario | null>(null);

  const subtitle = useMemo(
    () => "Choose a scenario to launch full-screen training.",
    []
  );

  const startScenario = (scenario: Scenario) => {
    setLoadingScenario(scenario);
    window.setTimeout(() => {
      router.push(`/game/${scenario.id}`);
    }, 850);
  };

  return (
    <>
      <div className="flex flex-col gap-8">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <CircleDot className="h-4 w-4" />
            <span className="text-sm font-medium uppercase tracking-wider">Challenge</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Scenario Selection</h1>
          <p className="text-muted-foreground mt-2">{subtitle}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SCENARIOS.map((scenario) => (
            <Card
              key={scenario.id}
              className="group cursor-pointer overflow-hidden hover:border-primary transition-colors relative"
              onClick={() => startScenario(scenario)}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${scenario.thumbnail} opacity-50 transition duration-300 group-hover:opacity-100`}
              />
              <CardHeader className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <ScenarioIcon icon={scenario.icon} />
                    <span className="uppercase text-xs">{scenario.id}</span>
                  </Badge>

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "icon" }),
                        "h-8 w-8 relative z-20"
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 p-3" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="px-0 pt-0 text-xs font-bold uppercase tracking-wider text-muted-foreground">Scenario Details</DropdownMenuLabel>
                      </DropdownMenuGroup>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-1 mb-2 italic">
                        {scenario.description}
                      </p>
                      <Separator className="my-2" />
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Time Limit</span>
                          <span className="font-medium">{scenario.config.timeLimit}s</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Target Health</span>
                          <span className="font-medium">{scenario.config.health ?? 1} HP</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Targets</span>
                          <span className="font-medium">{scenario.config.numBalls ?? 1}</span>
                        </div>
                        
                        <Separator className="my-2" />
                        
                        <div className="grid gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">Scoring Rules</span>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">Kill</span>
                            <span className="text-green-500 font-bold">+{scenario.config.pointsPerKill ?? 50}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">Hit</span>
                            <span className="text-blue-500 font-bold">+{scenario.config.pointsPerHit ?? 10}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">Miss</span>
                            <span className="text-red-500 font-bold">{scenario.config.pointsPerMiss ?? 0}</span>
                          </div>
                        </div>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardTitle>{scenario.title}</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 flex flex-wrap gap-2">
                {scenario.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-[10px] uppercase">
                    {tag}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {loadingScenario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 text-center animate-in fade-in zoom-in duration-300">
            <CardContent className="flex flex-col items-center justify-center pt-6 space-y-6">
              <div className="relative w-16 h-16 flex items-center justify-center">
                {/* Outer Ring */}
                <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
                {/* Middle Ring */}
                <div className="absolute inset-2 rounded-full border border-primary/10 animate-reverse-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }} />
                <div className="absolute inset-2 rounded-full border-b border-primary/40 animate-spin" style={{ animationDuration: '0.8s' }} />
                {/* Inner Pulse */}
                <div className="absolute inset-[1.4rem] rounded-full bg-primary/20 animate-pulse" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Loading Scenario</p>
                <h3 className="text-2xl font-bold">{loadingScenario.title}</h3>
                <p className="text-sm text-muted-foreground animate-pulse">
                  Preparing full-screen training...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
