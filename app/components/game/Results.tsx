"use client";

import { useGameContext } from "@/lib/game/context";
import { Card } from "./Card";
import { Button } from "./Button";
import { ScoreDisplay } from "./ScoreDisplay";
import { submitScore, LeaderboardEntry } from "@/lib/leaderboard";
import { useState, useEffect } from "react";
import { useMiniKit } from '@coinbase/onchainkit/minikit';

export function Results() {
  const { state, dispatch } = useGameContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [playerEntry, setPlayerEntry] = useState<LeaderboardEntry | null>(null);
  const [showLeaderboardSuccess, setShowLeaderboardSuccess] = useState(false);
  
  // Use Farcaster context 
  const { context, isFrameReady, setFrameReady } = useMiniKit();
  
  // Set frame as ready when component mounts
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);
  
  // Handle player name - from Farcaster if available, otherwise from localStorage
  const [playerName, setPlayerName] = useState<string>("");
  
  // Auto-submit score for Farcaster users
  useEffect(() => {
    // If we have results showing and a Farcaster user, auto-submit after a short delay
    if (context?.user?.fid && state.phase === 'results' && !submitted && !isSubmitting) {
      const displayName = context.user.username ? 
        `${context.user.username}` : 
        `Farcaster #${context.user.fid}`;
      setPlayerName(displayName);
      
      // Auto-submit after a short delay to let user see their score
      const timer = setTimeout(() => {
        handleSubmitScore(displayName);
      }, 1500);
      
      return () => clearTimeout(timer);
    } else if (!context?.user?.fid && typeof window !== 'undefined') {
      // Fallback to localStorage for non-Farcaster users
      setPlayerName(localStorage.getItem('jollof_player_name') || '');
    }
  }, [context, state.phase, submitted, isSubmitting]);

  const handlePlayAgain = () => {
    dispatch({ type: 'RESET_GAME' });
  };

  const handleSubmitScore = async (nameOverride?: string) => {
    const nameToUse = nameOverride || playerName;
    
    // If we have no name (neither from Farcaster nor manual input), stop
    if (!state.team || !nameToUse.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      // Only save manually entered names to localStorage
      if (typeof window !== 'undefined' && !context?.user) {
        localStorage.setItem('jollof_player_name', nameToUse);
      }
      
      // Calculate accuracy percentage
      const accuracyPercentage = totalActions > 0 
        ? ((totalActions - (state.score.accuracyPenalty / 50)) / totalActions * 100)
        : 0;
        
      // Submit the score using our leaderboard service
      const newEntry = await submitScore({
        playerName: nameToUse.trim(),
        score: state.score.totalScore,
        team: state.team,
        combo: state.playerStats.longestCombo,
        perfectActions: state.playerStats.perfectActions,
        accuracy: accuracyPercentage,
        // Include Farcaster ID if available
        fid: context?.user?.fid ? String(context.user.fid) : undefined,
        isVerifiedUser: !!context?.user?.fid
      });
      
      setPlayerEntry(newEntry);
      setSubmitted(true);
      setShowLeaderboardSuccess(true);
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
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 mb-28">
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
            {context?.user ? (
              <div className="flex flex-col space-y-3">
                <div className="bg-amber-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-500">Playing as</div>
                  <div className="font-semibold text-amber-800">{playerName}</div>
                  {context.client?.added && (
                    <div className="text-xs text-green-600 mt-1">✅ App saved</div>
                  )}
                  <div className="text-xs mt-2 text-black">Auto-submitting score...</div>
                </div>
              </div>
            ) : (
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
                    onClick={() => handleSubmitScore()}
                    disabled={isSubmitting || !playerName.trim()}
                    className="w-full"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Score to Leaderboard"}
                  </Button>
                </div>
              </div>
              )}
            
            <div className="flex flex-col space-y-3">
              <Button
                variant="outline"
                size="lg"
                onClick={handlePlayAgain}
                className="w-full"
              >
                Play Again
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {!showLeaderboardSuccess && (
              <div className="flex flex-col space-y-3">
                <div className="bg-green-100 text-green-800 p-3 rounded-lg text-center">
                  Score submitted! Check the leaderboard to see where you rank.
                </div>
                
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => window.location.href = "/#leaderboard"}
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
