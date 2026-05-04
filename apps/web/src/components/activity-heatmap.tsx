"use client";

import { useMemo } from "react";
import { useUserActivity } from "@/hooks/use-api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  format,
  subDays,
  startOfToday,
  eachDayOfInterval,
  isSameDay,
  eachMonthOfInterval,
  lastDayOfMonth,
  getDay
} from "date-fns";

export default function ActivityHeatmap() {
  const { data: activity, isLoading } = useUserActivity();

  const monthData = useMemo(() => {
    const today = startOfToday();
    const startDate = subDays(today, 89); // Last 90 days
    const monthInterval = eachMonthOfInterval({ start: startDate, end: today });

    return monthInterval.map(monthStart => {
      const monthEnd = lastDayOfMonth(monthStart);

      // Determine the start and end for this specific month block
      // We clamp it to the 90-day window and to "today"
      const currentMonthStart = monthStart < startDate ? startDate : monthStart;
      const currentMonthEnd = monthEnd > today ? today : monthEnd;

      const days = eachDayOfInterval({ start: currentMonthStart, end: currentMonthEnd });

      // Calculate padding for the first row of the month (Sunday to first day of month)
      const firstDayOfWeek = getDay(currentMonthStart); // 0 = Sunday, 6 = Saturday
      const padding = Array.from({ length: firstDayOfWeek });

      return {
        label: format(monthStart, "MMMM"),
        padding,
        days: days.map(day => {
          const record = activity?.find(r => isSameDay(new Date(r.date), day));
          return {
            date: day,
            count: record?.count ?? 0,
            level: record?.level ?? 0,
          };
        })
      };
    });
  }, [activity]);

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
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {monthData.map((month, mIdx) => (
                <div key={mIdx} className="flex flex-col gap-3">
                  <span className="text-[11px] font-black uppercase tracking-widest text-primary/70 border-b border-primary/10 pb-1">
                    {month.label}
                  </span>
                  <div className="grid grid-cols-7 gap-[4px] w-fit">
                    {/* Padding for days before the start of our range in this month */}
                    {month.padding.map((_, i) => (
                      <div key={`p-${i}`} className="size-[12px]" />
                    ))}

                    {/* Actual activity squares */}
                    {month.days.map((day, i) => (
                      <Tooltip key={i}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "size-[12px] rounded-[2px] transition-all cursor-pointer hover:scale-125 hover:z-10",
                              day.level === 0 && "bg-muted/80 hover:bg-muted",
                              day.level === 1 && "bg-accent/20 hover:bg-accent/30",
                              day.level === 2 && "bg-accent/40 hover:bg-accent/50",
                              day.level === 3 && "bg-accent/70 hover:bg-accent/80",
                              day.level === 4 && "bg-accent hover:bg-accent/90"
                            )}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-[10px] py-1 px-2">
                          <span className="font-bold">{day.count} sessions</span> on {format(day.date, "MMM do, yyyy")}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground mt-2 border-t pt-4">
              <span>Less</span>
              <div className="size-[10px] rounded-[1px] bg-muted/40" />
              <div className="size-[10px] rounded-[1px] bg-accent/20" />
              <div className="size-[10px] rounded-[1px] bg-accent/40" />
              <div className="size-[10px] rounded-[1px] bg-accent/70" />
              <div className="size-[10px] rounded-[1px] bg-accent" />
              <span>More</span>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
