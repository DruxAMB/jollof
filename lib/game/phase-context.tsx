"use client";

import { createContext, useState, useContext, ReactNode } from "react";
import { GamePhase } from "./types";

interface GamePhaseContextType {
  activePhase: GamePhase;
  setActivePhase: (phase: GamePhase) => void;
}

const GamePhaseContext = createContext<GamePhaseContextType | undefined>(undefined);

export function GamePhaseProvider({ children }: { children: ReactNode }) {
  const [activePhase, setActivePhase] = useState<GamePhase>("team_selection");
  
  return (
    <GamePhaseContext.Provider value={{ activePhase, setActivePhase }}>
      {children}
    </GamePhaseContext.Provider>
  );
}

export function useGamePhase() {
  const context = useContext(GamePhaseContext);
  
  if (context === undefined) {
    throw new Error("useGamePhase must be used within a GamePhaseProvider");
  }
  
  return context;
}
