"use client";

import { useState, useEffect, useCallback } from "react";
import { JSX } from "react";
import Image from "next/image";
import { Card } from "./Card";
import { Button } from "./Button";
import { fetchLeaderboard } from "@/lib/leaderboard";
import { useMiniKit } from '@coinbase/onchainkit/minikit';

type Team = "nigeria" | "ghana";
type LeaderboardEntry = {
  id: string;
  team: Team;
  playerName: string;
  score: number;
  timestamp: number;
  fid?: string; // Farcaster user ID
  isVerifiedUser?: boolean; // Whether the user was authenticated via Farcaster
};

// Extracted reusable team table component
interface TeamTableProps {
  entries: LeaderboardEntry[];
  teamColor: string;
  context: any;
}

function TeamTable({ entries, teamColor, context }: TeamTableProps) {
  if (entries.length === 0) {
    return <p className="text-center py-2">No scores</p>;
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-black">
        <thead>
          <tr className={`bg-${teamColor}-300 border-b border-black`}>
            <th className="px-2 py-1 text-left text-black font-bold">#</th>
            <th className="px-2 py-1 text-left text-black font-bold">Player</th>
            <th className="px-2 py-1 text-right text-black font-bold">Pts</th>
          </tr>
        </thead>
        <tbody className="text-black">
          {entries.map((entry, index) => {
            const isCurrentUser = context?.user?.fid && entry.fid === String(context.user.fid);
            return (
              <tr 
                key={entry.id} 
                className={`${index % 2 === 0 ? "bg-cream-100" : ""} ${isCurrentUser ? `bg-${teamColor}-50` : ""}`}
                style={{borderBottom: "1px solid #eee"}}
              >
                <td className="px-2 py-1">{index + 1}</td>
                <td className="px-2 py-1">
                  <div className="flex items-center gap-2">
                    {isCurrentUser && context?.user?.pfpUrl ? (
                      <div className="relative w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                        <Image
                          src={context.user.pfpUrl}
                          alt={context.user.displayName || entry.playerName}
                          width={100}
                          height={100}
                          className="object-cover w-full h-full"
                          quality={100}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      entry.isVerifiedUser && <span className={`text-xs bg-${teamColor}-300 rounded-full w-5 h-5 flex items-center justify-center`}>✓</span>
                    )}
                    <span className={isCurrentUser ? "font-semibold" : ""}>
                      {isCurrentUser && context?.user?.displayName ? 
                        context.user.displayName : entry.playerName}
                      {isCurrentUser && " (You)"}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-1 text-right font-medium">{entry.score}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function LeaderboardModal(): JSX.Element {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | "all">("all");
  
  // Get Farcaster context
  const { context } = useMiniKit();
  
  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useCallback(() => {
    // This reference lets us track if the component is still mounted
    let isMounted = true;
    return {
      current: () => isMounted,
      cleanup: () => { isMounted = false; }
    };
  }, []);

  // Memoize loadLeaderboard function to prevent recreating it on every render
  const loadLeaderboard = useCallback(async (mountedRef: { current: () => boolean }) => {
    try {
      const scores = await fetchLeaderboard();
      // Only update state if component is still mounted
      if (mountedRef.current()) {
        setLeaderboard(scores);
      }
    } catch (error) {
      console.error("Error loading leaderboard:", error);
      // Only update state if component is still mounted
      if (mountedRef.current()) {
        setLeaderboard([]);
      }
    }
  }, []);
  
  useEffect(() => {
    // Create a mounted reference for this effect
    const mountedRef = isMountedRef();
    
    // Load leaderboard when component mounts
    loadLeaderboard(mountedRef);
    
    // Refresh leaderboard data every 60 seconds
    const intervalId = setInterval(() => {
      loadLeaderboard(mountedRef);
    }, 60000);
    
    // Clean up interval when component unmounts
    return () => {
      clearInterval(intervalId);
      mountedRef.cleanup();
    };
  }, [loadLeaderboard, isMountedRef]);
  
  const filteredScores = leaderboard.filter(
    entry => selectedTeam === "all" || entry.team === selectedTeam
  );
  
  // Deduplicate scores by fid (keeping the highest score)  
  const deduplicateScores = (scores: LeaderboardEntry[]) => {
    // Create a map to track highest score per user
    const userBestScores = new Map<string, LeaderboardEntry>();
    
    scores.forEach(entry => {
      const userId = entry.fid || entry.playerName; // Use fid if available, else name
      
      // If we haven't seen this user or this score is higher than previous best
      if (!userBestScores.has(userId) || entry.score > userBestScores.get(userId)!.score) {
        userBestScores.set(userId, entry);
      }
    });
    
    // Convert back to array and sort by score
    return Array.from(userBestScores.values()).sort((a, b) => b.score - a.score);
  };
  
  const sortedScores = deduplicateScores([...filteredScores]);
  
  const nigeriaScores = deduplicateScores(
    leaderboard.filter(entry => entry.team === "nigeria")
  );
  
  const ghanaScores = deduplicateScores(
    leaderboard.filter(entry => entry.team === "ghana")
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="my-8 text-center">
        <h1 className="text-3xl font-extrabold text-black mb-4 uppercase">Leaderboard</h1>
        <p className="text-black font-bold">See who's cooking the best Jollof in town!</p>
      </div>
      
      <div className="flex justify-center mb-6">
        <div className="inline-flex rounded-md shadow-sm">
          <Button 
            variant={selectedTeam === "all" ? "primary" : "outline"}
            onClick={() => setSelectedTeam("all")}
            className="rounded-r-none"
          >
            All
          </Button>
          <Button 
            variant={selectedTeam === "nigeria" ? "primary" : "outline"}
            onClick={() => setSelectedTeam("nigeria")}
            className="rounded-none border-l-0 border-r-0"
          >
            Nigeria
          </Button>
          <Button 
            variant={selectedTeam === "ghana" ? "primary" : "outline"}
            onClick={() => setSelectedTeam("ghana")}
            className="rounded-l-none text-black"
          >
            Ghana
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {selectedTeam !== "ghana" && (
          <Card title="🇳🇬" className="mb-6">
            <TeamTable entries={nigeriaScores} teamColor="yellow" context={context} />
          </Card>
        )}
        
        {selectedTeam !== "nigeria" && (
          <Card title="🇬🇭" className="mb-6">
            <TeamTable entries={ghanaScores} teamColor="green" context={context} />
          </Card>
        )}
      </div>
    </div>
  );
}
