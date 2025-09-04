"use client";

import { useState, useEffect, useRef } from "react";
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
  const [prevScore, setPrevScore] = useState<number>(score.totalScore);
  const [isScoreIncreasing, setIsScoreIncreasing] = useState(false);
  const [isComboIncreasing, setIsComboIncreasing] = useState(false);
  const prevComboRef = useRef(combo);
  
  // Detect score increases and trigger animation
  useEffect(() => {
    if (score.totalScore > prevScore) {
      setIsScoreIncreasing(true);
      const timer = setTimeout(() => setIsScoreIncreasing(false), 1000);
      setPrevScore(score.totalScore);
      return () => clearTimeout(timer);
    }
  }, [score.totalScore, prevScore]);
  
  // Detect combo increases and trigger animation
  useEffect(() => {
    if (combo > prevComboRef.current && combo > 1) {
      setIsComboIncreasing(true);
      const timer = setTimeout(() => setIsComboIncreasing(false), 1000);
      prevComboRef.current = combo;
      return () => clearTimeout(timer);
    }
    prevComboRef.current = combo;
  }, [combo]);
  if (compact) {
    return (
      <div className={`flex items-center justify-between ${className}`}>
        <div className={`bg-amber-100 rounded-full px-4 py-1 text-amber-800 font-bold text-lg
          ${isScoreIncreasing ? 'animate-pulse scale-110 transition-all duration-300' : ''}`}>
          {score.totalScore}
        </div>
        {combo > 1 && (
          <div className={`bg-red-100 rounded-full px-3 py-1 text-red-800 font-bold
            ${isComboIncreasing ? 'animate-bounce scale-110 transition-all duration-300' : ''}`}>
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
        <div className={`bg-amber-100 rounded-full px-4 py-1 text-amber-800 font-bold text-xl
          ${isScoreIncreasing ? 'animate-pulse scale-110 transition-all duration-300' : ''}`}>
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
        <div className={`mt-3 bg-red-100 rounded-lg p-2 text-center text-red-800 font-bold
          ${isComboIncreasing ? 'animate-bounce scale-110 transition-all duration-300' : ''}`}>
          <span>×{combo} Combo!</span>
        </div>
      )}
    </div>
  );
}
