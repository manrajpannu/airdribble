const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include", // always send cookies (user_token, session_token)
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }

  return res.json();
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GuestUser {
  id: number;
  username: string;
  token: string;
  rank_id: number | null;
  location: string | null;
  ip_address: string | null;
  created_at: string | null;
}

export interface Rank {
  id: number;
  tier: string;
  tier_number: number | null;
  division: number | null;
}

export interface ChallengeConfig {
  numBalls?: number;
  health?: number;
  movement?: string;
  size?: number | number[];
  timeLimit?: number;
  boundary?: number;
  colors?: string[];
  reticleType?: string;
  reticleColor?: string;
  holdSliderEnabled?: boolean;
  holdSliderSeconds?: number;
  isStriped?: boolean;
  stripedAngle?: number | string;
  stripeTolerance?: number;
  bulletsEnabled?: boolean;
  bulletAmmo?: number;
  bulletCooldownSeconds?: number;
  bulletReloadSeconds?: number;
  autoBulletReload?: boolean;
  killEffect?: string;
  onHoverEffect?: string;
  pointsPerKill?: number;
  pointsPerHit?: number;
  pointsPerMiss?: number;
  [key: string]: unknown;
}

export interface Challenge {
  id: number;
  slug: string;
  title: string;
  description: string;
  tags: string[];
  thumbnail: string;
  icon: string;
  duration_ms: number;
  difficulty: number;
  active: boolean;
  config: ChallengeConfig;
  created_at: string;
  updated_at: string;
}

export interface Score {
  id: number;
  user_token: string;
  session_token: string;
  challenge_id: number;
  score: number;
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  rank_id: number | null;
}

// ─── API Functions ─────────────────────────────────────────────────────────────

export const api = {
  // Users
  createGuestUser: () =>
    apiFetch<{ message: string; username: string }>("/api/v1/users/guest", {
      method: "POST",
    }),

  getMe: () => apiFetch<GuestUser>("/api/v1/users/me"),

  updateMe: (data: { username?: string; rank_id?: number | null }) =>
    apiFetch<{ message: string }>("/api/v1/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Challenges
  getChallenges: () => apiFetch<Challenge[]>("/api/v1/challenges"),

  getChallenge: (slug: string) =>
    apiFetch<Challenge>(`/api/v1/challenge?slug=${slug}`),

  // Ranks
  getRanks: () => apiFetch<Rank[]>("/api/v1/ranks"),

  getRank: (id: number) => apiFetch<Rank>(`/api/v1/rank?id=${id}`),

  // Scores
  getUserScores: (challengeId: number) =>
    apiFetch<Score[]>(`/api/v1/me/scores?challenge_id=${challengeId}`),

  getUserBestScore: (challengeId: number) =>
    apiFetch<Score>(`/api/v1/me/best-score?challenge_id=${challengeId}`),

  getUserPercentile: (challengeId: number) =>
    apiFetch<{ percentile: number }>(
      `/api/v1/me/percentile?challenge_id=${challengeId}`
    ),

  // Leaderboard
  getLeaderboard: (challengeId: number) =>
    apiFetch<LeaderboardEntry[]>(
      `/api/v1/leaderboard?challenge_id=${challengeId}`
    ),

  // Challenge Sessions
  startSession: (challengeId: number) =>
    apiFetch<{ message: string }>(
      `/api/v1/challenges/${challengeId}/session`,
      { method: "POST" }
    ),

  endSession: (score: number) =>
    apiFetch<{ message: string; session_token: string; score: number }>(
      "/api/v1/challenges/session/end",
      { method: "PATCH", body: JSON.stringify({ score }) }
    ),
};
