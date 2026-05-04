"use client";

import { useMe, useRanks } from "@/hooks/use-api";
import { User, Calendar, MapPin, Trophy, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ActivityHeatmap from "@/components/activity-heatmap";
import ActivityFeed from "@/components/activity-feed";

export default function ProfilePage() {
  const { data: user, isLoading: isUserLoading, isError: isUserError, refetch: refetchUser } = useMe();
  const { data: ranks, isLoading: isRanksLoading, isError: isRanksError, refetch: refetchRanks } = useRanks();

  const isLoading = isUserLoading || isRanksLoading;
  const isError = isUserError || isRanksError;

  if (isLoading) {
    return (
      <div className="flex-1 p-6 flex justify-center mt-12">
        <div className="animate-pulse flex flex-col gap-4 items-center">
          <div className="size-24 rounded-full bg-muted" />
          <div className="h-6 w-32 bg-muted rounded" />
          <div className="h-4 w-24 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center mt-12 gap-4">
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-6 text-center max-w-md">
          <p className="text-sm text-destructive font-medium mb-1">Failed to load profile</p>
          <p className="text-xs text-destructive/70 mb-4">
            Could not connect to the server. Please check your connection and try again.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchUser();
              refetchRanks();
            }}
          >
            <RefreshCw className="size-3.5 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 p-6 flex justify-center items-center h-full mt-12">
        <p className="text-muted-foreground">User not found or not logged in.</p>
      </div>
    );
  }

  const createdAt = user.created_at ? new Date(user.created_at).toLocaleDateString() : "Unknown";
  const userRank = ranks?.find(r => r.id === user.rank_id);
  const rankDisplay = userRank ? `${userRank.tier} ${userRank.division ? `Div ${userRank.division}` : ''}` : "Unranked";

  return (
    <div className="flex-1 p-6 lg:p-12 max-w-4xl mx-auto w-full">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Profile</h1>
          <p className="text-muted-foreground">Manage your account and view your stats.</p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="flex items-center justify-center size-16 rounded-full bg-primary/10">
              <User className="size-8 text-primary" />
            </div>
            <div className="flex flex-col">
              <CardTitle className="text-2xl">{user.username}</CardTitle>
              <CardDescription>Guest Account</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
              <div className="flex flex-col gap-1 p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Trophy className="size-4" />
                  <span className="text-sm font-medium">Rank</span>
                </div>
                <span className="font-semibold truncate" title={rankDisplay}>{rankDisplay}</span>
              </div>
              <div className="flex flex-col gap-1 p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <MapPin className="size-4" />
                  <span className="text-sm font-medium">Location</span>
                </div>
                <span className="font-semibold truncate" title={user.location || "Unknown"}>{user.location || "Unknown"}</span>
              </div>
              <div className="flex flex-col gap-1 p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Calendar className="size-4" />
                  <span className="text-sm font-medium">Joined</span>
                </div>
                <span className="font-semibold truncate">{createdAt}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lifetime Stats</CardTitle>
            <CardDescription>Your cumulative performance across all challenges.</CardDescription>
          </CardHeader>
          <CardContent>
            {user.games_played === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No games played yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex flex-col items-center p-6 rounded-2xl bg-primary/5 border border-primary/10 transition-all hover:bg-primary/10 group">
                  <span className="text-sm font-bold text-primary uppercase tracking-widest mb-1">Games Played</span>
                  <span className="text-4xl font-black group-hover:scale-110 transition-transform">{user.games_played}</span>
                </div>
                <div className="flex flex-col items-center p-6 rounded-2xl bg-primary/5 border border-primary/10 transition-all hover:bg-primary/10 group">
                  <span className="text-sm font-bold text-primary uppercase tracking-widest mb-1">Total Shots</span>
                  <span className="text-4xl font-black group-hover:scale-110 transition-transform">{user.shots}</span>
                </div>
                <div className="flex flex-col items-center p-6 rounded-2xl bg-primary/5 border border-primary/10 transition-all hover:bg-primary/10 group">
                  <span className="text-sm font-bold text-primary uppercase tracking-widest mb-1">Total Kills</span>
                  <span className="text-4xl font-black group-hover:scale-110 transition-transform">{user.kills}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/3">
            <ActivityHeatmap />
          </div>
          <div className="lg:w-1/3">
            <ActivityFeed />
          </div>
        </div>
      </div>
    </div>
  );
}
