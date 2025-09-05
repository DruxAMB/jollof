import { GameState } from './types';

// API endpoints for game state persistence
const GAME_STATE_API = '/api/game-state';

/**
 * Save game state using API route
 * @param state Current game state
 * @param userId Optional user ID (Farcaster FID) for user-specific state
 */
export async function saveGameState(state: GameState, userId?: string): Promise<void> {
  try {
    const response = await fetch(GAME_STATE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ state, userId }),
    });
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        console.error('Failed to save game state:', errorData.error || response.status);
      } catch (parseError) {
        console.error('Failed to save game state:', response.status, response.statusText);
      }
    }
  } catch (error) {
    console.error('Failed to save game state via API:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Load game state using API route
 * @param initialState Default state to use if nothing is in storage
 * @param userId Optional user ID (Farcaster FID) for user-specific state
 * @returns Game state with persisted values
 */
export async function loadGameState(
  initialState: GameState, 
  userId?: string
): Promise<GameState> {
  try {
    // Build the URL with userId as a query parameter if provided
    const url = userId ? `${GAME_STATE_API}?userId=${userId}` : GAME_STATE_API;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
      },
      // Use credentials: 'same-origin' to ensure cookies are sent
      credentials: 'same-origin',
    });
    
    if (!response.ok) {
      console.warn(`Failed to load game state (${response.status}: ${response.statusText}), using initial state`);
      return initialState;
    }
    
    const savedState = await response.json().catch(error => {
      console.error('Failed to parse game state response:', error);
      return null;
    });
    
    // If no saved state or empty object returned, return the initial state
    if (!savedState || Object.keys(savedState).length === 0) {
      return initialState;
    }
    
    // Return merged state
    return {
      ...initialState,
      team: savedState.team || initialState.team,
      playerStats: savedState.playerStats || initialState.playerStats,
      tutorialComplete: savedState.tutorialComplete || initialState.tutorialComplete,
    };
  } catch (error) {
    console.error('Failed to load game state via API:', error);
    return initialState;
  }
}

/**
 * Synchronous fallback for loadGameState 
 * This is needed for the useReducer initialization
 * @param initialState Default state to use
 * @returns The initial game state
 */
export function initGameState(initialState: GameState): GameState {
  // Just return the initial state - real loading will happen in the component
  return initialState;
}

/**
 * Clear saved game state using API route
 * @param userId Optional user ID to clear specific user state
 */
export async function clearGameState(userId?: string): Promise<void> {
  try {
    // Build the URL with userId as a query parameter if provided
    const url = userId ? `${GAME_STATE_API}?userId=${userId}` : GAME_STATE_API;
    
    const response = await fetch(url, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        console.error('Failed to clear game state:', errorData.error || response.status);
      } catch (parseError) {
        console.error('Failed to clear game state:', response.status, response.statusText);
      }
    }
  } catch (error) {
    console.error('Failed to clear game state via API:', error instanceof Error ? error.message : String(error));
  }
}
