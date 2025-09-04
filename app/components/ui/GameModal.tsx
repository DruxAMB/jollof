"use client";

import { Game } from "../game/Game";
import { GameProvider } from "@/lib/game/context";

export function GameModal() {
  return (
    <div className="min-h-screen fixed inset-0 z-50 bg-cream-50">
      <GameProvider>
        <Game />
      </GameProvider>
    </div>
  );
}
