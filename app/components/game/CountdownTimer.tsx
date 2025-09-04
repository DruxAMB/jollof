"use client";

import { useEffect, useState } from "react";

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
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [isActive, setIsActive] = useState(true);

  // Size-based classes
  const sizeClasses = {
    sm: "text-2xl w-12 h-12",
    md: "text-3xl w-16 h-16",
    lg: "text-4xl w-24 h-24",
  };

  // Calculate percentage for progress ring
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  
  // Guard against division by zero or invalid values
  const percentage = seconds > 0 ? (timeLeft / seconds) * 100 : 0;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  useEffect(() => {
    // Reset when seconds prop changes
    setTimeLeft(seconds);
    setIsActive(true);
  }, [seconds]);

  useEffect(() => {
    if (!isActive) return;

    const intervalId = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(intervalId);
          setIsActive(false);
          onComplete?.();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isActive, onComplete]);

  // Determine color based on time left percentage
  const getTimerColor = () => {
    const percentage = (timeLeft / seconds) * 100;
    if (percentage > 60) return "stroke-green-500";
    if (percentage > 30) return "stroke-amber-500";
    return "stroke-red-500";
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`relative flex items-center justify-center ${sizeClasses[size]}`}>
        {/* Background circle */}
        <svg className="absolute w-full h-full" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            strokeWidth="8"
            className="stroke-gray-200"
          />
        </svg>
        
        {/* Progress circle */}
        <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            strokeWidth="8"
            className={`${getTimerColor()} transition-all duration-1000 ease-linear`}
            strokeDasharray={String(circumference)}
            strokeDashoffset={String(strokeDashoffset)}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Timer text */}
        <span className="font-bold">{timeLeft}</span>
      </div>
    </div>
  );
}
