"use client";

import { useState, useEffect } from "react";
import { Leaderboard } from "../components/game/Leaderboard";
import { Button } from "../components/game/Button";
import Link from "next/link";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

export default function LeaderboardPage() {
  const { setFrameReady, isFrameReady } = useMiniKit();
  
  // Set frame ready when component mounts
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  return (
    <div className="min-h-screen flex flex-col py-4 bg-gradient-to-b from-amber-50 to-orange-50">
      <div className="container max-w-md mx-auto px-4 flex-1">
        <header className="mb-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-amber-800">Jollof Wars</h1>
          <Link href="/game" passHref>
            <Button variant="outline" size="sm">
              Play Game
            </Button>
          </Link>
        </header>
        
        <Leaderboard />

        <div className="mt-6 flex justify-center">
          <Link href="/" passHref>
            <Button variant="ghost">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
