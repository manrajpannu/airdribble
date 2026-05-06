"use client";

import { useMemo, useState, useEffect } from "react";
import { ChartColumn, Heart, ThumbsDown, ThumbsUp, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useLeaderboardContext, useRateChallenge, useUserRating } from "@/hooks/use-api";
import type { LeaderboardContextEntry } from "@/lib/api";
import { RankBadge } from "@/components/rank-badge";
import { ScenarioRankBadge } from "@/components/scenario-rank-badge";
import { calculateAimlabsPercentile } from "@/lib/scenario-ranks";
import Link from "next/link";

export type ChallengeScorePoint = {
  elapsed: number;
  score: number;
};

export type ChallengeModeState = {
  modeName: string;
  active: boolean;
  isChallenge: boolean;
  completed: boolean;
  hits: number;
  kills: number;
  score: number;
  timeLeft: number | null;
  timeLimit: number | null;
  damageDealt?: number;
  damagePossible?: number;
  shots?: number;
  elapsedSeconds?: number;
};

type LeaderboardRow = {
  player: string;
  score: number;
  accuracy: string;
  friend?: boolean;
};

type ChallengeResultsDialogProps = {
  open: boolean;
  challengeId: number;
  challengeName: string;
  modeState: ChallengeModeState | null;
  /** The user's all-time best score from the API (GET /me/best-score) */
  highScore: number;
  /** All past scores for this challenge from the API (GET /me/scores) */
  scoreHistory: ChallengeScorePoint[];
  onDone: () => void;
  onReplay: () => void;
  onOpenStats: () => void;
  isLoading?: boolean;
  isError?: boolean;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

function useScoreMetrics(state: ChallengeModeState | null) {
  return useMemo(() => {
    const hits = Number(state?.hits ?? 0)
    const kills = Number(state?.kills ?? 0)
    const score = Number(state?.score ?? 0)
    const damageDealt = Number(state?.damageDealt ?? hits * 10)
    const damagePossible = Number(state?.damagePossible ?? Math.max(1, hits * 10))
    const shots = Number(state?.shots ?? Math.max(1, hits + Math.max(0, 4 - kills)))
    const accuracy = shots > 0 ? (hits / shots) * 100 : 0
    const damageEfficiency = damagePossible > 0 ? (damageDealt / damagePossible) * 100 : 0
    const kdr = hits > 0 ? kills / hits : kills

    return {
      hits,
      kills,
      score,
      damageDealt,
      damagePossible,
      shots,
      accuracy,
      damageEfficiency,
      kdr,
      total: score,
    }
  }, [state])
}

function ScoreChart({
  points,
  finalScore,
  highScore,
  range,
  onRangeChange,
}: {
  points: ChallengeScorePoint[];
  finalScore: number;
  highScore: number;
  range: number;
  onRangeChange: (range: number) => void;
}) {
  const width = 800;
  const height = 350;
  const paddedX = 40;
  const paddedY = 30;

  const chartPoints = points.length > 0 ? points : [{ elapsed: 0, score: 0 }, { elapsed: 1, score: finalScore }];
  const maxScore = Math.max(100, finalScore, highScore, ...chartPoints.map((point) => point.score)) * 1.1;
  const minScore = 0;

  const values = chartPoints.map((point, i) => {
    const xProgress = chartPoints.length > 1 ? i / (chartPoints.length - 1) : 1;
    return {
      x: paddedX + xProgress * (width - paddedX * 2),
      y: height - paddedY - ((point.score - minScore) / (maxScore - minScore)) * (height - paddedY * 2),
      score: point.score
    };
  });

  const lastPoint = values[values.length - 1];
  const area = `M ${paddedX} ${height - paddedY} ${values.map((point) => `L ${point.x} ${point.y}`).join(" ")} L ${lastPoint?.x ?? paddedX} ${height - paddedY} Z`;
  const line = values.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div className="rounded-xl border bg-card/50 p-6 shadow-sm text-foreground">
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <ChartColumn className="h-5 w-5 text-primary" />
            Performance Trend
          </h3>
          <p className="text-xs text-muted-foreground">Historical score progression</p>
        </div>
        <div className="flex bg-muted/50 p-1 rounded-lg border">
          {[10, 25, 50].map((r) => (
            <Button
              key={r}
              variant={range === r ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "h-7 px-3 text-xs font-medium transition-all",
                range === r ? "shadow-sm bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => onRangeChange(r)}
            >
              Last {r}
            </Button>
          ))}
        </div>
      </div>

      <div className="relative group">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-[300px] text-primary overflow-visible">
          <defs>
            <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.01" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p) => {
            const y = height - paddedY - p * (height - paddedY * 2);
            const scoreLabel = Math.round(minScore + p * (maxScore - minScore));
            return (
              <g key={p}>
                <line
                  x1={paddedX} y1={y} x2={width - paddedX} y2={y}
                  stroke="currentColor" strokeOpacity="0.05" strokeWidth="1"
                />
                <text
                  x={paddedX - 8} y={y + 4}
                  textAnchor="end"
                  className="fill-muted-foreground text-[10px] font-medium"
                >
                  {scoreLabel}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={area} fill="url(#scoreFill)" className="transition-all duration-500 ease-in-out" />

          {/* Trend Line */}
          <polyline
            points={line}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
            className="transition-all duration-500 ease-in-out"
            filter="url(#glow)"
          />

          {/* Points */}
          {values.map((point, index) => (
            <g key={`${point.x}-${index}`} className="group/point">
              <circle
                cx={point.x} cy={point.y} r={index === values.length - 1 ? 5 : 3}
                fill={index === values.length - 1 ? "currentColor" : "var(--background)"}
                stroke="currentColor"
                strokeWidth="2"
                className="transition-all duration-300 group-hover/point:r-5 cursor-crosshair"
              />
              <title>{`Score: ${point.score}`}</title>
            </g>
          ))}

          {/* High Score Reference */}
          {highScore > 0 && highScore < maxScore && (
            <g>
              <line
                x1={paddedX}
                y1={height - paddedY - ((highScore - minScore) / (maxScore - minScore)) * (height - paddedY * 2)}
                x2={width - paddedX}
                y2={height - paddedY - ((highScore - minScore) / (maxScore - minScore)) * (height - paddedY * 2)}
                stroke="currentColor"
                strokeDasharray="4 4"
                strokeOpacity="0.3"
                strokeWidth="1.5"
              />
              <text
                x={width - paddedX + 8}
                y={height - paddedY - ((highScore - minScore) / (maxScore - minScore)) * (height - paddedY * 2) + 4}
                className="fill-primary/60 text-[10px] font-bold"
              >
                BEST
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}

export default function ChallengeResultsDialog({
  open,
  challengeId,
  challengeName,
  modeState,
  highScore,
  scoreHistory,
  onDone,
  onReplay,
  onOpenStats,
  isLoading,
  isError,
}: ChallengeResultsDialogProps) {
  const { data: leaderboardData, isLoading: isLeaderboardLoading, isError: isLeaderboardError } = useLeaderboardContext(challengeId);
  const { data: ratingData } = useUserRating(challengeId);
  const rateMutation = useRateChallenge();

  const [selectedStat, setSelectedStat] = useState<"Hits" | "Kills">("Hits")
  const [historyRange, setHistoryRange] = useState(25)
  const [userRating, setUserRating] = useState<number | null>(null);

  // Sync with backend rating
  useEffect(() => {
    if (ratingData) {
      setUserRating(ratingData.rating === 0 ? null : ratingData.rating);
    }
  }, [ratingData]);

  const handleRate = async (rating: number) => {
    const nextRating = userRating === rating ? 0 : rating;
    setUserRating(nextRating === 0 ? null : nextRating);
    try {
      await rateMutation.mutateAsync({ id: challengeId, rating: nextRating });
    } catch (error) {
      console.error("Failed to rate challenge:", error);
    }
  };

  const metrics = useScoreMetrics(modeState)
  const finalScore = metrics.score

  // Use leaderboard context data if available
  const userEntry = leaderboardData?.user_entry;
  const top10 = leaderboardData?.top_10 ?? [];
  const medianScore = leaderboardData?.median_score ?? 0;
  const entriesCount = leaderboardData?.total_entries ?? 0;

  // Percentile logic: Aimlabs style
  const userRank = userEntry?.rank ?? 0;
  const percentile = calculateAimlabsPercentile(userRank, entriesCount);

  const isSessionBest = finalScore >= highScore

  const displayHistory = useMemo(() => scoreHistory.slice(-historyRange), [scoreHistory, historyRange])

  const combinedLoading = isLoading || isLeaderboardLoading;
  const combinedError = isError || isLeaderboardError;

  const neighbors = useMemo(() => {
    if (!leaderboardData || !userEntry || userRank <= 10) return [];

    const items: LeaderboardContextEntry[] = [];
    // Only show above if they aren't already in Top 10
    if (leaderboardData.above_entry && leaderboardData.above_entry.rank > 10) {
      items.push(leaderboardData.above_entry);
    }
    items.push(userEntry);
    if (leaderboardData.below_entry) {
      items.push(leaderboardData.below_entry);
    }
    return items;
  }, [leaderboardData, userEntry, userRank]);

  const renderLeaderboardRow = (row: LeaderboardContextEntry) => {
    const isMe = row.is_user;
    return (
      <TableRow key={`${row.username}-${row.rank}`} className={cn(
        "transition-colors",
        isMe ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-muted/40"
      )}>
        <TableCell className="font-bold text-muted-foreground/60 text-xs ">#{row.rank}</TableCell>
        <TableCell>
          <div className="flex justify-start">
            {isMe ? (
              <span className="truncate max-w-[100px] text-xs font-black text-primary">
                {row.username}
              </span>
            ) : (
              <Link
                href={`/profile/${encodeURIComponent(row.username)}`}
                className="truncate max-w-[100px] text-xs font-semibold hover:text-primary hover:underline underline-offset-2 transition-colors"
              >
                {row.username}
              </Link>
            )}
          </div>
        </TableCell>
        <TableCell className="px-1">
          <RankBadge currentRankId={row.rank_id} interactive={false} />
        </TableCell>
        <TableCell className="text-right font-bold tracking-tight text-xs">{formatNumber(row.score)}</TableCell>
      </TableRow>
    );
  }

  if (!open) return null

  const scoreRows = [
    { label: "Hits", value: formatNumber(metrics.hits) },
    { label: "Kills", value: formatNumber(metrics.kills) },
  ] as const

  return (
    <div className="fixed inset-0 z-120 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-6xl rounded-xl border bg-card shadow-lg overflow-hidden flex flex-col max-h-[95vh]">
        <div className="border-b bg-muted/30 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Results</p>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{challengeName}</h2>
          </div>
          <Badge variant="secondary">
            Challenge Complete
          </Badge>
        </div>

        {combinedLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 min-h-[400px]">
            <div className="relative w-16 h-16 flex items-center justify-center mb-6">
              <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
              <div className="absolute inset-2 rounded-full border-b border-primary/40 animate-spin" style={{ animationDuration: "0.8s" }} />
              <div className="absolute inset-[1.4rem] rounded-full bg-primary/20 animate-pulse" />
            </div>
            <p className="text-muted-foreground animate-pulse font-medium">Calculating results and fetching leaderboard...</p>
          </div>
        ) : combinedError ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 min-h-[300px]">
            <p className="text-destructive font-semibold mb-2">Failed to load results</p>
            <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
              Could not fetch your score data. Your score was still saved — check back later.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onDone}>Done</Button>
              <Button onClick={onReplay}>Replay</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x overflow-y-auto">
              {/* Column 1: Score History & Calculation (2/3 width) */}
              <div className="md:col-span-3 p-6 space-y-8">
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-xl tracking-tight">Score History</h3>
                      <p className="text-sm text-muted-foreground mt-1">Track your performance over the last {historyRange} sessions.</p>
                    </div>
                    <div className="text-right">
                      <div className="flex flex-wrap justify-end gap-2 mb-1">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">{percentile.toFixed(2)}th percentile</Badge>
                        {isSessionBest && <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/20 hover:bg-amber-500/30">New Personal Best!</Badge>}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3">
                      <ScoreChart
                        points={displayHistory}
                        finalScore={finalScore}
                        highScore={highScore}
                        range={historyRange}
                        onRangeChange={setHistoryRange}
                      />
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="p-4 rounded-2xl border bg-primary/5 space-y-4 flex flex-col items-center justify-center text-center">
                        <div className="space-y-1">
                          <p className="text-[12px] font-bold text-primary uppercase tracking-[0.2em]">Final Score</p>
                          <p className="text-5xl font-black text-primary leading-none tracking-tighter">{formatNumber(finalScore)}</p>
                        </div>

                      </div>
                      <div className="p-4 rounded-2xl border space-y-1 flex flex-col items-center justify-center text-center">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Personal Best</p>
                        <p className="text-3xl font-bold text-foreground leading-none">{formatNumber(highScore)}</p>
                        <div className="pt-2 mt-2 border-t border-primary/10 w-full flex flex-col items-center">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Scenario Rank</p>
                          <ScenarioRankBadge percentile={percentile} size="xl" showName={false} />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <Separator className="opacity-50" />

                <section className="space-y-6">
                  <div>
                    <h3 className="font-bold text-xl tracking-tight">Score Calculation</h3>
                    <p className="text-sm text-muted-foreground mt-1">Detailed breakdown of your session performance.</p>
                  </div>

                  <div className="grid gap-4 grid-cols-3">
                    {scoreRows.map((row) => {
                      const active = selectedStat === row.label
                      return (
                        <div
                          key={row.label}
                          className="flex flex-col p-5 rounded-xl border bg-card/50"
                        >
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">{row.label}</span>
                          <span className="text-3xl font-black">{row.value}</span>
                        </div>
                      )
                    })}
                    <div className="rounded-xl border bg-muted/30 p-5 flex flex-col">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Accuracy</p>
                      <p className="text-3xl font-black text-foreground">{metrics.accuracy.toFixed(1)}%</p>
                    </div>
                  </div>
                </section>
              </div>

              {/* Column 2: Leaderboard (1/3 width) */}
              <div className="md:col-span-2 p-6 space-y-6 flex flex-col bg-muted/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-xl tracking-tight">Leaderboard</h3>
                    <p className="text-sm text-muted-foreground mt-1">Global rankings for this challenge.</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl border bg-card p-3 text-center shadow-sm">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter mb-1">Total Entries</div>
                    <div className="font-bold text-foreground">{formatNumber(entriesCount)}</div>
                  </div>
                  <div className="rounded-xl border bg-card p-3 text-center shadow-sm">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter mb-1">Global Median</div>
                    <div className="font-bold text-foreground">{formatNumber(medianScore)}</div>
                  </div>
                  <div className="rounded-xl border bg-card p-3 text-center shadow-sm">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter mb-1">Top %</div>
                    <div className="font-bold text-foreground">{(100 - percentile).toFixed(2)}%</div>
                  </div>
                </div>

                <div className="flex-1 overflow-auto mt-4 rounded-xl border bg-card shadow-sm">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0 z-10">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-14 font-bold text-[10px] uppercase">Rank</TableHead>
                        <TableHead className="font-bold text-[10px] uppercase">Player</TableHead>
                        <TableHead className="w-12 px-1"></TableHead>
                        <TableHead className="text-right font-bold text-[10px] uppercase">Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {top10.map(renderLeaderboardRow)}

                      {neighbors.length > 0 && (
                        <>
                          <TableRow className="bg-muted/10 h-8 hover:bg-muted/10 border-none pointer-events-none">
                            <TableCell colSpan={4} className="text-center py-1">
                              <div className="flex items-center justify-center gap-3 text-[9px] text-muted-foreground/30 font-black tracking-[0.2em] uppercase">
                                <div className="h-px flex-1 bg-muted-foreground/10" />
                                <span>Your Position</span>
                                <div className="h-px flex-1 bg-muted-foreground/10" />
                              </div>
                            </TableCell>
                          </TableRow>
                          {neighbors.map(renderLeaderboardRow)}
                        </>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            <div className="border-t bg-muted/10 p-4 flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant={userRating === 1 ? "secondary" : "ghost"}
                  size="icon"
                  className={cn(userRating === 1 && "bg-primary/10 text-primary hover:bg-primary/20")}
                  onClick={() => handleRate(1)}
                  disabled={rateMutation.isPending}
                >
                  <ThumbsUp className={cn("h-4 w-4", userRating === 1 && "fill-current")} />
                </Button>
                <Button
                  variant={userRating === -1 ? "secondary" : "ghost"}
                  size="icon"
                  className={cn(userRating === -1 && "bg-destructive/10 text-destructive hover:bg-destructive/20")}
                  onClick={() => handleRate(-1)}
                  disabled={rateMutation.isPending}
                >
                  <ThumbsDown className={cn("h-4 w-4", userRating === -1 && "fill-current")} />
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onDone}>Done</Button>
                <Button
                  onClick={onReplay}
                  className="group border-border transition-colors hover:border-black hover:bg-white active:bg-white focus-visible:bg-white hover:text-black"
                >
                  <RotateCcw className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:-rotate-90 " />
                  <span>Replay</span>
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
