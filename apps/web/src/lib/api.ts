const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const retryAfter = res.headers.get("Retry-After");
      throw new ApiError(
        body.error ?? `Request failed: ${res.status}`,
        res.status,
        retryAfter ? parseInt(retryAfter, 10) : undefined
      );
    }

    // Handle 204 No Content
    if (res.status === 204) return {} as T;

    return res.json();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    console.error("API Network Error:", err);
    throw new Error(err instanceof Error ? err.message : String(err));
  }
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

// Public view — no token or IP exposed
export interface PublicGuestUser {
  id: number;
  username: string;
  rank_id: number | null;
  location: string | null;
  games_played: number;
  shots: number;
  kills: number;
  created_at: string | null;
}

export interface Rank {
  id: number;
  name: string;
  tier_number: number | null;
  division: number | null;
}

export interface UserActivity {
  id: number;
  type: string;
  challenge_id: number;
  challenge_name: string;
  score: number;
  created_at: string;
}

export interface ActivityRecord {
  date: string;
  count: number;
  level: number;
}

export interface UserScenarioRank {
  challenge_id: number;
  challenge_title: string;
  challenge_slug: string;
  score: number;
  rank: number;
  total_entries: number;
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
  likes: number;
  dislikes: number;
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
  rank_id: number | null;
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

  rateChallenge: (id: number, rating: number) =>
    apiFetch<{ message: string }>(`/api/v1/challenges/${id}/rate`, {
      method: "POST",
      body: JSON.stringify({ rating }),
    }),

  getUserRating: (id: number) =>
    apiFetch<{ rating: number }>(`/api/v1/challenges/${id}/rating`),

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

  getUserActivity: () => apiFetch<ActivityRecord[]>("/api/v1/me/activity"),
  getUserActivityFeed: (limit: number, offset: number) =>
    apiFetch<UserActivity[]>(
      `/api/v1/me/activity/feed?limit=${limit}&offset=${offset}`
    ),

  // Public profiles
  getPublicProfile: (username: string) =>
    apiFetch<PublicGuestUser>(`/api/v1/users/${encodeURIComponent(username)}`),

  getPublicUserActivity: (username: string) =>
    apiFetch<ActivityRecord[]>(`/api/v1/users/${encodeURIComponent(username)}/activity`),

  getPublicUserActivityFeed: (username: string, limit: number, offset: number) =>
    apiFetch<UserActivity[]>(
      `/api/v1/users/${encodeURIComponent(username)}/activity/feed?limit=${limit}&offset=${offset}`
    ),

  getUserRanks: (username: string) =>
    apiFetch<UserScenarioRank[]>(`/api/v1/users/${encodeURIComponent(username)}/ranks`),

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
