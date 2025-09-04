"use client";

import { useState, useEffect } from "react";
import { LeaderboardEntry, fetchLeaderboard, getTeamStats } from "@/lib/leaderboard";
import { Button } from "./Button";
import { Card } from "./Card";

interface LeaderboardProps {
  playerScore?: LeaderboardEntry;
  onClose?: () => void;
}

export function Leaderboard({ playerScore, onClose }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [teamStats, setTeamStats] = useState<{ ghana: number; nigeria: number }>({
    ghana: 0,
    nigeria: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "ghana" | "nigeria">("all");

  // Fetch leaderboard data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchLeaderboard();
        setLeaderboard(data);
        
        const stats = await getTeamStats();
        setTeamStats(stats);
      } catch (error) {
        console.error("Failed to load leaderboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Filter leaderboard based on selected team
  const filteredLeaderboard = leaderboard.filter(entry => 
    filter === "all" || entry.team === filter
  );

  // Format time from timestamp
  const formatTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) { // Less than 1 minute
      return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
      return `${Math.floor(diff / 60000)} min ago`;
    } else if (diff < 86400000) { // Less than 1 day
      return `${Math.floor(diff / 3600000)} hr ago`;
    } else {
      return new Date(timestamp).toLocaleDateString();
    }
  };

  // Find player position in leaderboard
  const playerPosition = playerScore 
    ? leaderboard.findIndex(entry => entry.score <= playerScore.score) + 1
    : -1;

  return (
    <div className="w-full max-w-md mx-auto">
      <Card title="Jollof Wars Leaderboard" className="mb-4">
        {/* Team stats section */}
        <div className="flex justify-between mb-6 border-b border-gray-200 pb-4">
          <div className="text-center flex-1 border-r border-gray-200">
            <div className="text-lg font-bold">Team Ghana</div>
            <div className="text-2xl font-bold text-amber-600">
              {teamStats.ghana.toLocaleString()}
            </div>
          </div>
          <div className="text-center flex-1">
            <div className="text-lg font-bold">Team Nigeria</div>
            <div className="text-2xl font-bold text-green-600">
              {teamStats.nigeria.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex space-x-2 mb-4">
          <Button 
            variant={filter === "all" ? "primary" : "outline"} 
            size="sm"
            onClick={() => setFilter("all")}
          >
            All Players
          </Button>
          <Button 
            variant={filter === "ghana" ? "primary" : "outline"} 
            size="sm"
            onClick={() => setFilter("ghana")}
          >
            Ghana
          </Button>
          <Button 
            variant={filter === "nigeria" ? "primary" : "outline"} 
            size="sm"
            onClick={() => setFilter("nigeria")}
          >
            Nigeria
          </Button>
        </div>

        {/* Player's score highlight if available */}
        {playerScore && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4 rounded-md">
            <div className="flex justify-between items-center">
              <div className="font-bold">Your Score</div>
              <div className="text-lg font-bold">{playerScore.score.toLocaleString()}</div>
            </div>
            <div className="text-sm text-amber-700">
              Rank: #{playerPosition} • Combo: {playerScore.combo} • Perfect: {playerScore.perfectActions}
            </div>
          </div>
        )}

        {/* Leaderboard table */}
        {loading ? (
          <div className="text-center py-8">Loading leaderboard...</div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    When
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeaderboard.slice(0, 10).map((entry, index) => (
                  <tr 
                    key={entry.id}
                    className={playerScore?.id === entry.id ? "bg-yellow-50" : ""}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-medium">{index + 1}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <span 
                          className={`w-2 h-2 mr-2 rounded-full ${
                            entry.team === "ghana" ? "bg-amber-600" : "bg-green-600"
                          }`}
                        ></span>
                        <span className="text-sm font-medium">{entry.playerName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <span className="text-sm font-medium">{entry.score.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-500">
                      {formatTime(entry.timestamp)}
                    </td>
                  </tr>
                ))}
                
                {filteredLeaderboard.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      No scores found for this team yet. Be the first to play!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Close button */}
        {onClose && (
          <div className="mt-4 text-center">
            <Button variant="ghost" onClick={onClose}>
              Close Leaderboard
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
