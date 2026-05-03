"use client";

import { useMe, useRanks } from "@/hooks/use-api";
import { User, Calendar, MapPin, Trophy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
  const { data: user, isLoading: isUserLoading } = useMe();
  const { data: ranks, isLoading: isRanksLoading } = useRanks();

  if (isUserLoading || isRanksLoading) {
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
      </div>
    </div>
  );
}
