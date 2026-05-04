"use client";

import { useMe, useRanks } from "@/hooks/use-api";
import { User, Calendar, MapPin, Trophy, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import UserActivity from "@/components/user-activity";

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
      <div className="flex flex-col gap-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Profile</h1>
            <p className="text-muted-foreground text-sm">Manage your account and view your performance milestones.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="size-3.5 mr-2" />
            Refresh
          </Button>
        </div>

        <Card className="rounded-[2rem] border bg-card/40 shadow-sm overflow-hidden">
          <CardContent className="p-8 lg:p-10">
            <div className="flex flex-col md:flex-row md:items-center gap-8 lg:gap-12">
              <div className="flex items-center gap-6">
                <div className="flex items-center justify-center size-20 rounded-full bg-primary/10 border-4 border-background shadow-md shrink-0">
                  <User className="size-10 text-primary" />
                </div>
                <div className="flex flex-col">
                  <CardTitle className="text-3xl font-black tracking-tight">{user.username}</CardTitle>
                  <CardDescription className="font-semibold text-muted-foreground/60">Guest Account • Joined {createdAt}</CardDescription>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-0.5 p-4 rounded-2xl bg-muted/20 border border-muted/50 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-1.5 text-muted-foreground/60 mb-1">
                    <Trophy className="size-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Rank</span>
                  </div>
                  <span className="text-sm font-bold truncate leading-none" title={rankDisplay}>{rankDisplay}</span>
                </div>
                <div className="flex flex-col gap-0.5 p-4 rounded-2xl bg-muted/20 border border-muted/50 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-1.5 text-muted-foreground/60 mb-1">
                    <MapPin className="size-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Region</span>
                  </div>
                  <span className="text-sm font-bold truncate leading-none" title={user.location || "Global"}>{user.location || "Global"}</span>
                </div>
                <div className="flex flex-col gap-0.5 p-4 rounded-2xl bg-muted/20 border border-muted/50 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-1.5 text-muted-foreground/60 mb-1">
                    <Calendar className="size-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Status</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-500 leading-none">Active Now</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/80">
            <Trophy className="size-3.5" />
            Lifetime Performance
          </div>
          <Card className="rounded-3xl border bg-card/50 overflow-hidden">
            <CardContent className="p-0">
              {user.games_played === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <p className="text-muted-foreground italic">No training data available yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x">
                  <div className="flex flex-col items-center p-8 transition-all hover:bg-muted/30 group">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2">Sessions</span>
                    <span className="text-4xl font-black group-hover:scale-110 transition-transform">{user.games_played}</span>
                  </div>
                  <div className="flex flex-col items-center p-8 transition-all hover:bg-muted/30 group">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2">Total Shots</span>
                    <span className="text-4xl font-black group-hover:scale-110 transition-transform">{user.shots}</span>
                  </div>
                  <div className="flex flex-col items-center p-8 transition-all hover:bg-muted/30 group">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2">Total Kills</span>
                    <span className="text-4xl font-black group-hover:scale-110 transition-transform">{user.kills}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <UserActivity />
      </div>
    </div>
  );
}

