"use client";

import { useMemo, useState } from "react";
import { ChartColumn, Heart, ThumbsDown, ThumbsUp, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useLeaderboardContext } from "@/hooks/use-api";
import type { LeaderboardContextEntry } from "@/lib/api";

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

function buildLeaderboard(finalScore: number): LeaderboardRow[] {
  const seedRows: LeaderboardRow[] = [
    { player: "NeoArc", score: 18240, accuracy: "97.1%", friend: true },
    { player: "Pulse", score: 18110, accuracy: "96.7%", friend: false },
    { player: "Miko", score: 17920, accuracy: "96.1%", friend: true },
    { player: "Static", score: 17790, accuracy: "95.8%", friend: false },
    { player: "Cinder", score: 17540, accuracy: "95.2%", friend: true },
    { player: "Vanta", score: 17310, accuracy: "94.9%", friend: false },
    { player: "Kite", score: 17080, accuracy: "94.2%", friend: false },
    { player: "Nova", score: 16950, accuracy: "93.8%", friend: true },
    { player: "Echo", score: 16720, accuracy: "93.5%", friend: false },
    { player: "Rift", score: 16580, accuracy: "92.9%", friend: true },
  ]

  const generatedRows = Array.from({ length: 110 }, (_, index) => {
    const score = 16400 - index * 90
    const accuracy = (91.8 - index * 0.18).toFixed(1)
    return {
      player: `Runner-${String(index + 1).padStart(3, "0")}`,
      score,
      accuracy: `${Math.max(40, Number(accuracy)).toFixed(1)}%`,
      friend: index % 9 === 0,
    }
  })

  return [...seedRows, { player: "You", score: finalScore, accuracy: "92.8%", friend: true }, ...generatedRows]
    .sort((a, b) => b.score - a.score)
}

