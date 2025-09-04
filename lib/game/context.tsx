"use client";

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { 
  GameState, 
  GamePhase, 
  TeamType, 
  GameAction, 
  GameScore,
  PlayerStats
} from './types';
import { initialGameState, gameReducer } from './reducer';
import { loadGameState, saveGameState } from './storage';

// Re-export the GameReducerAction type from the reducer
type GameReducerAction = import('./reducer').GameReducerAction;

// Define the context shape
interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameReducerAction>;
  selectTeam: (team: TeamType) => void;
  startGame: () => void;
  performAction: (actionType: string, value?: string) => void;
  completeAction: (success: boolean, timing: number) => void;
  endGame: () => void;
  resetGame: () => void;
  skipTutorial: () => void;
}

// Create the context with a default undefined value
const GameContext = createContext<GameContextType | undefined>(undefined);

// Provider props interface
interface GameProviderProps {
  children: ReactNode;
}

// Game provider component
export function GameProvider({ children }: GameProviderProps) {
  // Load saved state or use initial state
  const [state, dispatch] = useReducer(
    gameReducer,
    initialGameState,
    loadGameState
  );

  // Save state changes to local storage
  useEffect(() => {
    saveGameState(state);
  }, [state]);

  // Context value functions
  const selectTeam = (team: TeamType) => {
    dispatch({ type: 'SELECT_TEAM', payload: team });
  };

  const startGame = () => {
    dispatch({ type: 'START_GAME' });
  };

  const performAction = (actionType: string, value?: string) => {
    dispatch({ 
      type: 'PERFORM_ACTION', 
      payload: { actionType, value } 
    });
  };

  const completeAction = (success: boolean, timing: number) => {
    dispatch({ 
      type: 'COMPLETE_ACTION', 
      payload: { success, timing } 
    });
  };

  const endGame = () => {
    dispatch({ type: 'END_GAME' });
  };

  const resetGame = () => {
    dispatch({ type: 'RESET_GAME' });
  };

  const skipTutorial = () => {
    dispatch({ type: 'SKIP_TUTORIAL' });
  };

  // Create context value
  const value = {
    state,
    dispatch,
    selectTeam,
    startGame,
    performAction,
    completeAction,
    endGame,
    resetGame,
    skipTutorial
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

// Custom hook for using the game context
export function useGameContext() {
  const context = useContext(GameContext);
  
  if (context === undefined) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  
  return context;
}

// Alias for backward compatibility
export const useGame = useGameContext;
