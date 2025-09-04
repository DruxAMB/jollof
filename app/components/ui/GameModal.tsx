"use client";

import { Game } from "../game/Game";
import { GameProvider } from "@/lib/game/context";
import { useState, useEffect } from "react";
import type { GamePhase } from "@/lib/game/types";

interface GameModalProps {
  onPhaseChange?: (phase: GamePhase) => void;
}

export function GameModal({ onPhaseChange }: GameModalProps = {}) {
  // Use local state to track the current game phase
  const [currentPhase, setCurrentPhase] = useState<GamePhase>("team_selection");
  
  // Pass phase changes up to the parent component
  useEffect(() => {
    if (onPhaseChange) {
      onPhaseChange(currentPhase);
    }
  }, [currentPhase, onPhaseChange]);

  return (
    <div className="fixed inset-0 z-50 bg-cream-50 flex flex-col overflow-hidden">
      <GameProvider>
        <div className="flex-1 overflow-y-auto">
          <Game onPhaseChange={setCurrentPhase} />
        </div>
      </GameProvider>
    </div>
  );
}
