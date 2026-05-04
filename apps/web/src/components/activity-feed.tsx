"use client";

import { useUserActivityFeedInfinite } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Loader2, ChevronDown, User } from "lucide-react";
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
      <Card className="h-full border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0 pb-4">
          <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
            <Trophy className="size-4" />
            Milestones
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border bg-muted/5 animate-pulse">
                <div className="size-10 rounded-full bg-muted" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-1/2 bg-muted rounded" />
                  <div className="h-2 w-1/3 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-4">
        <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
          <Trophy className="size-4" />
          Milestones
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-[450px]">
          <div className="space-y-2 pr-4">
            {activities.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground italic border rounded-xl bg-muted/5">
                No high scores yet. Time to hit the field!
              </div>
            ) : (
              activities.map((activity) => (
                <div 
                  key={activity.id} 
                  className="group relative flex items-center gap-3 p-3 rounded-xl border bg-card/40 hover:bg-muted/50 transition-all duration-200"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted/50 border text-muted-foreground group-hover:text-primary group-hover:border-primary/20 transition-all shadow-sm overflow-hidden">
                    <User className="size-5" />
                  </div>
                  <div className="flex flex-1 flex-col min-w-0 pr-12">
                    <h4 className="font-bold text-[13px] tracking-tight truncate">
                      {activity.type === 'first_score' ? 'Initial Record' : 'Personal Best'}
                    </h4>
                    <p className="text-[11px] text-muted-foreground truncate leading-relaxed">
                      Scored <span className="font-bold text-foreground/80">{activity.score.toLocaleString()}</span> on <span className="font-medium text-foreground/70">{activity.challenge_name}</span>
                    </p>
                  </div>
                  <div className="absolute top-3.5 right-4 text-[9px] font-bold text-muted-foreground/50 uppercase tracking-tighter">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </div>
                </div>
              ))
            )}

            {hasNextPage && (
              <div className="pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 gap-2 h-9 rounded-xl border border-dashed"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <ChevronDown className="size-3 transition-transform group-hover:translate-y-0.5" />
                  )}
                  {isFetchingNextPage ? "Loading..." : "View Older Activity"}
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
