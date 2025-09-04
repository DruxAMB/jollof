"use client";

import { useEffect, useState } from "react";
import { useGameContext } from "@/lib/game/context";

export function Countdown() {
  const { state, dispatch } = useGameContext();
  const [count, setCount] = useState(state.timer);

  useEffect(() => {
    if (count <= 0) {
      // Game starts when countdown reaches zero
      dispatch({ type: 'UPDATE_TIMER', payload: 0 });
      return;
    }

    const timer = setTimeout(() => {
      setCount(count - 1);
      dispatch({ type: 'UPDATE_TIMER', payload: 1 });
    }, 1000);

    return () => clearTimeout(timer);
  }, [count, dispatch]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70">
      <div className="text-center animate-bounce">
        <div className="text-9xl font-bold text-white mb-4">{count}</div>
        <div className="text-2xl font-medium text-amber-400">
          Get Ready to Cook!
        </div>
      </div>
    </div>
  );
}
