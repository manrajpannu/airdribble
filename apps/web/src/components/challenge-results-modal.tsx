"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Share2, RotateCcw, Loader2 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type ChallengeResultsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resultId: string | null;
  onReplay: (scenarioId: string) => void;
};

// Realistic Dummy Data Generator
const generateHistoryData = (count: number) => {
  let baseScore = 300;
  return Array.from({ length: count }).map((_, i) => {
    // Add some random noise and occasional "good days"
    const noise = (Math.random() - 0.4) * 40;
    const progress = (i / count) * 200;
    const peak = Math.random() > 0.9 ? 100 : 0;
    baseScore = Math.max(0, Math.floor(baseScore + noise + progress + peak));
    return {
      attempt: i + 1,
      score: baseScore,
    };
  });
};

const DUMMY_HISTORY = {
  "10": generateHistoryData(10),
  "25": generateHistoryData(25),
  "50": generateHistoryData(50),
  "alltime": generateHistoryData(100),
};

const LEADERBOARD_TOP_10 = [
  { rank: 1, name: "SquishyMuffinz", score: 980 },
  { rank: 2, name: "Jstn", score: 955 },
  { rank: 3, name: "GarrettG", score: 940 },
  { rank: 4, name: "MonkeyMoon", score: 920 },
  { rank: 5, name: "Vatira", score: 915 },
  { rank: 6, name: "Firstkiller", score: 900 },
  { rank: 7, name: "Zen", score: 890 },
  { rank: 8, name: "Daniel", score: 875 },
  { rank: 9, name: "BeastMode", score: 860 },
  { rank: 10, name: "Atomic", score: 850 },
];

const LEADERBOARD_CONTEXT = [
  { rank: 404, name: "PlayerAbove", score: 550 },
  { rank: 405, name: "You", score: 545, isYou: true },
  { rank: 406, name: "PlayerBelow", score: 540 },
];

export function ChallengeResultsModal({
  open,
  onOpenChange,
  resultId,
  onReplay,
}: ChallengeResultsModalProps) {
  const [historyFilter, setHistoryFilter] = useState<"10" | "25" | "50" | "alltime">("10");
  const [resultData, setResultData] = useState<{ score: number, bestScore: number, scenarioId: string, title: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    if (open && resultId) {
      setIsLoading(true);
      // Simulate API fetch delay
      const timer = setTimeout(() => {
        const stored = window.localStorage.getItem(`mock_result_${resultId}`);
        if (stored) {
          setResultData(JSON.parse(stored));
        } else {
          setResultData({
            score: 0,
            bestScore: 0,
            scenarioId: "unknown",
            title: "Unknown Result",
          });
        }
        setIsLoading(false);
      }, 400); // 400ms artificial delay to show loading state
      return () => clearTimeout(timer);
    } else {
      setResultData(null);
    }
  }, [open, resultId]);

  const score = resultData?.score || 0;
  const bestScore = resultData?.bestScore || 0;
  const scenarioTitle = resultData?.title || "Scenario";
  const scenarioId = resultData?.scenarioId || "";
  
  // Memoize a single large pool of history data
  const fullHistory = React.useMemo(() => generateHistoryData(100), []);
  
  // Slice it based on the filter
  const chartData = React.useMemo(() => {
    if (historyFilter === "alltime") return fullHistory;
    const count = parseInt(historyFilter);
    return fullHistory.slice(-count);
  }, [fullHistory, historyFilter]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1200px] w-[95vw] max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground animate-pulse">Fetching results...</p>
          </div>
        ) : (
          <>
            <DialogHeader className="flex flex-row items-center justify-between mt-4">
              <div className="flex flex-col gap-1">
            <Badge variant="secondary" className="w-fit">{scenarioTitle}</Badge>
            <DialogTitle className="text-2xl font-bold tracking-tight">Challenge Results</DialogTitle>
          </div>
          <div className="flex items-center gap-2 pr-6">
            <Button variant="outline" size="icon" title="Thumbs Up">
              <ThumbsUp className="size-4" />
            </Button>
            <Button variant="outline" size="icon" title="Thumbs Down">
              <ThumbsDown className="size-4" />
            </Button>
            <Button variant="outline" onClick={() => navigator.clipboard.writeText(`I scored ${score} in ${scenarioTitle}!`)}>
              <Share2 className="mr-2 size-4" /> Share
            </Button>
            <Button onClick={() => onReplay(scenarioId)}>
              <RotateCcw className="mr-2 size-4" /> Replay
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex gap-4">
              <div className="bg-card text-card-foreground border rounded-lg p-6 flex-1 shadow-sm">
                <div className="text-sm font-medium text-muted-foreground">Score</div>
                <div className="text-4xl font-bold">{score}</div>
              </div>
              <div className="bg-card text-card-foreground border rounded-lg p-6 flex-1 shadow-sm">
                <div className="text-sm font-medium text-muted-foreground">Best Score</div>
                <div className="text-4xl font-bold">{Math.max(score, bestScore)}</div>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-card shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Score History</h3>
                <div className="flex gap-2">
                  {(["10", "25", "50", "alltime"] as const).map((filter) => (
                    <Button
                      key={filter}
                      variant={historyFilter === filter ? "default" : "outline"}
                      size="sm"
                      onClick={() => setHistoryFilter(filter)}
                    >
                      {filter === "alltime" ? "All Time" : filter}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
                    <XAxis 
                      dataKey="attempt" 
                      tick={{ fill: "hsl(var(--muted-foreground))" }} 
                      tickLine={false} 
                      axisLine={false}
                      minTickGap={30}
                    />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="rgb(59, 130, 246)" 
                      strokeWidth={3} 
                      dot={{ r: 2, fill: "rgb(59, 130, 246)" }}
                      activeDot={{ r: 4 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="col-span-1 space-y-4">
            <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
              <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
                <h3 className="font-semibold">Leaderboard</h3>
                <div className="text-xs text-muted-foreground text-right">
                  <div>12,453 Entries</div>
                  <div>Median: 412</div>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {LEADERBOARD_TOP_10.map((entry) => (
                    <TableRow key={entry.rank}>
                      <TableCell className="text-center font-medium">{entry.rank}</TableCell>
                      <TableCell className="truncate max-w-[120px]">{entry.name}</TableCell>
                      <TableCell className="text-right font-bold">{entry.score}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground bg-muted/10 h-8">
                      ...
                    </TableCell>
                  </TableRow>
                  {LEADERBOARD_CONTEXT.map((entry) => (
                    <TableRow key={entry.rank} className={entry.isYou ? "bg-primary/10" : ""}>
                      <TableCell className="text-center font-medium">{entry.rank}</TableCell>
                      <TableCell className="truncate max-w-[120px] font-medium">
                        {entry.name} {entry.isYou && "(You)"}
                      </TableCell>
                      <TableCell className="text-right font-bold">{entry.isYou ? score : entry.score}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}
