"use client";

import { useState, useEffect, useRef } from "react";
import { useMe, useRanks, useUpdateMe } from "@/hooks/use-api";
import { User, Calendar, MapPin, Trophy, RefreshCw, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { RankBadge } from "@/components/rank-badge";
import UserActivity from "@/components/user-activity";

export default function ProfilePage() {
  const { data: user, isLoading: isUserLoading, isError: isUserError, refetch: refetchUser } = useMe();
  const { data: ranks, isLoading: isRanksLoading, isError: isRanksError, refetch: refetchRanks } = useRanks();
  const updateMe = useUpdateMe();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState("");
  const isSavingRef = useRef(false);

  useEffect(() => {
    if (user?.username) {
      setEditName(user.username);
    }
  }, [user?.username]);

  const handleUpdateName = async () => {
    if (isSavingRef.current) return;
    
    setEditError("");
    if (!editName.trim() || editName === user?.username) {
      setIsEditing(false);
      setEditName(user?.username || "");
      return;
    }

    isSavingRef.current = true;
    try {
      await updateMe.mutateAsync({ username: editName });
      setIsEditing(false);
    } catch (err: any) {
      console.error("Failed to update username:", err);
      if (err.status === 409 || err.message?.toLowerCase().includes("taken")) {
        setEditError("Username is already taken");
      } else {
        setEditError(err.message || "Failed to update username");
      }
    } finally {
      isSavingRef.current = false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleUpdateName();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditName(user?.username || "");
      setEditError("");
    }
  };

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
            <div className="flex flex-col gap-1 flex-1">
              <div className="flex items-center gap-3">
                {isEditing ? (
                  <div className="flex flex-col gap-1 flex-1 max-w-sm">
                    <div className="flex items-center gap-2">
                      <Input
                        autoFocus
                        value={editName}
                        onChange={(e) => {
                          setEditName(e.target.value);
                          setEditError("");
                        }}
                        onKeyDown={handleKeyDown}
                        onBlur={() => {
                          if (!editError && !updateMe.isPending) {
                            handleUpdateName();
                          }
                        }}
                        className={cn(
                          "text-2xl font-black tracking-tight h-10 focus-visible:ring-primary",
                          editError ? "border-destructive text-destructive focus-visible:ring-destructive" : "border-primary"
                        )}
                        disabled={updateMe.isPending}
                      />
                      {updateMe.isPending && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                    </div>
                    {editError && <p className="text-xs text-destructive font-bold">{editError}</p>}
                  </div>
                ) : (
                  <CardTitle 
                    className="text-3xl font-black tracking-tight cursor-text hover:text-primary transition-colors border-b-2 border-transparent hover:border-primary/30"
                    onDoubleClick={() => setIsEditing(true)}
                    title="Double-click to edit username"
                  >
                    {user.username}
                  </CardTitle>
                )}
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

