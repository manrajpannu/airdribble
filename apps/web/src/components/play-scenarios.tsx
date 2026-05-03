"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CircleDot, Crosshair, Layers, Zap, MoreVertical } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useChallenges, useStartSession, useEndSession, useUserBestScore, useUserScores, queryKeys } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import type { Challenge } from "@/lib/api";
import ChallengeResultsDialog from "@/components/challenge-results-dialog";

function ScenarioIcon({ icon }: { icon: string }) {
  if (icon === "flick") return <Zap className="h-4 w-4" />;
  if (icon === "tracking") return <Layers className="h-4 w-4" />;
  return <Crosshair className="h-4 w-4" />;
}

function ScenarioCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Skeleton className="h-4 w-16 rounded-full" />
        <Skeleton className="h-4 w-20 rounded-full" />
        <Skeleton className="h-4 w-14 rounded-full" />
      </CardContent>
    </Card>
  );
}

export default function PlayScenarios() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: challenges, isLoading, isError, refetch: refetchChallenges } = useChallenges();
  const [loadingScenario, setLoadingScenario] = useState<Challenge | null>(null);

  // ── Results Dialog State ───────────────────────────────────────
  const [pendingResult, setPendingResult] = useState<any>(null);
  const [resultsOpen, setResultsOpen] = useState(false);

  const startSessionMutation = useStartSession();

  const { data: bestScoreData, isLoading: isLoadingBestScore, isError: isBestScoreError } = useUserBestScore(
    pendingResult?.challengeId ?? 0,
    !!pendingResult // Only fetch when we have a result to show
  );
  const { data: scoreHistoryData, isLoading: isLoadingHistory, isError: isHistoryError } = useUserScores(
    pendingResult?.challengeId ?? 0,
    !!pendingResult
  );

  useEffect(() => {
    const resultStr = sessionStorage.getItem("pendingChallengeResult");
    if (resultStr) {
      sessionStorage.removeItem("pendingChallengeResult");
      try {
        const result = JSON.parse(resultStr);
        setPendingResult(result);
        setResultsOpen(true);
      } catch (e) {
        console.error("Failed to parse pending challenge result", e);
      }
    }
  }, []);

  const bestScore = bestScoreData?.score ?? 0;
  const scoreHistory = useMemo(
    () =>
      (scoreHistoryData ?? []).map((s, i) => ({
        elapsed: i,
        score: s.score,
      })),
    [scoreHistoryData]
  );

  const isLoadingResults = isLoadingBestScore || isLoadingHistory;
  const isErrorResults = isBestScoreError || isHistoryError || pendingResult?.error;

  const filteredScenarios = useMemo(
    () => (challenges ?? []).filter((s) => s.slug !== "tutorial"),
    [challenges]
  );

  const startScenario = useCallback(async (scenario: Challenge) => {
    setLoadingScenario(scenario);
    try {
      // 1. Prefetch full challenge data (with full config) so game page has it instantly
      const prefetchChallenge = queryClient.prefetchQuery({
        queryKey: queryKeys.challenge(scenario.slug),
        queryFn: () => api.getChallenge(scenario.slug),
        staleTime: 5 * 60 * 1000,
      });

      // 2. Start the session on the backend
      const startSession = startSessionMutation.mutateAsync(scenario.id);

      // Wait for both to complete before navigating
      await Promise.all([prefetchChallenge, startSession]);
      
      router.push(`/game/${scenario.slug}`);
    } catch {
      toast.error("Failed to start session", {
        description: "Could not initialize challenge session. Please try again.",
      });
      setLoadingScenario(null);
    }
  }, [startSessionMutation, router, queryClient]);

  return (
    <>
      <div className="flex flex-col gap-8">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <CircleDot className="h-4 w-4" />
            <span className="text-sm font-medium uppercase tracking-wider">Challenge</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Scenario Selection</h1>
          <p className="text-muted-foreground mt-2">Choose a scenario to launch full-screen training.</p>
        </div>

        {isError && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive flex items-center justify-between">
            <span>Failed to load scenarios. Please check your connection and try again.</span>
            <button
              onClick={() => refetchChallenges()}
              className="ml-4 px-3 py-1.5 text-xs font-medium rounded-md bg-destructive/20 hover:bg-destructive/30 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <ScenarioCardSkeleton key={i} />)
            : filteredScenarios.map((scenario) => (
                <Card
                  key={scenario.slug}
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
                        <span className="uppercase text-xs">{scenario.slug}</span>
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
                            <DropdownMenuLabel className="px-0 pt-0 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Scenario Details
                            </DropdownMenuLabel>
                          </DropdownMenuGroup>
                          <p className="text-[11px] text-muted-foreground leading-relaxed mt-1 mb-2 italic">
                            {scenario.description}
                          </p>
                          <Separator className="my-2" />
                          <div className="space-y-2.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground">Time Limit</span>
                              <span className="font-medium">{(scenario.config.timeLimit as number) ?? (scenario.duration_ms / 1000)}s</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground">Target Health</span>
                              <span className="font-medium">{(scenario.config.health as number) ?? 1} HP</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground">Targets</span>
                              <span className="font-medium">{(scenario.config.numBalls as number) ?? 1}</span>
                            </div>

                            <Separator className="my-2" />

                            <div className="grid gap-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">Scoring Rules</span>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">Kill</span>
                                <span className="text-green-500 font-bold">+{(scenario.config.pointsPerKill as number) ?? 50}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">Hit</span>
                                <span className="text-blue-500 font-bold">+{(scenario.config.pointsPerHit as number) ?? 10}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">Miss</span>
                                <span className="text-red-500 font-bold">{(scenario.config.pointsPerMiss as number) ?? 0}</span>
                              </div>
                            </div>
                          </div>
                          <Separator className="my-2" />
                          <DropdownMenuItem
                            className="cursor-pointer text-xs"
                            onClick={() => startScenario(scenario)}
                          >
                            Launch Scenario
                          </DropdownMenuItem>
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
                <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
                <div className="absolute inset-2 rounded-full border-b border-primary/40 animate-spin" style={{ animationDuration: "0.8s" }} />
                <div className="absolute inset-[1.4rem] rounded-full bg-primary/20 animate-pulse" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Loading Scenario</p>
                <h3 className="text-2xl font-bold">{loadingScenario.title}</h3>
                <p className="text-sm text-muted-foreground animate-pulse">Preparing full-screen training...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {resultsOpen && pendingResult && (
        <ChallengeResultsDialog
          open={resultsOpen}
          challengeName={pendingResult.title}
          modeState={pendingResult.modeState}
          highScore={bestScore}
          scoreHistory={scoreHistory}
          isLoading={isLoadingResults}
          isError={isErrorResults}
          onDone={() => setResultsOpen(false)}
          onReplay={() => {
            setResultsOpen(false);
            const scenario = challenges?.find(c => c.slug === pendingResult.slug);
            if (scenario) {
              startScenario(scenario);
            }
          }}
          onOpenStats={() => {}}
        />
      )}
    </>
  );
}
