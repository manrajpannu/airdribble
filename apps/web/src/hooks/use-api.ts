import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ─── Query Keys ────────────────────────────────────────────────────────────────
// Centralised here so invalidation is consistent across the app
export const queryKeys = {
  me: ["me"] as const,
  challenges: ["challenges"] as const,
  challenge: (slug: string) => ["challenge", slug] as const,
  ranks: ["ranks"] as const,
  rank: (id: number) => ["rank", id] as const,
  leaderboard: (challengeId: number) => ["leaderboard", challengeId] as const,
  userScores: (challengeId: number) => ["userScores", challengeId] as const,
  userBestScore: (challengeId: number) =>
    ["userBestScore", challengeId] as const,
  userPercentile: (challengeId: number) =>
    ["userPercentile", challengeId] as const,
};

// ─── User Hooks ───────────────────────────────────────────────────────────────

/** Fetches the current user profile. Returns null if not logged in (400/404). */
export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () =>
      api.getMe().catch((err: Error) => {
        const msg = err.message ?? "";
        // 400 = no cookie yet, 404 = cookie exists but user not in DB
        // Both mean "no user yet" — return null so GuestInit creates one
        if (
          msg.includes("400") ||
          msg.includes("404") ||
          msg.includes("Missing user_token") ||
          msg.includes("User not found")
        ) {
          return null;
        }
        throw err;
      }),
    retry: false, // Don't retry on 400/404 — expected on first load
  });
}

/** Creates a guest account. Automatically refreshes the user profile on success. */
export function useCreateGuestUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createGuestUser,
    onSuccess: () => {
      // Invalidate user cache so useMe() refetches
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
  });
}

/** Updates the current user's display name and/or rank. */
export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updateMe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
  });
}

// ─── Challenge Hooks ──────────────────────────────────────────────────────────

export function useChallenges() {
  return useQuery({
    queryKey: queryKeys.challenges,
    queryFn: api.getChallenges,
    staleTime: 5 * 60 * 1000, // Challenges rarely change — cache for 5 min
  });
}

export function useChallenge(slug: string) {
  return useQuery({
    queryKey: queryKeys.challenge(slug),
    queryFn: () => api.getChallenge(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Rank Hooks ───────────────────────────────────────────────────────────────

export function useRanks() {
  return useQuery({
    queryKey: queryKeys.ranks,
    queryFn: api.getRanks,
    staleTime: Infinity, // Ranks never change
  });
}

// ─── Score Hooks ──────────────────────────────────────────────────────────────

export function useUserScores(challengeId: number) {
  return useQuery({
    queryKey: queryKeys.userScores(challengeId),
    queryFn: () => api.getUserScores(challengeId),
    enabled: !!challengeId,
  });
}

export function useUserBestScore(challengeId: number) {
  return useQuery({
    queryKey: queryKeys.userBestScore(challengeId),
    queryFn: () => api.getUserBestScore(challengeId),
    enabled: !!challengeId,
  });
}

export function useUserPercentile(challengeId: number) {
  return useQuery({
    queryKey: queryKeys.userPercentile(challengeId),
    queryFn: () => api.getUserPercentile(challengeId),
    enabled: !!challengeId,
  });
}

// ─── Leaderboard Hooks ────────────────────────────────────────────────────────

export function useLeaderboard(challengeId: number) {
  return useQuery({
    queryKey: queryKeys.leaderboard(challengeId),
    queryFn: () => api.getLeaderboard(challengeId),
    enabled: !!challengeId,
  });
}

// ─── Session Hooks ────────────────────────────────────────────────────────────

export function useStartSession() {
  return useMutation({
    mutationFn: api.startSession,
  });
}

export function useEndSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.endSession,
    onSuccess: (_, score) => {
      // After submitting a score, invalidate all score/leaderboard caches
      queryClient.invalidateQueries({ queryKey: ["userScores"] });
      queryClient.invalidateQueries({ queryKey: ["userBestScore"] });
      queryClient.invalidateQueries({ queryKey: ["userPercentile"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}
