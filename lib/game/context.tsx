"use client";

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useState } from 'react';
import { 
  GameState, 
  TeamType, 
} from './types';
import { initialGameState, gameReducer } from './reducer';
import { loadGameState, saveGameState, initGameState } from './storage';
import { useMiniKit } from '@coinbase/onchainkit/minikit';

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
  // Get Farcaster user context for user-specific state
  const { context } = useMiniKit();
  const userId = context?.user?.fid ? String(context.user.fid) : undefined;
  
  // Initialize with the initial state first (synchronous)
  const [state, dispatch] = useReducer(
    gameReducer,
    initialGameState,
    initGameState
  );
  
  // Track if initial load has happened
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved state from Redis when component mounts
  useEffect(() => {
    async function loadState() {
      try {
        // Load state from Redis (this is async)
        const loadedState = await loadGameState(initialGameState, userId);
        
        // Only dispatch if the state is different than initial
        if (JSON.stringify(loadedState) !== JSON.stringify(state)) {
          // Set state by dispatching LOAD_STATE action
          dispatch({ type: 'LOAD_STATE', payload: loadedState });
        }
        
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to load game state:', error);
        setIsLoaded(true); // Still mark as loaded so UI doesn't hang
      }
    }
    
    loadState();
  }, [state, userId]); // Only re-run if user ID changes

  // Save state changes to Redis
  useEffect(() => {
    // Don't try to save until initial load is complete
    if (!isLoaded) return;
    
    // Create an async function to save state
    async function persistState() {
      try {
        await saveGameState(state, userId);
      } catch (error) {
        console.error('Failed to save game state:', error);
      }
    }
    
    // Call the function
    persistState();
  }, [state, userId, isLoaded]);

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