function buildLeaderboardWindow(rows: LeaderboardRow[]) {
  const playerIndex = rows.findIndex((row) => row.player === "You")
  const topRows = rows.slice(0, 10)

  if (playerIndex < 0) {
    return topRows
  }

  const aroundPlayerStart = Math.max(0, playerIndex - 50)
  const aroundPlayerEnd = Math.min(rows.length, playerIndex + 51)
  const windowRows = rows.slice(aroundPlayerStart, aroundPlayerEnd)

  const combinedRows = [...topRows, ...windowRows]
  const uniqueRows = combinedRows.filter((row, index, allRows) => allRows.findIndex((candidate) => candidate.player === row.player) === index)

  return uniqueRows.sort((a, b) => b.score - a.score)
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
  isLoading: isDataLoading,
  isError: isDataError,
}: ChallengeResultsDialogProps) {
  const [activeTab, setActiveTab] = useState("leaderboard")
  const [selectedStat, setSelectedStat] = useState<"Damage" | "Hits" | "Kills" | "Total">("Total")
  const [friendsOnly, setFriendsOnly] = useState(false)
  const [historyRange, setHistoryRange] = useState(25)

  const { data: leaderboardData, isLoading: isLeaderboardLoading, isError: isLeaderboardError } = useLeaderboardContext(challengeId);

  const metrics = useScoreMetrics(modeState)
  const finalScore = metrics.score
  
  // Use leaderboard context data if available
  const userEntry = leaderboardData?.user_entry;
  const top10 = leaderboardData?.top_10 ?? [];
  const medianScore = leaderboardData?.median_score ?? 0;
  const entriesCount = leaderboardData?.total_entries ?? 0;
  
  // Percentile logic: 100 * (better than / total)
  // Our backend percentile was (score < user) / total * 100.
  // We can just use the user rank to estimate: 100 - (rank/total * 100)
  const userRank = userEntry?.rank ?? 0;
  const percentile = (userRank > 0 && entriesCount > 0) 
    ? Math.max(1, Math.min(99, Math.round(100 - (userRank / entriesCount) * 100))) 
    : 0;
  
  const isSessionBest = finalScore >= highScore

  const displayHistory = useMemo(() => scoreHistory.slice(-historyRange), [scoreHistory, historyRange])

  const isLoading = isDataLoading || isLeaderboardLoading;
  const isError = isDataError || isLeaderboardError;

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
        <TableCell className="font-bold text-muted-foreground/60">#{row.rank}</TableCell>
        <TableCell className={cn(
          "flex items-center gap-2",
          isMe ? "font-black text-primary" : "font-semibold"
        )}>
          {row.username}
          {isMe && <Badge className="h-4 px-1 text-[8px] bg-primary">YOU</Badge>}
        </TableCell>
        <TableCell className="text-right font-bold tracking-tight">{formatNumber(row.score)}</TableCell>
      </TableRow>
    );
  }

  if (!open) return null

  const scoreRows = [
    { label: "Damage", value: formatNumber(metrics.damageDealt) },
    { label: "Hits", value: formatNumber(metrics.hits) },
    { label: "Kills", value: formatNumber(metrics.kills) },
    { label: "Total", value: formatNumber(metrics.total) },
  ] as const

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-6xl rounded-xl border bg-card shadow-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="border-b bg-muted/30 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Results</p>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{challengeName}</h2>
          </div>
          <Badge variant={isSessionBest ? "default" : "secondary"}>
            {isSessionBest ? "Session Best!" : "Challenge Complete"}
          </Badge>
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 min-h-[400px]">
             <div className="relative w-16 h-16 flex items-center justify-center mb-6">
                <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
                <div className="absolute inset-2 rounded-full border-b border-primary/40 animate-spin" style={{ animationDuration: "0.8s" }} />
                <div className="absolute inset-[1.4rem] rounded-full bg-primary/20 animate-pulse" />
              </div>
              <p className="text-muted-foreground animate-pulse font-medium">Calculating results and fetching leaderboard...</p>
          </div>
        ) : isError ? (
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
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x overflow-y-auto">
              {/* Column 1: Score History & Calculation (2/3 width) */}
              <div className="md:col-span-2 p-6 space-y-8">
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-xl tracking-tight">Score History</h3>
                      <p className="text-sm text-muted-foreground mt-1">Track your performance over the last {historyRange} sessions.</p>
                    </div>
                    <div className="text-right">
                      <div className="flex flex-wrap justify-end gap-2 mb-1">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">{percentile}th percentile</Badge>
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
                    
                    <div className="flex flex-col justify-between gap-4">
                      <div className="p-5 rounded-xl border bg-card/50 space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Final Score</p>
                        <p className="text-5xl font-black text-primary leading-none">{formatNumber(finalScore)}</p>
                      </div>
                      
                      <div className="p-5 rounded-xl border bg-card/50 space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Personal Best</p>
                        <p className="text-3xl font-bold text-foreground leading-none">{formatNumber(highScore)}</p>
                      </div>

                      <div className="p-5 rounded-xl border bg-card/50 space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Session Median</p>
                        <p className="text-3xl font-bold text-foreground leading-none">{formatNumber(medianScore)}</p>
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
                  
                  <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                    {scoreRows.map((row) => {
                      const active = selectedStat === row.label
                      return (
                        <Button
                          key={row.label}
                          variant={active ? "default" : "outline"}
                          className={cn(
                            "h-auto flex-col items-start py-5 px-5 transition-all duration-200",
                            active ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover:bg-muted/50"
                          )}
                          onClick={() => setSelectedStat(row.label)}
                        >
                          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">{row.label}</span>
                          <span className="text-2xl font-black">{row.value}</span>
                        </Button>
                      )
                    })}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-xl border bg-primary/5 p-5 flex flex-col items-center justify-center text-center">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Accuracy</p>
                      <p className="text-2xl font-black text-primary">{metrics.accuracy.toFixed(1)}%</p>
                    </div>
                    <div className="rounded-xl border bg-muted/30 p-5 flex flex-col items-center justify-center text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Efficiency</p>
                      <p className="text-2xl font-black text-foreground">{metrics.damageEfficiency.toFixed(1)}%</p>
                    </div>
                    <div className="rounded-xl border bg-muted/30 p-5 flex flex-col items-center justify-center text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">KDR</p>
                      <p className="text-2xl font-black text-foreground">{metrics.kdr.toFixed(2)}</p>
                    </div>
                  </div>
                </section>
              </div>

              {/* Column 2: Leaderboard (1/3 width) */}
              <div className="p-6 space-y-6 flex flex-col bg-muted/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-xl tracking-tight">Leaderboard</h3>
                    <p className="text-sm text-muted-foreground mt-1">Global rankings for this challenge.</p>
                  </div>
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={friendsOnly}
                      onChange={(event) => setFriendsOnly(event.target.checked)}
                      className="rounded border-input text-primary focus:ring-primary w-4 h-4"
                    />
                    <span className="group-hover:text-primary transition-colors">Friends</span>
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl border bg-card p-3 text-center shadow-sm">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter mb-1">Entries</div>
                    <div className="font-bold text-foreground">{formatNumber(entriesCount)}</div>
                  </div>
                  <div className="rounded-xl border bg-card p-3 text-center shadow-sm">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter mb-1">Median</div>
                    <div className="font-bold text-foreground">{formatNumber(medianScore)}</div>
                  </div>
                  <div className="rounded-xl border bg-card p-3 text-center shadow-sm">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter mb-1">Top %</div>
                    <div className="font-bold text-foreground">{100 - percentile}%</div>
                  </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                  <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                    <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
                    <TabsTrigger value="analysis">Analysis</TabsTrigger>
                  </TabsList>

                  <TabsContent value="leaderboard" className="flex-1 overflow-auto mt-4 rounded-xl border bg-card shadow-sm">
                    <Table>
                      <TableHeader className="bg-muted/50 sticky top-0 z-10">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-16 font-bold text-[10px] uppercase">Rank</TableHead>
                          <TableHead className="font-bold text-[10px] uppercase">Player</TableHead>
                          <TableHead className="text-right font-bold text-[10px] uppercase">Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {top10.map(renderLeaderboardRow)}
                        
                        {neighbors.length > 0 && (
                          <>
                            <TableRow className="bg-muted/10 h-8 hover:bg-muted/10 border-none pointer-events-none">
                              <TableCell colSpan={3} className="text-center py-1">
                                <div className="flex items-center justify-center gap-3 text-[9px] text-muted-foreground/30 font-black tracking-[0.2em] uppercase">
                                  <div className="h-[1px] flex-1 bg-muted-foreground/10" />
                                  <span>Your Position</span>
                                  <div className="h-[1px] flex-1 bg-muted-foreground/10" />
                                </div>
                              </TableCell>
                            </TableRow>
                            {neighbors.map(renderLeaderboardRow)}
                          </>
                        )}
                      </TableBody>
                    </Table>
                  </TabsContent>

                  <TabsContent value="analysis" className="mt-4 space-y-4 flex-1">
                    <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-8 bg-primary rounded-full" />
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Focusing On</p>
                          <p className="text-xl font-black">{selectedStat}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Your performance in <span className="font-bold text-foreground">{selectedStat}</span> is currently 
                        at <span className="font-bold text-foreground">{metrics[selectedStat.toLowerCase() as keyof typeof metrics]}</span>. 
                        Select other cards in the center panel to compare.
                      </p>
                    </div>
                    
                    <div className="rounded-xl border bg-card p-5 shadow-sm">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Quick Summary</p>
                      <ul className="space-y-3">
                        {[
                          { label: "Accuracy", value: `${metrics.accuracy.toFixed(1)}%`, desc: "precision in your shots" },
                          { label: "Efficiency", value: `${metrics.damageEfficiency.toFixed(1)}%`, desc: "damage dealt vs possible" },
                          { label: "KDR", value: metrics.kdr.toFixed(2), desc: "kills per hit ratio" }
                        ].map(item => (
                          <li key={item.label} className="flex gap-3 text-sm">
                            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                            <p className="text-muted-foreground">
                              <span className="font-bold text-foreground">{item.label} is {item.value}</span>, reflecting your {item.desc}.
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

        <div className="border-t bg-muted/10 p-4 flex items-center justify-between">
          <div className="flex gap-2">
            <Button variant="ghost" size="icon"><Heart className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon"><ThumbsUp className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon"><ThumbsDown className="h-4 w-4" /></Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setActiveTab("analysis"); onOpenStats(); }}>
              <ChartColumn className="mr-2 h-4 w-4" /> Stats
            </Button>
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
