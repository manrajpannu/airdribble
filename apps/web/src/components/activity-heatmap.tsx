"use client";

import { useMemo } from "react";
import { useUserActivity } from "@/hooks/use-api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { format, subDays, startOfToday, eachDayOfInterval, isSameDay } from "date-fns";

export default function ActivityHeatmap() {
  const { data: activity, isLoading } = useUserActivity();

  const days = useMemo(() => {
    const today = startOfToday();
    const startDate = subDays(today, 89); // Last 90 days
    return eachDayOfInterval({ start: startDate, end: today });
  }, []);

  const gridData = useMemo(() => {
    if (!activity) return days.map(day => ({ date: day, count: 0, level: 0 }));

    return days.map(day => {
      const record = activity.find(r => isSameDay(new Date(r.date), day));
      return {
        date: day,
        count: record?.count ?? 0,
        level: record?.level ?? 0,
      };
    });
  }, [activity, days]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
          <CardDescription>Your training frequency over the last 90 days.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-32 w-full animate-pulse bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
        <CardDescription>Your training frequency over the last 90 days.</CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider delayDuration={0}>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-[3px] justify-start">
              {gridData.map((day, i) => (
                <Tooltip key={i}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "size-[10px] rounded-[2px] transition-colors cursor-pointer",
                        day.level === 0 && "bg-muted hover:bg-muted/80",
                        day.level === 1 && "bg-primary/20 hover:bg-primary/30",
                        day.level === 2 && "bg-primary/40 hover:bg-primary/50",
                        day.level === 3 && "bg-primary/70 hover:bg-primary/80",
                        day.level === 4 && "bg-primary hover:bg-primary/90"
                      )}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-[10px] py-1 px-2">
                    <span className="font-bold">{day.count} sessions</span> on {format(day.date, "MMM do, yyyy")}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
            <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground mt-2">
              <span>Less</span>
              <div className="size-[8px] rounded-[1px] bg-muted" />
              <div className="size-[8px] rounded-[1px] bg-primary/20" />
              <div className="size-[8px] rounded-[1px] bg-primary/40" />
              <div className="size-[8px] rounded-[1px] bg-primary/70" />
              <div className="size-[8px] rounded-[1px] bg-primary" />
              <span>More</span>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
