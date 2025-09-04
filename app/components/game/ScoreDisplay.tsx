"use client";

import { GameScore } from "@/lib/game/types";

interface ScoreDisplayProps {
  score: GameScore;
  combo: number;
  className?: string;
  compact?: boolean;
}

export function ScoreDisplay({ 
  score, 
  combo, 
  className = "",
  compact = false
}: ScoreDisplayProps) {
  if (compact) {
    return (
      <div className={`flex items-center justify-between ${className}`}>
        <div className="bg-amber-100 rounded-full px-4 py-1 text-amber-800 font-bold text-lg">
          {score.totalScore}
        </div>
        {combo > 1 && (
          <div className="bg-red-100 rounded-full px-3 py-1 text-red-800 font-bold">
            <span>×{combo} Combo!</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white bg-opacity-90 backdrop-blur-md rounded-xl shadow-md p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-800">Score</h3>
        <div className="bg-amber-100 rounded-full px-4 py-1 text-amber-800 font-bold text-xl">
          {score.totalScore}
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Base</span>
          <span className="font-semibold">{score.baseScore}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Timing Bonus</span>
          <span className="font-semibold text-green-600">+{score.timingBonus}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Combo Bonus</span>
          <span className="font-semibold text-blue-600">+{score.comboBonus}</span>
        </div>
        
        {score.accuracyPenalty > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Penalties</span>
            <span className="font-semibold text-red-600">-{score.accuracyPenalty}</span>
          </div>
        )}
      </div>
      
      {combo > 1 && (
        <div className="mt-3 bg-red-100 rounded-lg p-2 text-center text-red-800 font-bold">
          <span>×{combo} Combo!</span>
        </div>
      )}
    </div>
  );
}
