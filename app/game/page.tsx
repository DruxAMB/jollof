"use client";

import { Game } from "../components/game/Game";
import { GameProvider } from "@/lib/game/context";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useEffect } from "react";

export default function GamePage() {
  const { setFrameReady, isFrameReady } = useMiniKit();

  // Mark the frame as ready when component mounts
  useEffect(() => {
    setFrameReady(true);
  }, [setFrameReady]);

  return (
    <div className="min-h-screen">
      {isFrameReady ? (
        <GameProvider>
          <Game />
        </GameProvider>
      ) : (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading Jollof Wars...</p>
          </div>
        </div>
      )}
    </div>
  );
}
