"use client";

import { TeamType, SwipeDirection } from "@/lib/game/types";
import { useState, useEffect } from "react";

interface CookingPotProps {
  team: TeamType;
  progressPercentage: number;
  isActive: boolean;
  className?: string;
  onTap?: () => void;
  onSwipe?: (direction: SwipeDirection) => void;
}

export function CookingPot({
  team,
  progressPercentage = 0,
  isActive = false,
  className = "",
  onTap,
  onSwipe,
}: CookingPotProps) {
  const [swipeStart, setSwipeStart] = useState<{ x: number; y: number } | null>(null);
  const [animation, setAnimation] = useState("");
  
  // Pot colors based on team
  const potColors = {
    ghana: {
      pot: "from-amber-800 to-amber-900",
      contents: "from-orange-500 to-red-500",
    },
    nigeria: {
      pot: "from-amber-700 to-amber-800",
      contents: "from-orange-600 to-red-600",
    },
  };

  // Set animation state when component becomes active
  useEffect(() => {
    if (isActive) {
      setAnimation("animate-pulse");
    } else {
      setAnimation("");
    }
  }, [isActive]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isActive) return;
    
    const touch = e.touches[0];
    setSwipeStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isActive || !swipeStart) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - swipeStart.x;
    const deltaY = touch.clientY - swipeStart.y;
    
    // Calculate swipe distance and direction
    const swipeDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (swipeDistance < 30) {
      // It's a tap, not a swipe
      onTap?.();
      return;
    }
    
    // Determine swipe direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (deltaX > 0) {
        onSwipe?.(SwipeDirection.RIGHT);
      } else {
        onSwipe?.(SwipeDirection.LEFT);
      }
    } else {
      // Vertical or circular swipe - for our game, we'll consider this a stir
      onSwipe?.(SwipeDirection.STIR);
    }
    
    setSwipeStart(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isActive) return;
    
    setSwipeStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isActive || !swipeStart) return;
    
    const deltaX = e.clientX - swipeStart.x;
    const deltaY = e.clientY - swipeStart.y;
    
    // Calculate swipe distance and direction
    const swipeDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (swipeDistance < 30) {
      // It's a tap, not a swipe
      onTap?.();
      return;
    }
    
    // Determine swipe direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (deltaX > 0) {
        onSwipe?.(SwipeDirection.RIGHT);
      } else {
        onSwipe?.(SwipeDirection.LEFT);
      }
    } else {
      // Vertical or circular swipe - for our game, we'll consider this a stir
      onSwipe?.(SwipeDirection.STIR);
    }
    
    setSwipeStart(null);
  };

  return (
    <div 
      className={`relative ${className} ${isActive ? "cursor-pointer" : ""} ${animation}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {/* Cooking fire */}
      <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-3/4 h-8">
        <div className="relative h-full flex justify-center">
          <div className="absolute bottom-0 w-full h-6 bg-gradient-to-t from-red-600 to-yellow-400 rounded-full blur-md opacity-70"></div>
          <div className="absolute bottom-0 w-3/4 h-5 bg-gradient-to-t from-orange-500 to-yellow-300 rounded-full blur-sm"></div>
        </div>
      </div>
      
      {/* Pot */}
      <div className="relative w-48 h-48 sm:w-64 sm:h-64">
        {/* Pot body */}
        <div className={`w-full h-full rounded-full bg-gradient-to-b ${potColors[team].pot} shadow-lg overflow-hidden border-2 border-gray-800`}>
          {/* Jollof contents */}
          <div 
            className={`absolute bottom-0 left-0 w-full bg-gradient-to-b ${potColors[team].contents} rounded-b-full transition-all duration-500`} 
            style={{ height: `${Math.min(85, progressPercentage)}%` }}
          >
            {/* Rice texture */}
            <div className="absolute top-0 left-0 w-full h-full opacity-30">
              <div className="flex flex-wrap">
                {Array(20).fill(0).map((_, i) => (
                  <div key={i} className="w-2 h-2 bg-white rounded-full m-1"></div>
                ))}
              </div>
            </div>
            
            {/* Steam effect when progress is high */}
            {progressPercentage > 70 && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-3/4">
                <div className="flex justify-around">
                  <div className="w-2 h-8 bg-white opacity-40 rounded-full animate-steam1"></div>
                  <div className="w-2 h-10 bg-white opacity-30 rounded-full animate-steam2 delay-300"></div>
                  <div className="w-2 h-6 bg-white opacity-50 rounded-full animate-steam3 delay-500"></div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Pot handles */}
        <div className="absolute -left-4 top-1/4 w-4 h-12 bg-gray-800 rounded-l-lg"></div>
        <div className="absolute -right-4 top-1/4 w-4 h-12 bg-gray-800 rounded-r-lg"></div>
      </div>
    </div>
  );
}
