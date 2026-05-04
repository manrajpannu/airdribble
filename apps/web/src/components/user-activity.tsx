"use client";

import { useMemo } from "react";
import { useUserActivity, useUserActivityFeedInfinite } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Trophy, Loader2, ChevronDown, User, Calendar } from "lucide-react";
import {
  format,
  subDays,
  startOfToday,
  eachDayOfInterval,
  isSameDay,
  eachMonthOfInterval,
  lastDayOfMonth,
  getDay,
  formatDistanceToNow
} from "date-fns";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";

export default function UserActivity() {
  const { data: activityData, isLoading: isActivityLoading } = useUserActivity();
  const {
    data: feedData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isFeedLoading,
  } = useUserActivityFeedInfinite(8);

  const monthData = useMemo(() => {
    const today = startOfToday();
    const startDate = subDays(today, 89); // Last 90 days
    const monthInterval = eachMonthOfInterval({ start: startDate, end: today });

    return monthInterval.map(monthStart => {
      const monthEnd = lastDayOfMonth(monthStart);
      const currentMonthStart = monthStart < startDate ? startDate : monthStart;
      const currentMonthEnd = monthEnd > today ? today : monthEnd;
      const days = eachDayOfInterval({ start: currentMonthStart, end: currentMonthEnd });
      const firstDayOfWeek = getDay(currentMonthStart);
      const padding = Array.from({ length: firstDayOfWeek });

      return {
        label: format(monthStart, "MMMM"),
        padding,
        days: days.map(day => {
          const record = activityData?.find(r => isSameDay(new Date(r.date), day));
          return {
            date: day,
            count: record?.count ?? 0,
            level: record?.level ?? 0,
          };
        })
      };
    });
  }, [activityData]);

  const milestones = feedData?.pages.flatMap((page) => page) ?? [];
  const isLoading = isActivityLoading || isFeedLoading;

  if (isLoading) {
    return (
      <Card className="border-none shadow-none bg-transparent">
        <CardContent className="p-0 space-y-8">
          <div className="space-y-4">
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            <div className="h-32 w-full bg-muted/5 rounded-xl border animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 w-full bg-muted/5 rounded-xl border animate-pulse" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-12">
      {/* Activity Heatmap Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/80">
          <Calendar className="size-3.5" />
          Training Activity
        </div>
        <TooltipProvider delay={0}>
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {monthData.map((month, mIdx) => (
                <div key={mIdx} className="flex flex-col gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 border-b pb-1">
                    {month.label}
                  </span>
                  <div className="grid grid-cols-7 gap-[5px] w-fit">
                    {month.padding.map((_, i) => (
                      <div key={`p-${i}`} className="size-[13px]" />
                    ))}
                    {month.days.map((day, i) => (
                      <Tooltip key={i}>
                        <TooltipTrigger
                          render={
                            <div
                              className={cn(
                                "size-[13px] rounded-[2px] transition-all cursor-pointer hover:scale-125 hover:z-10",
                                day.level === 0 && "bg-muted/60 hover:bg-muted",
                                day.level === 1 && "bg-primary/20 hover:bg-primary/30",
                                day.level === 2 && "bg-primary/40 hover:bg-primary/50",
                                day.level === 3 && "bg-primary/70 hover:bg-primary/80",
                                day.level === 4 && "bg-primary hover:bg-primary/90"
                              )}
                            />
                          }
                        />
                        <TooltipContent side="top" className="text-[10px] py-1 px-2">
                          <span className="font-bold">{day.count} sessions</span> on {format(day.date, "MMM do, yyyy")}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-start gap-1.5 text-[9px] font-bold text-muted-foreground/30 uppercase tracking-tighter">
              <span>Less</span>
              {[0, 1, 2, 3, 4].map(level => (
                <div
                  key={level}
                  className={cn(
                    "size-[10px] rounded-[1px]",
                    level === 0 && "bg-muted/60",
                    level === 1 && "bg-primary/20",
                    level === 2 && "bg-primary/40",
                    level === 3 && "bg-primary/70",
                    level === 4 && "bg-primary"
                  )}
                />
              ))}
              <span>More</span>
            </div>
          </div>
        </TooltipProvider>
      </section>

      {/* Milestones Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/80">
          <Trophy className="size-3.5" />
          Milestones
        </div>
        <div className="space-y-2">
          {milestones.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground italic border rounded-2xl bg-muted/5">
              No milestones yet. Keep training!
            </div>
          ) : (
            milestones.map((activity) => (
              <div
                key={activity.id}
                className="group relative flex items-center gap-4 p-4 rounded-2xl border bg-card/40 hover:bg-muted/50 transition-all duration-200"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted/50 border text-muted-foreground group-hover:text-primary group-hover:border-primary/20 transition-all shadow-sm overflow-hidden">
                  <User className="size-5" />
                </div>
                <div className="flex flex-1 flex-col min-w-0 pr-16">
                  <h4 className="font-bold text-sm tracking-tight truncate">
                    {activity.type === 'first_score' ? 'Initial Record' : 'Personal Best'}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate leading-relaxed">
                    Scored <span className="font-bold text-foreground/80">{activity.score.toLocaleString()}</span> on <span className="font-medium text-foreground/70">{activity.challenge_name}</span>
                  </p>
                </div>
                <div className="absolute top-5 right-5 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-tighter">
                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                </div>
              </div>
            ))
          )}

          {hasNextPage && (
            <div className="pt-4">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 gap-2 h-10 rounded-2xl border border-dashed"
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
      </section>
    </div>
  );
}
