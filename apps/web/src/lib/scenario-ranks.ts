export type ScenarioRank = 
  | "Unranked"
  | "Beginner"
  | "Improver"
  | "Competent"
  | "Advanced"
  | "Talented"
  | "Adept"
  | "Expert"
  | "Elite"
  | "World Class"
  | "Godlike I"
  | "Godlike II"
  | "Godlike III";

export interface ScenarioRankInfo {
  name: ScenarioRank;
  minPercentile: number;
  color: string;
  bg: string;
}

export const SCENARIO_RANKS: ScenarioRankInfo[] = [
  { name: "Godlike III", minPercentile: 99.9, color: "#ffffff", bg: "linear-gradient(to bottom, #ff00ff, #00ffff)" },
  { name: "Godlike II", minPercentile: 99, color: "#ffffff", bg: "linear-gradient(to bottom, #6366f1, #a855f7)" },
  { name: "Godlike I", minPercentile: 98, color: "#ffffff", bg: "linear-gradient(to bottom, #ec4899, #8b5cf6)" },
  { name: "World Class", minPercentile: 95, color: "#ffffff", bg: "#f43f5e" },
  { name: "Elite", minPercentile: 90, color: "#ffffff", bg: "#e11d48" },
  { name: "Expert", minPercentile: 80, color: "#ffffff", bg: "#ea580c" },
  { name: "Adept", minPercentile: 65, color: "#ffffff", bg: "#d97706" },
  { name: "Talented", minPercentile: 50, color: "#ffffff", bg: "#65a30d" },
  { name: "Advanced", minPercentile: 35, color: "#ffffff", bg: "#0891b2" },
  { name: "Competent", minPercentile: 20, color: "#ffffff", bg: "#2563eb" },
  { name: "Improver", minPercentile: 10, color: "#ffffff", bg: "#4b5563" },
  { name: "Beginner", minPercentile: 0.1, color: "#ffffff", bg: "#6b7280" },
  { name: "Unranked", minPercentile: 0, color: "#94a3b8", bg: "#1e293b" },
];

export function getScenarioRank(percentile: number): ScenarioRankInfo {
  // Sort by percentile descending to find the highest match
  const match = [...SCENARIO_RANKS]
    .sort((a, b) => b.minPercentile - a.minPercentile)
    .find(r => percentile >= r.minPercentile);
  
  return match || SCENARIO_RANKS[SCENARIO_RANKS.length - 1];
}

export function calculateAimlabsPercentile(rank: number, total: number): number {
  if (total <= 0) return 0;
  if (rank <= 0) return 0;
  return ((total - rank + 1) / total) * 100;
}
