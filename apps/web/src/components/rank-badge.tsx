"use client";

import { useMemo, useState } from "react";
import { useRanks, useUpdateMe } from "@/hooks/use-api";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface RankBadgeProps {
  currentRankId: number | null;
  onUpdate?: () => void;
}

export function RankBadge({ currentRankId, onUpdate }: RankBadgeProps) {
  const { data: ranks, isLoading: isRanksLoading } = useRanks();
  const updateMe = useUpdateMe();
  const [search, setSearch] = useState("");

  const currentRank = ranks?.find((r) => r.id === currentRankId);

  const uniqueFilteredRanks = useMemo(() => {
    if (!ranks) return [];
    
    const searchFiltered = ranks.filter((r) => 
      r.name.toLowerCase().includes(search.toLowerCase())
    );

    const seen = new Set();
    return searchFiltered.filter((r) => {
      const key = `${r.name}-${r.tier_number}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [ranks, search]);

  const handleUpdate = async (rankId: number) => {
    try {
      await updateMe.mutateAsync({ rank_id: rankId });
      onUpdate?.();
    } catch (err) {
      console.error("Failed to update rank:", err);
    }
  };

  if (isRanksLoading) {
    return <Badge variant="secondary" className="animate-pulse">Loading Rank...</Badge>;
  }

  const getRankStyles = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("bronze")) return "bg-[#cd7f32] text-white border-[#b87333] hover:bg-[#b87333]";
    if (n.includes("silver")) return "bg-[#c0c0c0] text-[#333] border-[#a9a9a9] hover:bg-[#a9a9a9]";
    if (n.includes("gold")) return "bg-[#ffd700] text-[#333] border-[#e6c200] hover:bg-[#e6c200]";
    if (n.includes("platinum")) return "bg-[#e5e4e2] text-[#333] border-[#d1d0ce] hover:bg-[#d1d0ce]";
    if (n.includes("diamond")) return "bg-[#b9f2ff] text-[#333] border-[#a0e9ff] hover:bg-[#a0e9ff]";
    if (n.includes("champion")) return "bg-[#9d4edd] text-white border-[#7b2cbf] hover:bg-[#7b2cbf]";
    if (n.includes("grand champion")) return "bg-[#ff4d6d] text-white border-[#ff0054] hover:bg-[#ff0054]";
    if (n.includes("super-sonic legend") || n.includes("ssl")) return "bg-white text-black border shadow-[0_0_10px_rgba(255,255,255,0.5)] hover:bg-white/90";
    return "bg-muted text-muted-foreground";
  };

  return (
    <DropdownMenu>
      <TooltipProvider delay={200}>
        <Tooltip>
          <TooltipTrigger
            render={
              <DropdownMenuTrigger
                render={
                  <button type="button" className="outline-none">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "cursor-pointer transition-all hover:scale-105 px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                        currentRank ? getRankStyles(currentRank.name) : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Trophy className="size-3 mr-1.5 opacity-70" />
                      {currentRank ? `${currentRank.name} ${currentRank.tier_number ?? ""}` : "Unranked"}
                    </Badge>
                  </button>
                }
              />
            }
          />
          <TooltipContent side="bottom" align="center" className="text-[10px] font-bold uppercase tracking-widest py-1.5 px-3">
            choose your ingame rocket league rank
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent className="w-56 p-2" align="start">
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input 
            placeholder="Search ranks..." 
            className="pl-8 h-8 text-xs bg-muted/30 border-none" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-[300px] overflow-y-auto overflow-x-hidden space-y-0.5 pr-1">
          {uniqueFilteredRanks.map((rank) => (
            <DropdownMenuItem 
              key={rank.id}
              onClick={() => handleUpdate(rank.id)}
              className={cn(
                "text-xs flex items-center justify-between py-2 cursor-pointer rounded-lg",
                rank.id === currentRankId && "bg-accent font-bold"
              )}
            >
              <div className="flex items-center gap-2">
                <div className={cn("size-2 rounded-full", getRankStyles(rank.name).split(" ")[0])} />
                <span>{rank.name} {rank.tier_number ?? ""}</span>
              </div>
              {updateMe.isPending && rank.id === currentRankId && (
                <Loader2 className="size-3 animate-spin" />
              )}
            </DropdownMenuItem>
          ))}
          {uniqueFilteredRanks.length === 0 && (
            <div className="py-8 text-center text-xs text-muted-foreground italic">
              No ranks match your search
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
