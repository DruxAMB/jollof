"use client";

import { useEffect } from "react";
import { useGameContext } from "@/lib/game/context";
import type { GamePhase } from "@/lib/game/types";
import { saveGameState } from "@/lib/game/storage";
import { TeamSelection } from "./TeamSelection";
import { Tutorial } from "./Tutorial";
import { Countdown } from "./Countdown";
import { GamePlay } from "./GamePlay";
import { Results } from "./Results";

interface GameProps {
  onPhaseChange?: (phase: GamePhase) => void;
}

export function Game({ onPhaseChange }: GameProps = {}) {
  const { state } = useGameContext();

  // Save game state to localStorage whenever it changes
  // and notify parent of phase changes
  useEffect(() => {
    saveGameState(state);
    
    // Notify parent component of phase changes
    if (onPhaseChange) {
      onPhaseChange(state.phase);
    }
  }, [state, onPhaseChange]);

  // Render different components based on game phase
  const renderGamePhase = () => {
    switch (state.phase) {
      case "team_selection":
        return <TeamSelection />;
      case "tutorial":
        return <Tutorial />;
      case "countdown":
        return <Countdown />;
      case "playing":
        return <GamePlay />;
      case "scoring":
      case "results":
        return <Results />;
      default:
        return <TeamSelection />;
    }
  };

  return (
    <div className="w-full bg-cream-50">
      <div className="container mx-auto">
        <div className="bg-cream-50">
          {renderGamePhase()}
        </div>
      </div>
    </div>
  );
}
