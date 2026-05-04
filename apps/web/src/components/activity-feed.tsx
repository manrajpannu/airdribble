"use client";

import { useUserActivityFeedInfinite } from "@/hooks/use-api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Clock, Loader2, ChevronDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "./ui/scroll-area";

export default function ActivityFeed() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useUserActivityFeedInfinite(5);

  const activities = data?.pages.flatMap((page) => page) ?? [];

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="size-5 " />
            Milestones
          </CardTitle>
          <CardDescription>Your latest personal bests and records.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="size-10 rounded-full bg-muted" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-1/2 bg-muted rounded" />
                  <div className="h-3 w-1/4 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="size-5 text-accent" />
          Milestones
        </CardTitle>
        <CardDescription>Your latest personal bests and records.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-[400px] px-6">
          <div className="space-y-6 pb-6">
            {activities.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground italic">
                No high scores yet. Time to hit the field!
              </div>
            ) : (
              activities.map((activity, i) => (
                <div key={activity.id} className="relative pl-8 before:absolute before:left-[11px] before:top-2 before:bottom-[-24px] before:w-[2px] before:bg-muted last:before:hidden">
                  <div className="absolute left-0 top-1 size-6 rounded-full bg-accent/20 flex items-center justify-center ring-4 ring-background">
                    <Trophy className="size-3 text-accent" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm tracking-tight">
                        New High Score!
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium uppercase tracking-wider">
                        <Clock className="size-3" />
                        {formatDistanceToNow(new Date(activity.created_at + "Z"), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      You reached a score of <span className="text-foreground font-bold">{activity.score.toLocaleString()}</span> on <span className="text-accent font-semibold">{activity.challenge_name}</span>.
                    </p>
                  </div>
                </div>
              ))
            )}

            {hasNextPage && (
              <div className="pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground hover:text-accent hover:bg-accent/5 gap-2 group"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <ChevronDown className="size-3 transition-transform group-hover:translate-y-0.5" />
                  )}
                  {isFetchingNextPage ? "Loading..." : "Show More"}
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
