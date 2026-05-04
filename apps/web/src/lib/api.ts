const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

/** Determines if a failed request should be retried */
function isRetryable(status: number): boolean {
  // Retry on server errors (5xx) and rate limits (429), never on client errors (4xx)
  return status >= 500 || status === 429;
}

/** Sleep for a given number of milliseconds */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 300; // 300ms, 900ms, 2700ms exponential backoff

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        ...options,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const retryAfter = res.headers.get("Retry-After");
        const error = new ApiError(
          body.error ?? `Request failed: ${res.status}`,
          res.status,
          retryAfter ? parseInt(retryAfter, 10) : undefined
        );

        // Don't retry client errors (4xx except 429)
        if (!isRetryable(res.status)) {
          throw error;
        }

        lastError = error;

        // If we have retries left, back off and try again
        if (attempt < MAX_RETRIES) {
          // If 429, respect Retry-After if provided, otherwise use exponential backoff
          const delay = (res.status === 429 && error.retryAfter) 
            ? error.retryAfter * 1000 
            : BASE_DELAY_MS * Math.pow(3, attempt);
          
          await sleep(delay);
          continue;
        }

        throw error;
      }

      // Handle 204 No Content
      if (res.status === 204) return {} as T;

      return res.json();
    } catch (err) {
      // Network errors (fetch itself threw — offline, DNS, CORS, etc.)
      if (err instanceof ApiError) {
        throw err; // Already handled above
      }

      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt < MAX_RETRIES) {
        await sleep(BASE_DELAY_MS * Math.pow(3, attempt));
        continue;
      }
    }
  }

  throw lastError ?? new Error("Request failed after retries");
}

/** Custom error class that carries the HTTP status code and optional retry hint */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly retryAfter?: number // seconds
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GuestUser {
  id: number;
  username: string;
  token: string;
  rank_id: number | null;
  location: string | null;
  ip_address: string | null;
  games_played: number;
  shots: number;
  kills: number;
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
  shots: number;
  kills: number;
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  rank_id: number | null;
}

export interface LeaderboardContextEntry {
  username: string;
  score: number;
  rank: number;
  is_user: boolean;
}

export interface LeaderboardContext {
  top_10: LeaderboardContextEntry[];
  user_entry?: LeaderboardContextEntry;
  above_entry?: LeaderboardContextEntry;
  below_entry?: LeaderboardContextEntry;
  median_score: number;
  total_entries: number;
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

  getLeaderboardContext: (challengeId: number) =>
    apiFetch<LeaderboardContext>(
      `/api/v1/leaderboard/context?challenge_id=${challengeId}`
    ),

  // Challenge Sessions
  startSession: (challengeId: number) =>
    apiFetch<{ message: string }>(
      `/api/v1/challenges/${challengeId}/session`,
      { method: "POST" }
    ),

  endSession: (data: { score: number; shots: number; kills: number }) =>
    apiFetch<{ message: string; session_token: string; score: number }>(
      "/api/v1/challenges/session/end",
      { method: "PATCH", body: JSON.stringify(data) }
    ),
};
