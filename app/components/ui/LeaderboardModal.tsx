"use client";

import { useState, useEffect, useCallback } from "react";
import { JSX } from "react";
import Image from "next/image";
import { Card } from "./Card";
import { Button } from "./Button";
import { ENSProfile } from "./ENSProfile";
import { TeamFollowButton } from "./TeamFollowButton";
import { fetchLeaderboard } from "@/lib/leaderboard";
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { useAccount } from 'wagmi';

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
  context: ReturnType<typeof useMiniKit>['context'];
  isLoading?: boolean;
  userAddress?: string; // Current user wallet address
}

function TeamTable({ entries, teamColor, context, userAddress, isLoading = false }: TeamTableProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center py-4">
        <div className="animate-pulse mb-2">
          <div className="h-6 w-6 rounded-full bg-gray-300"></div>
        </div>
        <p className="text-sm text-gray-500">Loading scores...</p>
      </div>
    );
  }
  
  if (entries.length === 0) {
    return <p className="text-center py-2 text-black">No scores</p>;
  }
  
  // Determine if we should show team indicators (for combined view)
  const showTeamIndicators = entries.some(entry => entry.team === "nigeria") && 
                             entries.some(entry => entry.team === "ghana");
  
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
            // Check if this entry belongs to the current user (via Farcaster or wallet)
            const isCurrentUserFarcaster = context?.user?.fid && entry.fid === String(context.user.fid);
            const isCurrentUserWallet = userAddress && entry.playerName.toLowerCase().includes(userAddress.slice(-4).toLowerCase());
            const isCurrentUser = isCurrentUserFarcaster || isCurrentUserWallet;
            
            // Create a name display with priority:
            // 1. Current user's display name from MiniKit context
            // 2. Player name stored in the entry
            const displayName = isCurrentUser && context?.user?.displayName
              ? context.user.displayName
              : entry.playerName;
              
            // Create a username display if available
            const username = isCurrentUser && context?.user?.username
              ? `@${context.user.username}`
              : null;
              
            return (
              <tr 
                key={entry.id} 
                className={`${index % 2 === 0 ? "bg-cream-100" : ""} ${isCurrentUser ? `bg-${teamColor}-50` : ""}`}
                style={{borderBottom: "1px solid #eee"}}
              >
                <td className="px-2 py-1">{index + 1}</td>
                <td className="px-2 py-1">
                  <div className="flex items-center gap-2">
                    {/* Avatar display - Use ENS Profile for wallet addresses */}
                    {!entry.fid && entry.playerName && entry.playerName.startsWith('0x') ? (
                      <ENSProfile 
                        address={entry.playerName as `0x${string}`} 
                        showAddress={false}
                        className="flex-shrink-0"
                      />
                    ) : isCurrentUser && context?.user?.pfpUrl ? (
                      <div className="relative w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                        <Image
                          src={context.user.pfpUrl}
                          alt={displayName}
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
                      /* Show verification checkmark for any verified user (including current) */
                      entry.isVerifiedUser && (
                        <div className={`flex-shrink-0 text-xs bg-${teamColor}-300 rounded-full w-5 h-5 flex items-center justify-center text-white`}>✓</div>
                      )
                    )}
                    
                    {/* Name and username */}
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        {/* Show team flag indicator in combined view */}
                        {showTeamIndicators && (
                          <span className="text-sm" title={entry.team === "nigeria" ? "Nigeria" : "Ghana"}>
                            {entry.team === "nigeria" ? "🇳🇬" : "🇬🇭"}
                          </span>
                        )}
                        <span className={isCurrentUser ? "font-semibold" : ""}>
                          {displayName}{isCurrentUser && " (You)"}
                        </span>
                      </div>
                      {/* Show Farcaster username for verified users */}
                      {(username || entry.fid) && (
                        <span className="text-xs text-gray-500">
                          {username || (entry.fid ? `#${entry.fid}` : null)}
                        </span>
                      )}
                    </div>
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Get Farcaster context and wallet address
  const { context } = useMiniKit();
  const { address } = useAccount();
  
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
    if (mountedRef.current()) {
      setIsLoading(true);
    }
    
    try {
      const scores = await fetchLeaderboard();
      // Only update state if component is still mounted
      if (mountedRef.current()) {
        setLeaderboard(scores);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error loading leaderboard:", error);
      // Only update state if component is still mounted
      if (mountedRef.current()) {
        setLeaderboard([]);
        setIsLoading(false);
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
  
  // Calculate total scores by country to determine who has the best jollof
  const nigeriaTotalScore = nigeriaScores.reduce((total, entry) => total + entry.score, 0);
  const ghanaTotalScore = ghanaScores.reduce((total, entry) => total + entry.score, 0);
  
  const bestJollofCountry = nigeriaTotalScore > ghanaTotalScore ? "Nigeria" : "Ghana";
  const bestJollofFlag = nigeriaTotalScore > ghanaTotalScore ? "🇳🇬" : "🇬🇭";
  const bestJollofColor = nigeriaTotalScore > ghanaTotalScore ? "yellow" : "green";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="my-8 text-center">
        <h1 className="text-3xl font-extrabold text-black mb-4 uppercase">Leaderboard</h1>
        <p className="text-black font-bold">See who&apos;s cooking the best Jollof in town!</p>
        
        {/* Display country with best jollof based on total score */}
        {!isLoading && leaderboard.length > 0 && (
          <div className="mt-4 py-2 px-4 rounded-lg inline-flex items-center bg-white text-black shadow-md">
            <span className="text-lg mr-2">{bestJollofFlag}</span>
            <span className={`font-bold text-${bestJollofColor}-600`}>{bestJollofCountry}</span> 
            <span className="ml-1">makes the best jollof! ({nigeriaTotalScore > ghanaTotalScore ? nigeriaTotalScore : ghanaTotalScore} pts)</span>
          </div>
        )}
        
        {/* Team follow buttons */}
        {address && (
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <TeamFollowButton team="ghana" className="w-48" />
            <TeamFollowButton team="nigeria" className="w-48" />
          </div>
        )}
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
      
      {selectedTeam === "all" ? (
        // Combined leaderboard for "All" tab
        <div className="mx-auto max-w-lg">
          <Card title="Combined Leaderboard" className="mb-6">
            <TeamTable 
              entries={sortedScores} 
              teamColor="gray" 
              context={context}
              userAddress={address} 
              isLoading={isLoading}
            />
          </Card>
        </div>
      ) : (
        // Individual team views for Nigeria/Ghana tabs
        <div className="grid gap-6 md:grid-cols-2">
          {selectedTeam === "nigeria" && (
            <Card title="🇳🇬" className="mb-6">
              <TeamTable 
                entries={nigeriaScores} 
                teamColor="yellow" 
                context={context}
                userAddress={address} 
                isLoading={isLoading}
              />
            </Card>
          )}
          
          {selectedTeam === "ghana" && (
            <Card title="🇬🇭" className="mb-6">
              <TeamTable 
                entries={ghanaScores} 
                teamColor="green" 
                context={context}
                userAddress={address} 
                isLoading={isLoading}
              />
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
