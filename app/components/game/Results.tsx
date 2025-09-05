"use client";

import { useGameContext } from "@/lib/game/context";
import { Card } from "./Card";
import { Button } from "./Button";
import { ScoreDisplay } from "./ScoreDisplay";
import { submitScore, LeaderboardEntry, getUserBestScore } from "@/lib/leaderboard";
import { saveGameState } from "@/lib/game/storage";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { JSX } from "react";

export function Results(): JSX.Element {
  const { state, dispatch } = useGameContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // We track the submitted entry but don't currently display it differently
  const [playerEntry, setPlayerEntry] = useState<LeaderboardEntry | null>(null);
  const [playerName, setPlayerName] = useState<string>("");

  // Use Farcaster context 
  const { context, isFrameReady, setFrameReady } = useMiniKit();

  // Calculate metrics using useMemo to prevent recalculations
  const perfectActions = state.playerStats.perfectActions;
  const totalActions = state.completedActions;
  const accuracy = useMemo(() => {
    return totalActions > 0 
      ? Math.round((totalActions - (state.score.accuracyPenalty / 50)) / totalActions * 100) 
      : 0;
  }, [totalActions, state.score.accuracyPenalty]);

  // Is high score?
  const isHighScore = state.score.totalScore >= state.playerStats.highScore;

  // Set frame as ready when component mounts
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Handle submitting score with proper memoization
  const handleSubmitScore = useCallback(async (nameOverride?: string) => {
    const nameToUse = nameOverride || playerName;
    
    // If we have no name (neither from Farcaster nor manual input), stop
    if (!state.team || !nameToUse.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      // We don't need to save manually entered names anymore
      // Redis will handle persistence through the submitScore function
      
      console.log('Submitting score:', {
        name: nameToUse.trim(),
        score: state.score.totalScore,
        team: state.team,
        fid: context?.user?.fid ? String(context.user.fid) : undefined
      });
      
      // Submit the score using our leaderboard service
      const newEntry = await submitScore({
        playerName: nameToUse.trim(),
        score: state.score.totalScore,
        team: state.team,
        combo: state.playerStats.longestCombo,
        perfectActions: state.playerStats.perfectActions,
        accuracy,
        // Include Farcaster ID if available
        fid: context?.user?.fid ? String(context.user.fid) : undefined,
        isVerifiedUser: !!context?.user?.fid
      });
      
      console.log('Score submitted, received entry:', newEntry);
      
      setPlayerEntry(newEntry);
      setSubmitted(true);
    } catch (error) {
      console.error("Failed to submit score:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [playerName, state.team, state.score.totalScore, state.playerStats.longestCombo, 
      state.playerStats.perfectActions, accuracy, context]);

  // Handle returning to the game
  const handlePlayAgain = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, [dispatch]);
  
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
    } else if (!context?.user?.fid) {
      // For non-Farcaster users, we'll just use an empty name initially
      // They'll need to enter it manually
      setPlayerName('');
    }
  }, [context, state.phase, submitted, isSubmitting, handleSubmitScore]);

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
          </div>
        )}
      </Card>
    </div>
  );
}
