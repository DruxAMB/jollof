"use client";

import { useState, useEffect } from 'react';

interface ActionFeedbackProps {
  success: boolean;
  show: boolean;
  onAnimationComplete: () => void;
}

export function ActionFeedback({ success, show, onAnimationComplete }: ActionFeedbackProps) {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    if (show) {
      setVisible(true);
      
      // Hide after animation completes
      const timer = setTimeout(() => {
        setVisible(false);
        onAnimationComplete();
      }, 800); // Animation lasts 800ms
      
      return () => clearTimeout(timer);
    }
  }, [show, onAnimationComplete]);
  
  if (!visible) return null;
  
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-30">
      <div 
        className={`text-7xl font-bold animate-scale-fade ${
          success ? 'text-green-500' : 'text-red-500'
        }`}
      >
        {success ? '✓' : '✗'}
      </div>
    </div>
  );
}
