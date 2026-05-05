"use client";

import { use } from "react";
import { usePublicProfile, usePublicUserActivity, usePublicUserActivityFeed, useUserRanks } from "@/hooks/use-api";
import { User, Calendar, MapPin, Trophy, ArrowLeft, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { RankBadge } from "@/components/rank-badge";
import { ScenarioRankBadge } from "@/components/scenario-rank-badge";
import { calculateAimlabsPercentile } from "@/lib/scenario-ranks";
import Link from "next/link";
import { useMemo } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  format,
  subDays,
  startOfToday,
  eachDayOfInterval,
  isSameDay,
  eachMonthOfInterval,
  lastDayOfMonth,
  getDay,
  formatDistanceToNow,
} from "date-fns";
import { cn } from "@/lib/utils";

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const decodedUsername = decodeURIComponent(username);

  const { data: user, isLoading, isError } = usePublicProfile(decodedUsername);
  const { data: activityData, isLoading: isActivityLoading } = usePublicUserActivity(decodedUsername);
  const { data: feedData, isLoading: isFeedLoading } = usePublicUserActivityFeed(decodedUsername, 10, 0);
  const { data: userRanks, isLoading: isRanksLoading } = useUserRanks(decodedUsername);

  const monthData = useMemo(() => {
    const today = startOfToday();
    const startDate = subDays(today, 89);
    const monthInterval = eachMonthOfInterval({ start: startDate, end: today });

    return monthInterval.map((monthStart) => {
      const monthEnd = lastDayOfMonth(monthStart);
      const currentMonthStart = monthStart < startDate ? startDate : monthStart;
      const currentMonthEnd = monthEnd > today ? today : monthEnd;
      const days = eachDayOfInterval({ start: currentMonthStart, end: currentMonthEnd });
      const firstDayOfWeek = getDay(currentMonthStart);
      const padding = Array.from({ length: firstDayOfWeek });

      return {
        label: format(monthStart, "MMMM"),
        padding,
        days: days.map((day) => {
          const record = activityData?.find((r) => isSameDay(new Date(r.date), day));
          return { date: day, count: record?.count ?? 0, level: record?.level ?? 0 };
        }),
      };
    });
  }, [activityData]);

  if (isLoading || isActivityLoading || isFeedLoading) {
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

  if (isError || !user) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center mt-12 gap-4">
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-6 text-center max-w-md">
          <p className="text-sm text-destructive font-medium mb-1">Player not found</p>
          <p className="text-xs text-destructive/70 mb-4">
            No player with the username <span className="font-bold">&ldquo;{decodedUsername}&rdquo;</span> exists.
          </p>
          <Link href="/profile" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <ArrowLeft className="size-3.5 mr-2" />
            Back to my profile
          </Link>
        </div>
      </div>
    );
  }

  const createdAt = user.created_at ? new Date(user.created_at).toLocaleDateString() : "Unknown";

  return (
    <div className="flex-1 p-6 lg:p-12 max-w-4xl mx-auto w-full">
      <div className="flex flex-col gap-12">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link 
              href="/profile" 
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "mb-3 -ml-2 text-muted-foreground"
              )}
            >
              <ArrowLeft className="size-3.5 mr-1.5" />
              My Profile
            </Link>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Player Profile</h1>
            <p className="text-muted-foreground text-sm">Viewing {user.username}&apos;s stats and activity.</p>
          </div>
        </div>

        {/* Identity card */}
        <Card className="border-none shadow-none bg-transparent p-6">
          <CardHeader className="flex flex-row items-center gap-6 px-0 pb-2">
            <div className="flex items-center justify-center size-20 rounded-full bg-primary/10 border-4 border-background shadow-sm">
              <User className="size-10 text-primary" />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <div className="flex items-center gap-3">
                <CardTitle className="text-3xl font-black tracking-tight">
                  {user.username}
                </CardTitle>
                <RankBadge currentRankId={user.rank_id} interactive={false} />
              </div>
              <CardDescription className="font-medium">Guest Account • Joined {createdAt}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              <div className="flex flex-col gap-1 p-5 rounded-2xl bg-muted/30 border">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <MapPin className="size-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Region</span>
                </div>
                <span className="text-lg font-bold">{user.location || "Global"}</span>
              </div>
              <div className="flex flex-col gap-1 p-5 rounded-2xl bg-muted/30 border">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Calendar className="size-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Status</span>
                </div>
                <span className="text-lg font-bold text-emerald-500">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rank Overview */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Target className="size-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Scenario Rank Overview</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {isRanksLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse bg-muted/20">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="h-4 w-24 bg-muted rounded" />
                    <div className="h-6 w-16 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))
            ) : userRanks && userRanks.length > 0 ? (
              userRanks.map((rank) => {
                const percentile = calculateAimlabsPercentile(rank.rank, rank.total_entries);
                return (
                  <Link 
                    key={rank.challenge_id} 
                    href={`/game/${rank.challenge_slug}`}
                    className="group"
                  >
                    <Card className="hover:border-primary transition-colors bg-muted/10">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold truncate max-w-[120px]">{rank.challenge_title}</span>
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Best: {rank.score}</span>
                        </div>
                        <ScenarioRankBadge percentile={percentile} size="sm" showName={true} />
                      </CardContent>
                    </Card>
                  </Link>
                );
              })
            ) : (
              <div className="col-span-full p-8 rounded-2xl border border-dashed flex flex-col items-center justify-center text-center bg-muted/5">
                <Trophy className="size-8 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground font-medium">No scenarios completed yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Lifetime performance */}
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
                  <div className="flex flex-col items-center p-8 hover:bg-muted/30 group transition-all">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2">Sessions</span>
                    <span className="text-4xl font-black group-hover:scale-110 transition-transform">{user.games_played}</span>
                  </div>
                  <div className="flex flex-col items-center p-8 hover:bg-muted/30 group transition-all">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2">Total Shots</span>
                    <span className="text-4xl font-black group-hover:scale-110 transition-transform">{user.shots}</span>
                  </div>
                  <div className="flex flex-col items-center p-8 hover:bg-muted/30 group transition-all">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2">Total Kills</span>
                    <span className="text-4xl font-black group-hover:scale-110 transition-transform">{user.kills}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Activity heatmap */}
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
                      {month.padding.map((_, i) => <div key={`p-${i}`} className="size-[13px]" />)}
                      {month.days.map((day, i) => (
                        <Tooltip key={i}>
                          <TooltipTrigger render={
                            <div className={cn(
                              "size-[13px] rounded-[2px] transition-all cursor-default hover:scale-125 hover:z-10",
                              day.level === 0 && "bg-muted/60",
                              day.level === 1 && "bg-primary/20",
                              day.level === 2 && "bg-primary/40",
                              day.level === 3 && "bg-primary/70",
                              day.level === 4 && "bg-primary",
                            )} />
                          } />
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
                {[0, 1, 2, 3, 4].map((level) => (
                  <div key={level} className={cn(
                    "size-[10px] rounded-[1px]",
                    level === 0 && "bg-muted/60",
                    level === 1 && "bg-primary/20",
                    level === 2 && "bg-primary/40",
                    level === 3 && "bg-primary/70",
                    level === 4 && "bg-primary",
                  )} />
                ))}
                <span>More</span>
              </div>
            </div>
          </TooltipProvider>
        </section>

        {/* Milestones */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/80">
            <Trophy className="size-3.5" />
            Milestones
          </div>
          <div className="space-y-2">
            {!feedData || feedData.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground italic border rounded-2xl bg-muted/5">
                No milestones yet.
              </div>
            ) : (
              feedData.map((activity) => (
                <div
                  key={activity.id}
                  className="group relative flex items-center gap-4 p-4 rounded-2xl border bg-card/40 hover:bg-muted/50 transition-all duration-200"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted/50 border text-muted-foreground shadow-sm overflow-hidden">
                    <User className="size-5" />
                  </div>
                  <div className="flex flex-1 flex-col min-w-0 pr-16">
                    <h4 className="font-bold text-sm tracking-tight truncate">
                      {activity.type === "first_score" ? "Initial Record" : "Personal Best"}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate leading-relaxed">
                      Scored <span className="font-bold text-foreground/80">{activity.score.toLocaleString()}</span> on{" "}
                      <span className="font-medium text-foreground/70">{activity.challenge_name}</span>
                    </p>
                  </div>
                  <div className="absolute top-5 right-5 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-tighter">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
