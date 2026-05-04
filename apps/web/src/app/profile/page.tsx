"use client";

import { useMe, useRanks } from "@/hooks/use-api";
import { User, Calendar, MapPin, Trophy, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RankBadge } from "@/components/rank-badge";
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

        <Card className="border-none shadow-none bg-transparent p-6">
          <CardHeader className="flex flex-row items-center gap-6 px-0 pb-2">
            <div className="flex items-center justify-center size-20 rounded-full bg-primary/10 border-4 border-background shadow-sm">
              <User className="size-10 text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center">
                <CardTitle className="text-3xl font-black tracking-tight">{user.username}</CardTitle>
                <RankBadge currentRankId={user.rank_id} />
              </div>
              <CardDescription className="font-medium">Guest Account • Joined {createdAt}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              <div className="flex flex-col gap-1 p-5 rounded-2xl bg-muted/30 border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <MapPin className="size-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Region</span>
                </div>
                <span className="text-lg font-bold truncate" title={user.location || "Global"}>{user.location || "Global"}</span>
              </div>
              <div className="flex flex-col gap-1 p-5 rounded-2xl bg-muted/30 border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Calendar className="size-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Status</span>
                </div>
                <span className="text-lg font-bold text-emerald-500">Active Now</span>
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

