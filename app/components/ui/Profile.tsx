"use client";

import { useState, useEffect } from "react";
import { Card } from "./Card";
import { Button } from "./Button";
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { useAccount } from 'wagmi';
import Image from "next/image";
import { ENSProfile } from "./ENSProfile";

type ProfileProps = {
  setActiveTab: (tab: string) => void;
};

// Define player stats interface
interface PlayerStats {
  totalScore: number;
  highScore: number;
  gamesPlayed: number;
  lastGameDate: string;
}

export function Profile({ setActiveTab }: ProfileProps) {
  const { context } = useMiniKit();
  const { address } = useAccount();
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [team, setTeam] = useState<"ghana" | "nigeria" | null>(null);
  
  // Get user name based on context or address
  const userName = context?.user?.username 
    ? `@${context.user.username}`
    : context?.user?.displayName
      ? context.user.displayName
      : address
        ? `${address.slice(0, 6)}...${address.slice(-4)}`
        : "Anonymous Player";

  // Fetch player stats from the API
  useEffect(() => {
    async function fetchPlayerStats() {
      setIsLoading(true);
      
      try {
        // Determine player ID (FID or wallet address)
        const playerId = context?.user?.fid 
          ? context.user.fid.toString() 
          : address 
            ? address 
            : null;
            
        if (!playerId) {
          setIsLoading(false);
          return;
        }
        
        const response = await fetch(`/api/player-stats?playerId=${playerId}`);
        
        if (response.ok) {
          const stats = await response.json();
          setPlayerStats(stats);
          
          // Also try to get the user's team preference
          const gameStateResponse = await fetch(`/api/game-state?userId=${playerId}`);
          if (gameStateResponse.ok) {
            const gameState = await gameStateResponse.json();
            if (gameState?.team) {
              setTeam(gameState.team);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching player stats:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchPlayerStats();
  }, [context?.user?.fid, address]);

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="bg-gradient-to-br from-amber-50 to-orange-100 border-amber-200">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-amber-800 mb-4">Player Profile</h1>
          
          {/* Profile header with avatar */}
          <div className="flex flex-col items-center mb-6">
            {/* Avatar/Profile Picture */}
            <div className="w-20 h-20 rounded-full overflow-hidden bg-amber-200 mb-3 border-2 border-amber-400 flex items-center justify-center">
              {context?.user?.pfpUrl ? (
                <Image 
                  src={context.user.pfpUrl} 
                  alt="Profile" 
                  width={80} 
                  height={80} 
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : team === "nigeria" ? (
                <span className="text-3xl">🇳🇬</span>
              ) : team === "ghana" ? (
                <span className="text-3xl">🇬🇭</span>
              ) : (
                <span className="text-3xl">👨‍🍳</span>
              )}
            </div>
            
            {/* User Name */}
            <h2 className="text-xl font-bold text-amber-900">{userName}</h2>
            
            {/* Verification Badge for Farcaster Users */}
            {context?.user?.fid && (
              <div className="flex items-center mt-1 text-amber-600">
                <span className="bg-amber-200 rounded-full w-4 h-4 flex items-center justify-center text-[10px] mr-1">✓</span>
                <span className="text-xs">Verified Farcaster User #{context.user.fid}</span>
              </div>
            )}
            
            {/* Team Badge */}
            {team && (
              <div className="mt-2 px-3 py-1 bg-amber-100 rounded-full border border-amber-300">
                <span className="font-medium text-amber-800">Team {team === "ghana" ? "Ghana 🇬🇭" : "Nigeria 🇳🇬"}</span>
              </div>
            )}
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin h-6 w-6 border-2 border-amber-600 border-t-transparent rounded-full"></div>
            </div>
          ) : playerStats ? (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-amber-100 p-3 rounded-lg text-center border border-amber-200">
                <div className="text-sm text-amber-700">Total Score</div>
                <div className="text-xl font-bold text-amber-900">
                  {playerStats.totalScore}
                </div>
              </div>
              
              <div className="bg-amber-100 p-3 rounded-lg text-center border border-amber-200">
                <div className="text-sm text-amber-700">High Score</div>
                <div className="text-xl font-bold text-amber-900">
                  {playerStats.highScore}
                </div>
              </div>
              
              <div className="bg-amber-100 p-3 rounded-lg text-center border border-amber-200">
                <div className="text-sm text-amber-700">Games Played</div>
                <div className="text-xl font-bold text-amber-900">
                  {playerStats.gamesPlayed}
                </div>
              </div>
              
              <div className="bg-amber-100 p-3 rounded-lg text-center border border-amber-200">
                <div className="text-sm text-amber-700">Last Played</div>
                <div className="text-sm font-medium text-amber-900">
                  {new Date(playerStats.lastGameDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-amber-700">No stats available yet. Play a game to see your stats!</p>
            </div>
          )}
          
          {/* ENS Profile Section - Only show if wallet is connected */}
          {address && (
            <div className="mt-6 bg-amber-50 p-4 rounded-lg border border-amber-200">
              <div className="flex justify-center">
                <ENSProfile 
                  address={address as `0x${string}`} 
                  showAddress={true}
                  className="flex items-center justify-center"
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setActiveTab("home")}>
            Back to Home
          </Button>
        </div>
      </Card>
    </div>
  );
}
