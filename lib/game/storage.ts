import { GameState } from './types';
import { initialGameState } from './reducer';
import { redis } from '../redis';

const GAME_STATE_KEY = 'jollof_wars:game_state';
const USER_STATE_KEY = 'jollof_wars:user_state';

/**
 * Helper function to check if Redis is available
 */
function isRedisAvailable(): boolean {
  return redis !== null;
}

/**
 * Save game state to Redis
 * @param state Current game state
 * @param userId Optional user ID (Farcaster FID) for user-specific state
 */
export async function saveGameState(state: GameState, userId?: string): Promise<void> {
  try {
    // If Redis isn't available, don't try to save
    if (!isRedisAvailable() || !redis) {
      console.warn('Redis not available, game state will not be persisted');
      return;
    }

    // Prepare the data to save
    const dataToSave = {
      team: state.team || '',  // Ensure team is a string, never null
      playerStats: JSON.stringify(state.playerStats),
      tutorialComplete: state.tutorialComplete ? 'true' : 'false',
    };
    
    // If we have a userId (Farcaster FID), save to user-specific state
    if (userId) {
      await redis.hset(`${USER_STATE_KEY}:${userId}`, dataToSave);
    } else {
      // Otherwise, save to general game state
      await redis.hset(GAME_STATE_KEY, dataToSave);
    }
  } catch (error) {
    console.error('Failed to save game state to Redis:', error);
  }
}

/**
 * Load game state from Redis
 * @param initialState Default state to use if nothing is in storage
 * @param userId Optional user ID (Farcaster FID) for user-specific state
 * @returns Game state with persisted values
 */
export async function loadGameState(
  initialState: GameState, 
  userId?: string
): Promise<GameState> {
  try {
    // If Redis isn't available, return the initial state
    if (!isRedisAvailable() || !redis) {
      console.warn('Redis not available, using initial game state');
      return initialState;
    }

    // Try to get user-specific state if userId provided
    let savedState: Record<string, any> | null = null;
    if (userId) {
      savedState = await redis.hgetall(`${USER_STATE_KEY}:${userId}`);
    }
    
    // If no user state found or no userId provided, try the general state
    if (!savedState || Object.keys(savedState).length === 0) {
      savedState = await redis.hgetall(GAME_STATE_KEY);
    }
    
    // If no saved state at all, return the initial state
    if (!savedState || Object.keys(savedState).length === 0) {
      return initialState;
    }
    
    // Parse the player stats
    let playerStats = initialState.playerStats;
    if (savedState.playerStats && typeof savedState.playerStats === 'string') {
      try {
        playerStats = JSON.parse(savedState.playerStats);
      } catch (e) {
        console.error('Failed to parse playerStats:', e);
      }
    }

    // Return merged state
    return {
      ...initialState,
      team: savedState.team || initialState.team,
      playerStats: playerStats,
      tutorialComplete: savedState.tutorialComplete === 'true' || initialState.tutorialComplete,
    };
  } catch (error) {
    console.error('Failed to load game state from Redis:', error);
    return initialState;
  }
}

/**
 * Synchronous fallback for loadGameState when Redis isn't available
 * This is needed for the useReducer initialization
 * @param initialState Default state to use
 * @returns The initial game state
 */
export function initGameState(initialState: GameState): GameState {
  // Just return the initial state - real loading will happen in the component
  return initialState;
}

/**
 * Clear saved game state from Redis
 * @param userId Optional user ID to clear specific user state
 */
export async function clearGameState(userId?: string): Promise<void> {
  try {
    // If Redis isn't available, don't try to clear
    if (!isRedisAvailable() || !redis) {
      console.warn('Redis not available, cannot clear game state');
      return;
    }
    
    if (userId) {
      // Clear user-specific state
      await redis.del(`${USER_STATE_KEY}:${userId}`);
    } else {
      // Clear general game state
      await redis.del(GAME_STATE_KEY);
    }
  } catch (error) {
    console.error('Failed to clear game state from Redis:', error);
  }
}
