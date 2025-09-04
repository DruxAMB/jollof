"use client";

import { useState, useEffect } from "react";
import { Card } from "./Card";
import { Button } from "./Button";
import { fetchLeaderboard } from "@/lib/leaderboard";

type Team = "nigeria" | "ghana";
type LeaderboardEntry = {
  id: string;
  team: Team;
  playerName: string;
  score: number;
  timestamp: number;
};

export function LeaderboardModal() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | "all">("all");
  
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
        <h1 className="text-3xl font-extrabold text-black mb-4 uppercase">Jollof Wars Leaderboard</h1>
        <p className="text-black font-bold">See who's cooking the best Jollof in town!</p>
      </div>
      
      <div className="flex justify-center mb-6">
        <div className="inline-flex rounded-md shadow-sm">
          <Button 
            variant={selectedTeam === "all" ? "primary" : "outline"}
            onClick={() => setSelectedTeam("all")}
            className="rounded-r-none uppercase"
          >
            All Teams
          </Button>
          <Button 
            variant={selectedTeam === "nigeria" ? "primary" : "outline"}
            onClick={() => setSelectedTeam("nigeria")}
            className="rounded-none border-l-0 border-r-0 uppercase"
          >
            Team Nigeria
          </Button>
          <Button 
            variant={selectedTeam === "ghana" ? "primary" : "outline"}
            onClick={() => setSelectedTeam("ghana")}
            className="rounded-l-none uppercase text-black"
          >
            Team Ghana
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {selectedTeam !== "ghana" && (
          <Card title="Team Nigeria 🇳🇬" className="mb-6">
            {nigeriaScores.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border-2 border-black">
                  <thead>
                    <tr className="bg-yellow-300 border-b-2 border-black">
                      <th className="px-4 py-2 text-left text-black font-extrabold uppercase">Rank</th>
                      <th className="px-4 py-2 text-left text-black font-extrabold uppercase">Name</th>
                      <th className="px-4 py-2 text-right text-black font-extrabold uppercase">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nigeriaScores.map((entry, index) => (
                      <tr key={entry.id} className={index % 2 === 0 ? "bg-cream-100" : ""} style={{borderBottom: "1px solid black"}}>
                        <td className="px-4 py-2 font-bold">{index + 1}</td>
                        <td className="px-4 py-2 font-medium">{entry.playerName}</td>
                        <td className="px-4 py-2 text-right font-extrabold">{entry.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center py-4 text-black font-bold">No scores yet for Team Nigeria!</p>
            )}
          </Card>
        )}
        
        {selectedTeam !== "nigeria" && (
          <Card title="Team Ghana 🇬🇭" className="mb-6">
            {ghanaScores.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border-2 border-black">
                  <thead>
                    <tr className="bg-green-300 border-b-2 border-black">
                      <th className="px-4 py-2 text-left text-black font-extrabold uppercase">Rank</th>
                      <th className="px-4 py-2 text-left text-black font-extrabold uppercase">Name</th>
                      <th className="px-4 py-2 text-right text-black font-extrabold uppercase">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ghanaScores.map((entry, index) => (
                      <tr key={entry.id} className={index % 2 === 0 ? "bg-cream-100" : ""} style={{borderBottom: "1px solid black"}}>
                        <td className="px-4 py-2 font-bold">{index + 1}</td>
                        <td className="px-4 py-2 font-medium">{entry.playerName}</td>
                        <td className="px-4 py-2 text-right font-extrabold">{entry.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center py-4 text-black font-bold">No scores yet for Team Ghana!</p>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
