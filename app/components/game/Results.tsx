"use client";

import { useGameContext } from "@/lib/game/context";
import { Card } from "./Card";
import { Button } from "./Button";
import { ScoreDisplay } from "./ScoreDisplay";
import { submitScore, LeaderboardEntry } from "@/lib/leaderboard";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { useAccount } from 'wagmi';
import { JSX } from "react";

// Helper function to update player stats on the server
async function updatePlayerStats(playerId: string, score: number, team: string) {
  try {
    console.log(`[DEBUG] Updating player stats - playerId: ${playerId}, score: ${score}, team: ${team}`);
    
    // First, log the current stats before update
    const beforeResponse = await fetch(`/api/player-stats?playerId=${playerId}`);
    if (beforeResponse.ok) {
      const beforeStats = await beforeResponse.json();
      console.log(`[DEBUG] Player stats BEFORE update:`, beforeStats);
    }
    
    // Now update the stats
    const response = await fetch('/api/player-stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, score, team })
    });
    
    if (response.ok) {
      const updatedStats = await response.json();
      console.log(`[DEBUG] Updated player stats for ${playerId}:`, updatedStats);
      console.log(`[DEBUG] Score added: ${score}, New total: ${updatedStats.totalScore}`);
      return updatedStats;
    } else {
      const errorText = await response.text();
      console.error(`[DEBUG] Error updating player stats: ${response.status} ${errorText}`);
    }
  } catch (error) {
    console.error('[DEBUG] Failed to update player stats:', error);
  }
  return null;
}

export function Results(): JSX.Element {
  const { state, dispatch } = useGameContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // We track the submitted entry but don't currently display it differently
  const [, setPlayerEntry] = useState<LeaderboardEntry | null>(null);
  const [playerName, setPlayerName] = useState<string>("");
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [cumulativeScore, setCumulativeScore] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  // Add loading state for score calculation
  const [isCalculating, setIsCalculating] = useState(true);

  // Use Farcaster context 
  const { context, isFrameReady, setFrameReady } = useMiniKit();
  
  // Use wallet connection
  const { address } = useAccount();

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

  // Set frame as ready when component mounts and handle loading overlay
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
    
    // Show loading overlay for score calculation
    const timer = setTimeout(() => {
      setIsCalculating(false);
    }, 1500); // 1.5 second delay
    
    return () => clearTimeout(timer);
  }, [setFrameReady, isFrameReady]);

  // Handle submitting score with proper memoization
  const handleSubmitScore = useCallback(async (nameOverride?: string) => {
    const nameToUse = nameOverride || playerName;
    
    // If we have no name (neither from Farcaster nor manual input), stop
    if (!state.team || !nameToUse.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      // Update player stats on the server
      if (!context?.user?.fid && address) {
        // For wallet users
        const playerId = address;
        updatePlayerStats(playerId, state.score.totalScore, state.team || 'unknown');
      } else if (context?.user?.fid) {
        // For Farcaster users, use FID as player ID
        const playerId = context.user.fid.toString();
        updatePlayerStats(playerId, state.score.totalScore, state.team || 'unknown');
      }
      
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
  }, [playerName, state, dispatch, state.team, state.score.totalScore, state.playerStats.longestCombo, 
      state.playerStats.perfectActions, accuracy, context, address]);

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
    } 
  }, [context?.user?.fid, context?.user?.username, state.phase, submitted, isSubmitting, handleSubmitScore]);
  
  // Check for returning user and get player stats - run this as early as possible
  useEffect(() => {
    console.log('[DEBUG] Results component mounted, checking for returning user');
    console.log('[DEBUG] Address:', address);
    console.log('[DEBUG] Context user:', context?.user);
    
    const fetchPlayerStats = async (id: string) => {
      try {
        // Get player stats from server
        const response = await fetch(`/api/player-stats?playerId=${id}`);
        if (response.ok) {
          const stats = await response.json();
          console.log(`[DEBUG] Player stats for ${id}:`, stats);
          setCumulativeScore(stats.totalScore);
          setGamesPlayed(stats.gamesPlayed);
          if (stats.gamesPlayed > 0) {
            setIsReturningUser(true);
          }
        }
      } catch (error) {
        console.error('[DEBUG] Failed to get player stats:', error);
      }
    };
    
    // Only run for non-Farcaster users who have a connected wallet
    if (!context?.user?.fid && address) {
      // Get player stats from server
      fetchPlayerStats(address);
      
      // Generate a name from address
      const generatedName = `${address.slice(0, 4)}...${address.slice(-4)}`;
      console.log(`[DEBUG] Using wallet address for name: ${generatedName}`);
      setPlayerName(generatedName);
    } 
    // For Farcaster users, get their stats using FID
    else if (context?.user?.fid) {
      fetchPlayerStats(context.user.fid.toString());
    }
    // If no wallet or Farcaster, just use empty string
    else {
      console.log('[DEBUG] No wallet or Farcaster, using empty name');
      setPlayerName('');
    }
  }, [address, context?.user?.fid]);  // Run when address or Farcaster context changes

  return (
    <div className="container mx-auto px-4 py-6">
      <Card className="relative overflow-hidden">
        {/* Loading overlay while calculating score */}
        {isCalculating && (
          <div className="absolute inset-0 bg-white bg-opacity-90 z-50 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-500 border-t-transparent mb-3"></div>
              <p className="text-amber-600 font-medium">calculating score...</p>
            </div>
          </div>
        )}
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
          
          {isReturningUser && cumulativeScore > state.score.totalScore && (
            <div className="mt-4 bg-gradient-to-r from-amber-100 to-yellow-100 p-3 rounded-lg text-center border border-amber-200">
              <div className="text-sm text-gray-600 mb-1">Your Cumulative Score</div>
              <div className="text-2xl font-extrabold text-amber-600">
                {cumulativeScore} <span className="text-sm text-gray-500">points</span>
              </div>
            </div>
          )}
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
              {isReturningUser && address ? gamesPlayed : state.playerStats.totalPlays}
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
                {isReturningUser ? (
                  <div className="bg-amber-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Welcome back!</div>
                    <div className="font-semibold text-amber-800">{playerName}</div>
                  </div>
                ) : (
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
                      className="w-full px-4 py-2 text-black placeholder:text-black border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                      maxLength={20}
                    />
                  </div>
                )}
                
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
                onClick={() => {
                  // Use a custom event to trigger the leaderboard modal to open
                  const event = new CustomEvent('openLeaderboardModal');
                  window.dispatchEvent(event);
                }}
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
