"use client";

import { useState, useEffect } from "react";
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

export function LeaderboardModal() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | "all">("all");
  
  // Get Farcaster context
  const { context } = useMiniKit();
  
  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const scores = await fetchLeaderboard();
        setLeaderboard(scores);
      } catch (error) {
        console.error("Error loading leaderboard:", error);
        setLeaderboard([]);
      }
    }
    
    loadLeaderboard();
  }, []);
  
  const filteredScores = leaderboard.filter(
    entry => selectedTeam === "all" || entry.team === selectedTeam
  );
  
  const sortedScores = [...filteredScores].sort((a, b) => b.score - a.score);
  
  const nigeriaScores = leaderboard.filter(entry => entry.team === "nigeria")
    .sort((a, b) => b.score - a.score);
  
  const ghanaScores = leaderboard.filter(entry => entry.team === "ghana")
    .sort((a, b) => b.score - a.score);

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
            {nigeriaScores.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-black">
                  <thead>
                    <tr className="bg-yellow-300 border-b border-black">
                      <th className="px-2 py-1 text-left text-black font-bold">#</th>
                      <th className="px-2 py-1 text-left text-black font-bold">Player</th>
                      <th className="px-2 py-1 text-right text-black font-bold">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nigeriaScores.map((entry, index) => {
                      const isCurrentUser = context?.user?.fid && entry.fid === String(context.user.fid);
                      return (
                        <tr key={entry.id} className={`${index % 2 === 0 ? "bg-cream-100" : ""} ${isCurrentUser ? "bg-yellow-50" : ""}`} style={{borderBottom: "1px solid #eee"}}>
                          <td className="px-2 py-1">{index + 1}</td>
                          <td className="px-2 py-1">
                            <div className="flex items-center gap-2">
                              {isCurrentUser && context?.user?.pfpUrl ? (
                                <div className="relative w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                                  <Image
                                    src={context.user.pfpUrl}
                                    alt={context.user.displayName || entry.playerName}
                                    width={20}
                                    height={20}
                                    className="object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                    }}
                                  />
                                </div>
                              ) : (
                                entry.isVerifiedUser && <span className="text-xs bg-yellow-300 rounded-full w-5 h-5 flex items-center justify-center">✓</span>
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
            ) : (
              <p className="text-center py-2">No scores</p>
            )}
          </Card>
        )}
        
        {selectedTeam !== "nigeria" && (
          <Card title="🇬🇭" className="mb-6">
            {ghanaScores.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-black">
                  <thead>
                    <tr className="bg-green-300 border-b border-black">
                      <th className="px-2 py-1 text-left text-black font-bold">#</th>
                      <th className="px-2 py-1 text-left text-black font-bold">Player</th>
                      <th className="px-2 py-1 text-right text-black font-bold">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ghanaScores.map((entry, index) => {
                      const isCurrentUser = context?.user?.fid && entry.fid === String(context.user.fid);
                      return (
                        <tr key={entry.id} className={`${index % 2 === 0 ? "bg-cream-100" : ""} ${isCurrentUser ? "bg-green-50" : ""}`} style={{borderBottom: "1px solid #eee"}}>
                          <td className="px-2 py-1">{index + 1}</td>
                          <td className="px-2 py-1">
                            <div className="flex items-center gap-2">
                              {isCurrentUser && context?.user?.pfpUrl ? (
                                <div className="relative w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                                  <Image
                                    src={context.user.pfpUrl}
                                    alt={context.user.displayName || entry.playerName}
                                    width={20}
                                    height={20}
                                    className="object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                    }}
                                  />
                                </div>
                              ) : (
                                entry.isVerifiedUser && <span className="text-xs bg-green-300 rounded-full w-5 h-5 flex items-center justify-center">✓</span>
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
            ) : (
              <p className="text-center py-2">No scores</p>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
