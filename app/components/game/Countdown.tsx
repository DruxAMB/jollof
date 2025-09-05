"use client";

import { useEffect, useState } from "react";
import { useGameContext } from "@/lib/game/context";

export function Countdown() {
  const { dispatch } = useGameContext();
  const [count, setCount] = useState(3); // Start with 3-second countdown

  useEffect(() => {
    if (count < 0) {
      // After showing "Start Cooking!", transition to gameplay
      dispatch({ type: 'BEGIN_PLAYING' });
      return;
    }
    
    const timer = setTimeout(() => {
      // Show "Start Cooking!" for 1 second before starting game
      if (count === 0) {
        setCount(-1); // Use -1 to indicate we're done with countdown
      } else {
        setCount(count - 1);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [count, dispatch]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-30 bg-black bg-opacity-80">
      <div className="text-center">
        {count > 0 ? (
          <div className="animate-bounce transform transition-all duration-300">
            <div className="text-9xl font-extrabold text-white mb-4 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
              {count}
            </div>
            <div className="text-2xl font-medium text-amber-400">
              Get Ready!
            </div>
          </div>
        ) : (
          <div className="animate-pulse transform scale-110 transition-all duration-500">
            <div className="text-7xl font-extrabold text-amber-500 mb-4 drop-shadow-[0_0_15px_rgba(255,193,7,0.7)]">
              Start Cooking!
            </div>
            <div className="text-2xl font-bold text-white">
              GO GO GO!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
