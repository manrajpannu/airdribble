"use client";

import { useMemo, useState } from "react";
import { ChartColumn, Heart, ThumbsDown, ThumbsUp, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

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

function ScoreChart({ points, finalScore, highScore }: { points: ChallengeScorePoint[]; finalScore: number; highScore: number }) {
  const width = 620
  const height = 260
  const padded = 18

  const chartPoints = points.length > 1 ? points : [{ elapsed: 0, score: 0 }, { elapsed: 1, score: finalScore }]
  const maxScore = Math.max(100, finalScore, highScore, ...chartPoints.map((point) => point.score))
  const maxElapsed = Math.max(1, ...chartPoints.map((point) => point.elapsed))
  const values = chartPoints.map((point) => ({
    x: padded + (point.elapsed / maxElapsed) * (width - padded * 2),
    y: height - padded - (point.score / maxScore) * (height - padded * 2),
  }))
  const lastPoint = values[values.length - 1]
  const area = `M ${padded} ${height - padded} ${values.map((point) => `L ${point.x} ${point.y}`).join(" ")} L ${lastPoint?.x ?? padded} ${height - padded} Z`
  const line = values.map((point) => `${point.x},${point.y}`).join(" ")
  const percentile25 = values[Math.max(0, Math.floor(values.length * 0.25))]
  const percentile50 = values[Math.max(0, Math.floor(values.length * 0.5))]

  return (
    <div className="rounded-lg border bg-card p-3 shadow-sm text-foreground">
      <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground">
        <span>Score Progression</span>
        <span>Line Chart</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full text-primary">
        <defs>
          <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <rect x={0} y={0} width={width} height={height} fill="transparent" />
        <line x1={padded} y1={height - padded} x2={width - padded} y2={height - padded} stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" />
        <line x1={padded} y1={padded} x2={padded} y2={height - padded} stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" />
        {percentile25 ? (
          <g>
            <line x1={padded} y1={percentile25.y} x2={width - padded} y2={percentile25.y} stroke="currentColor" strokeDasharray="4 4" strokeOpacity="0.2" strokeWidth="1" />
            <text x={width - padded} y={percentile25.y - 4} textAnchor="end" className="fill-muted-foreground text-[10px]">25th</text>
          </g>
        ) : null}
        {percentile50 ? (
          <g>
            <line x1={padded} y1={percentile50.y} x2={width - padded} y2={percentile50.y} stroke="currentColor" strokeDasharray="2 2" strokeOpacity="0.3" strokeWidth="1" />
            <text x={width - padded} y={percentile50.y - 4} textAnchor="end" className="fill-muted-foreground text-[10px]">50th</text>
          </g>
        ) : null}
        <path d={area} fill="url(#scoreFill)" />
        <polyline points={line} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {values.map((point, index) => (
          <circle key={`${point.x}-${index}`} cx={point.x} cy={point.y} r={3} fill="currentColor" />
        ))}
      </svg>
    </div>
  )
}

export default function ChallengeResultsDialog({
  open,
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
  const [activeTab, setActiveTab] = useState("leaderboard")
  const [selectedStat, setSelectedStat] = useState<"Damage" | "Hits" | "Kills" | "Total">("Total")
  const [friendsOnly, setFriendsOnly] = useState(false)

  const metrics = useScoreMetrics(modeState)
  const finalScore = metrics.score
  const leaderboard = useMemo(() => buildLeaderboard(finalScore), [finalScore])
  const filteredLeaderboard = friendsOnly ? leaderboard.filter((row) => row.friend) : leaderboard
  const visibleLeaderboard = useMemo(() => buildLeaderboardWindow(filteredLeaderboard), [filteredLeaderboard])
  const entriesCount = leaderboard.length
  const scores = leaderboard.map((row) => row.score)
  const medianScore = scores.slice().sort((a, b) => a - b)[Math.floor(scores.length / 2)] ?? finalScore
  const betterThan = leaderboard.filter((row) => finalScore >= row.score).length
  const percentile = Math.round((betterThan / leaderboard.length) * 100)
  const isSessionBest = finalScore >= highScore

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
            <p className="text-sm font-medium text-muted-foreground">Post-Challenge Results</p>
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
          <div className="p-6 space-y-6">
            <div>
              <h3 className="font-semibold text-lg">Score History</h3>
              <p className="text-sm text-muted-foreground">Track how the run built over time.</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Final Score</p>
                  <p className="text-4xl font-bold text-primary">{formatNumber(finalScore)}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-medium text-muted-foreground">Personal Best</p>
                    <p className="text-xl font-semibold text-foreground">{formatNumber(highScore)}</p>
                  </div>
              </div>

              <ScoreChart points={scoreHistory} finalScore={finalScore} highScore={highScore} />

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">25th percentile</Badge>
                <Badge variant="outline">50th percentile</Badge>
                <Badge>{percentile}th percentile</Badge>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h3 className="font-semibold text-lg">Score Calculation</h3>
              <p className="text-sm text-muted-foreground">Damage, hits, kills, and total breakdown.</p>
            </div>
            
            <div className="grid gap-2 grid-cols-2">
              {scoreRows.map((row) => {
                const active = selectedStat === row.label
                return (
                  <Button
                    key={row.label}
                    variant={active ? "default" : "outline"}
                    className="h-auto flex-col items-start py-4 px-4 justify-start text-left"
                    onClick={() => setSelectedStat(row.label)}
                  >
                    <span className="text-xs text-muted-foreground font-normal opacity-80">{row.label}</span>
                    <span className="text-xl font-bold">{row.value}</span>
                  </Button>
                )
              })}
            </div>

            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge variant="secondary">ACC {metrics.accuracy.toFixed(1)}%</Badge>
                <Badge variant="secondary">EFF {metrics.damageEfficiency.toFixed(1)}%</Badge>
                <Badge variant="secondary">KDR {metrics.kdr.toFixed(2)}</Badge>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-3xl font-bold text-foreground">{formatNumber(finalScore)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6 flex flex-col">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Leaderboard</h3>
                <p className="text-sm text-muted-foreground">Compare with others.</p>
              </div>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={friendsOnly}
                  onChange={(event) => setFriendsOnly(event.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary"
                />
                Friends Only
              </label>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-md border bg-card p-3 text-center">
                <div className="text-xs text-muted-foreground mb-1">Entries</div>
                <div className="font-semibold text-foreground">{entriesCount}</div>
              </div>
              <div className="rounded-md border bg-card p-3 text-center">
                <div className="text-xs text-muted-foreground mb-1">Median</div>
                <div className="font-semibold text-foreground">{formatNumber(medianScore)}</div>
              </div>
              <div className="rounded-md border bg-card p-3 text-center">
                <div className="text-xs text-muted-foreground mb-1">Percentile</div>
                <div className="font-semibold text-foreground">{percentile}th</div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="leaderboard" className="flex-1 overflow-auto mt-4 rounded-md border">
                <Table>
                  <TableHeader className="bg-muted/50 sticky top-0">
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleLeaderboard.map((row) => {
                      const rank = leaderboard.findIndex((candidate) => candidate.player === row.player) + 1;
                      const isMe = row.player === "You";
                      return (
                        <TableRow key={row.player} className={isMe ? "bg-primary/5" : ""}>
                          <TableCell className="font-medium text-muted-foreground">#{rank}</TableCell>
                          <TableCell className={isMe ? "font-bold text-primary" : "font-medium"}>{row.player}</TableCell>
                          <TableCell className="text-right font-semibold">{formatNumber(row.score)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="analysis" className="mt-4 space-y-4">
                <div className="rounded-md border bg-card p-4">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Selected Stat</p>
                  <p className="text-xl font-bold">{selectedStat}</p>
                  <p className="text-sm text-muted-foreground mt-2">Select a stat card in the center panel to focus.</p>
                </div>
                <div className="rounded-md border bg-card p-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Quick Summary</p>
                  <ul className="list-disc space-y-1 pl-4 text-sm">
                    <li>Accuracy is {metrics.accuracy.toFixed(1)}%.</li>
                    <li>Damage efficiency is {metrics.damageEfficiency.toFixed(1)}%.</li>
                    <li>You landed {metrics.hits} hits and {metrics.kills} kills.</li>
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
            <Button onClick={onReplay}>
              <RotateCcw className="mr-2 h-4 w-4" /> Replay
            </Button>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  )
}
