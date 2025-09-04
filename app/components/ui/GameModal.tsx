"use client";

import { Game } from "../game/Game";
import { GameProvider } from "@/lib/game/context";

export function GameModal() {
  return (
    <div className="min-h-screen">
      <GameProvider>
        <Game />
      </GameProvider>
    </div>
  );
}
