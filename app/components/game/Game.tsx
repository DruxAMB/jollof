"use client";

import { useEffect } from "react";
import { useGameContext } from "@/lib/game/context";
import { saveGameState } from "@/lib/game/storage";
import { TeamSelection } from "./TeamSelection";
import { Tutorial } from "./Tutorial";
import { Countdown } from "./Countdown";
import { GamePlay } from "./GamePlay";
import { Results } from "./Results";

export function Game() {
  const { state } = useGameContext();

  // Save game state to localStorage whenever it changes
  useEffect(() => {
    saveGameState(state);
  }, [state]);

  // Render different components based on game phase
  const renderGamePhase = () => {
    switch (state.phase) {
      case "team_selection":
        return <TeamSelection />;
      case "tutorial":
        return <Tutorial />;
      case "countdown":
        return (
          <>
            <GamePlay />
            <Countdown />
          </>
        );
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
    <div className="min-h-screen bg-cream-50">
      <div className="container mx-auto">
        <div className="bg-cream-50">
          {renderGamePhase()}
        </div>
      </div>
    </div>
  );
}
