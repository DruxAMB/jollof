import { GameState } from './types';

// API endpoints for game state persistence
const GAME_STATE_API = '/api/game-state';

/**
 * Save game state using API route
 * @param state Current game state
 * @param userId Optional user ID (Farcaster FID) for user-specific state
 */
export async function saveGameState(state: GameState, userId?: string): Promise<void> {
  if (!state) {
    console.error('Cannot save empty game state');
    return;
  }

  // Ensure the state is a valid object that can be serialized
  try {
    // Check if the state can be properly serialized
    const serialized = JSON.stringify({ state, userId });
    if (!serialized || serialized === '{}' || serialized === 'null') {
      console.error('Invalid game state for saving:', state);
      return;
    }
    
    // Try to save with retry logic (max 2 attempts)
    let attempts = 0;
    const maxAttempts = 2;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        const response = await fetch(GAME_STATE_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: serialized,
          // Ensure credentials are sent
          credentials: 'same-origin',
          // Prevent caching of POST requests
          cache: 'no-store',
        });
        
        if (response.ok) {
          // Successful save, exit retry loop
          return;
        }
        
        // Handle error response
        try {
          const errorData = await response.json();
          console.error(`Failed to save game state (attempt ${attempts}/${maxAttempts}):`, 
            errorData.error || response.status);
        } catch {
          console.error(`Failed to save game state (attempt ${attempts}/${maxAttempts}):`, 
            response.status, response.statusText);
        }
        
        // Only retry if we haven't reached max attempts
        if (attempts >= maxAttempts) break;
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempts)));
      } catch (fetchError) {
        console.error(`Failed to save game state via API (attempt ${attempts}/${maxAttempts}):`, 
          fetchError instanceof Error ? fetchError.message : String(fetchError));
          
        // Only retry if we haven't reached max attempts
        if (attempts >= maxAttempts) break;
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempts)));
      }
    }
  } catch (serializationError) {
    console.error('Failed to serialize game state:', 
      serializationError instanceof Error ? serializationError.message : String(serializationError));
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
      } catch {
        console.error('Failed to clear game state:', response.status, response.statusText);
      }
    }
  } catch (error) {
    console.error('Failed to clear game state via API:', error instanceof Error ? error.message : String(error));
  }
}
