import { GameState } from './types';
import { initialGameState } from './reducer';

const STORAGE_KEY = 'jollof_wars_game_state';

/**
 * Save game state to local storage
 * @param state Current game state
 */
export function saveGameState(state: GameState): void {
  // Don't try to save in SSR environment
  if (typeof window === 'undefined') return;
  
  try {
    const serializedState = JSON.stringify({
      team: state.team,
      playerStats: state.playerStats,
      tutorialComplete: state.tutorialComplete,
    });
    
    localStorage.setItem(STORAGE_KEY, serializedState);
  } catch (error) {
    console.error('Failed to save game state to localStorage:', error);
  }
}

/**
 * Load game state from local storage
 * @param initialState Default state to use if nothing is in storage
 * @returns Game state with persisted values
 */
export function loadGameState(initialState: GameState): GameState {
  // Use initial state in SSR environment
  if (typeof window === 'undefined') return initialState;
  
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    
    if (!serializedState) return initialState;
    
    const savedState = JSON.parse(serializedState);
    
    return {
      ...initialState,
      team: savedState.team || initialState.team,
      playerStats: savedState.playerStats || initialState.playerStats,
      tutorialComplete: savedState.tutorialComplete || initialState.tutorialComplete,
    };
  } catch (error) {
    console.error('Failed to load game state from localStorage:', error);
    return initialState;
  }
}

/**
 * Clear saved game state from local storage
 */
export function clearGameState(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear game state from localStorage:', error);
  }
}
