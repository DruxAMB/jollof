/**
 * Core type definitions for the Jollof Wars game
 */

export type TeamType = 'ghana' | 'nigeria';

export type GamePhase = 
  | 'team_selection' 
  | 'tutorial' 
  | 'countdown' 
  | 'playing' 
  | 'scoring' 
  | 'results';

export type ActionType = 'tap' | 'swipe';

export type IngredientType = 'rice' | 'tomato' | 'pepper' | 'onion' | 'spice';

export type SwipeDirection = 'left' | 'right' | 'stir';

export interface GameAction {
  type: ActionType;
  ingredient?: IngredientType;
  direction?: SwipeDirection;
  timingWindow: number; // ms for perfect timing
}

export interface GameScore {
  baseScore: number;
  timingBonus: number;
  comboBonus: number;
  accuracyPenalty: number;
  totalScore: number;
}

export interface GameSettings {
  roundDuration: number; // in seconds
  countdownDuration: number; // in seconds
  perfectTimingWindow: number; // in milliseconds
  goodTimingWindow: number; // in milliseconds
  comboMultiplier: number;
}

export interface PlayerStats {
  highScore: number;
  totalPlays: number;
  perfectActions: number;
  longestCombo: number;
  badges: string[];
}

export interface ScoreEntry {
  playerName: string;
  team: TeamType;
  score: number;
  timestamp: number;
  perfectActions?: number;
  longestCombo?: number;
  id?: string;
}

export interface GameState {
  phase: GamePhase;
  team: TeamType | null;
  timer: number;
  score: GameScore;
  combo: number;
  actions: GameAction[];
  nextAction: GameAction | null;
  completedActions: number;
  settings: GameSettings;
  playerStats: PlayerStats;
  tutorialComplete: boolean;
  lastPlayerName?: string;
}
