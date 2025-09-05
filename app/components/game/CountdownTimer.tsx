"use client";

import { useEffect } from "react";
import { JSX } from "react";

interface CountdownTimerProps {
  seconds: number;
  onComplete?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function CountdownTimer({
  seconds,
  onComplete,
  className = "",
  size = "md",
}: CountdownTimerProps): JSX.Element {
  // Handle completion
  useEffect(() => {
    if (seconds === 0 && onComplete) {
      onComplete();
    }
  }, [seconds, onComplete]);
  
  // Size-based classes
  const sizeClasses = {
    sm: "h-12 w-12 text-sm",
    md: "h-16 w-16 text-lg",
    lg: "h-24 w-24 text-xl",
  };

  // Get color based on time remaining
  const getColor = () => {
    if (seconds > 10) return "bg-green-500 text-white";
    if (seconds > 5) return "bg-amber-500 text-white";
    return "bg-red-500 text-white";
  };

  return (
    <div className={`${className} flex flex-col items-center`}>
      {/* Simple circle with text */}
      <div 
        className={`
          ${sizeClasses[size]} 
          rounded-full 
          flex 
          items-center 
          justify-center 
          shadow-md
          ${getColor()}
          ${seconds <= 5 ? "animate-pulse" : ""}
        `}
      >
        {seconds}
      </div>
    </div>
  );
}
