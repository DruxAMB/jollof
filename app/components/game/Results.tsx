"use client";

import { useGameContext } from "@/lib/game/context";
import { Card } from "./Card";
import { Button } from "./Button";
import { ScoreDisplay } from "./ScoreDisplay";
import { Leaderboard } from "./Leaderboard";
import { submitScore, LeaderboardEntry } from "@/lib/leaderboard";
import { useState } from "react";
import Link from "next/link";

export function Results() {
  const { state, dispatch } = useGameContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [playerEntry, setPlayerEntry] = useState<LeaderboardEntry | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [playerName, setPlayerName] = useState<string>(() => {
    // Try to get the last used player name from storage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('jollof_player_name') || '';
    }
    return '';
  });

  const handlePlayAgain = () => {
    dispatch({ type: 'RESET_GAME' });
  };

  const handleSubmitScore = async () => {
    if (!state.team || !playerName.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      // Save player name for future sessions
      if (typeof window !== 'undefined') {
        localStorage.setItem('jollof_player_name', playerName);
      }
      
      // Calculate accuracy percentage
      const accuracyPercentage = totalActions > 0 
        ? ((totalActions - (state.score.accuracyPenalty / 50)) / totalActions * 100)
        : 0;
        
      // Submit the score using our leaderboard service
      const newEntry = await submitScore({
        playerName: playerName.trim(),
        score: state.score.totalScore,
        team: state.team,
        combo: state.playerStats.longestCombo,
        perfectActions: state.playerStats.perfectActions,
        accuracy: accuracyPercentage
      });
      
      setPlayerEntry(newEntry);
      setSubmitted(true);
      setShowLeaderboard(true);
    } catch (error) {
      console.error("Failed to submit score:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate metrics
  const perfectActions = state.playerStats.perfectActions;
  const totalActions = state.completedActions;
  const accuracy = totalActions > 0 
    ? Math.round((totalActions - (state.score.accuracyPenalty / 50)) / totalActions * 100) 
    : 0;
  
  // Is high score?
  const isHighScore = state.score.totalScore >= state.playerStats.highScore;

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {isHighScore ? "🎉 New High Score! 🎉" : "Results"}
          </h2>
          <p className="text-gray-600 mt-1">
            {state.team === "ghana" ? "Team Ghana" : "Team Nigeria"}
          </p>
        </div>

        <div className="mb-6">
          <ScoreDisplay score={state.score} combo={state.combo} />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-amber-50 p-3 rounded-lg text-center">
            <div className="text-sm text-gray-500">Longest Combo</div>
            <div className="text-xl font-bold text-amber-600">
              {state.playerStats.longestCombo}x
            </div>
          </div>

          <div className="bg-amber-50 p-3 rounded-lg text-center">
            <div className="text-sm text-gray-500">Accuracy</div>
            <div className="text-xl font-bold text-amber-600">
              {accuracy}%
            </div>
          </div>

          <div className="bg-amber-50 p-3 rounded-lg text-center">
            <div className="text-sm text-gray-500">Perfect Timing</div>
            <div className="text-xl font-bold text-amber-600">
              {perfectActions}
            </div>
          </div>

          <div className="bg-amber-50 p-3 rounded-lg text-center">
            <div className="text-sm text-gray-500">Total Plays</div>
            <div className="text-xl font-bold text-amber-600">
              {state.playerStats.totalPlays}
            </div>
          </div>
        </div>

        {!submitted ? (
          <div className="flex flex-col space-y-4">
            <div>
              <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                maxLength={20}
              />
            </div>
            
            <div className="flex flex-col space-y-3">
              <Button
                variant="primary"
                size="lg"
                onClick={handleSubmitScore}
                disabled={isSubmitting || !playerName.trim()}
                className="w-full"
              >
                {isSubmitting ? "Submitting..." : "Submit Score to Leaderboard"}
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={handlePlayAgain}
                className="w-full"
              >
                Play Again
              </Button>
              
              <Link href="/leaderboard" className="text-center text-amber-600 hover:text-amber-800 text-sm">
                View Full Leaderboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {showLeaderboard ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLeaderboard(false)}
                  className="mb-4"
                >
                  ← Back to Results
                </Button>
                <Leaderboard 
                  playerScore={playerEntry!} 
                  onClose={() => setShowLeaderboard(false)} 
                />
              </>
            ) : (
              <div className="flex flex-col space-y-3">
                <div className="bg-green-100 text-green-800 p-3 rounded-lg text-center">
                  Score submitted! Check the leaderboard to see where you rank.
                </div>
                
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setShowLeaderboard(true)}
                  className="w-full"
                >
                  View Leaderboard
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handlePlayAgain}
                  className="w-full"
                >
                  Play Again
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
