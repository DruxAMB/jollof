import { 
  GameState, 
  GamePhase, 
  TeamType, 
  GameAction,
  GameScore,
  GameSettings,
  PlayerStats
} from './types';

// Define action types
export type GameReducerAction =
  | { type: 'SELECT_TEAM'; payload: TeamType }
  | { type: 'START_GAME' }
  | { type: 'BEGIN_PLAYING' } 
  | { type: 'PERFORM_ACTION'; payload: { actionType: string; value?: string } }
  | { type: 'COMPLETE_ACTION'; payload: { success: boolean; timing: number } }
  | { type: 'UPDATE_TIMER'; payload: number }
  | { type: 'END_GAME' }
  | { type: 'RESET_GAME' }
  | { type: 'SKIP_TUTORIAL' }
  | { type: 'LOAD_STATE'; payload: GameState };

// Initial game settings
const defaultGameSettings: GameSettings = {
  roundDuration: 30, // 30 seconds per round
  countdownDuration: 3, // 3 second countdown
  perfectTimingWindow: 300, // 300ms window for perfect timing
  goodTimingWindow: 700, // 700ms window for good timing
  comboMultiplier: 0.1, // 10% bonus per combo
};

// Initial player stats
const defaultPlayerStats: PlayerStats = {
  highScore: 0,
  totalPlays: 0,
  perfectActions: 0,
  longestCombo: 0,
  badges: [],
};

// Initial score state
const initialScore: GameScore = {
  baseScore: 0,
  timingBonus: 0,
  comboBonus: 0,
  accuracyPenalty: 0,
  totalScore: 0,
};

// Initial game state
export const initialGameState: GameState = {
  phase: 'team_selection',
  team: null,
  timer: 30, // Default to game round duration
  score: initialScore,
  combo: 0,
  actions: [],
  nextAction: null,
  completedActions: 0,
  settings: defaultGameSettings,
  playerStats: defaultPlayerStats,
  tutorialComplete: false,
};

// Sample cooking actions sequence
const cookingActions: GameAction[] = [
  { type: 'tap', ingredient: 'rice', timingWindow: 1000 },
  { type: 'tap', ingredient: 'tomato', timingWindow: 1000 },
  { type: 'tap', ingredient: 'onion', timingWindow: 1000 },
  { type: 'swipe', direction: 'stir', timingWindow: 1500 },
  { type: 'tap', ingredient: 'pepper', timingWindow: 1000 },
  { type: 'swipe', direction: 'stir', timingWindow: 1500 },
  { type: 'tap', ingredient: 'spice', timingWindow: 1000 },
  { type: 'swipe', direction: 'stir', timingWindow: 1500 },
];

// Game reducer function
export function gameReducer(state: GameState, action: GameReducerAction): GameState {
  switch (action.type) {
    case 'SELECT_TEAM':
      return {
        ...state,
        team: action.payload,
        phase: state.tutorialComplete ? 'countdown' : 'tutorial',
      };
      
    case 'START_GAME':
      // Initialize game with cooking actions and start timer
      return {
        ...state,
        phase: 'countdown',
        timer: state.settings.countdownDuration,
        actions: [...cookingActions], // Copy actions to not mutate original
        nextAction: cookingActions[0],
        score: initialScore,
        combo: 0,
        completedActions: 0,
      };
      
    case 'BEGIN_PLAYING':
      // Transition from countdown to playing phase
      return {
        ...state,
        phase: 'playing',
        timer: state.settings.roundDuration,
      };
      
    case 'PERFORM_ACTION':
      // Process player's action (tap or swipe)
      const { actionType, value } = action.payload;
      
      // Check if this matches the expected next action
      if (!state.nextAction) return state;
      
      const isCorrectAction = 
        (state.nextAction.type === actionType) && 
        ((actionType === 'tap' && state.nextAction.ingredient === value) ||
         (actionType === 'swipe' && state.nextAction.direction === value));
         
      return {
        ...state,
        // We'll calculate timing and success in COMPLETE_ACTION
        // This step just registers that an action was performed
      };
      
    case 'COMPLETE_ACTION':
      const { success, timing } = action.payload;
      
      if (!success) {
        // Failed action breaks the combo
        return {
          ...state,
          combo: 0,
          score: {
            ...state.score,
            accuracyPenalty: state.score.accuracyPenalty + 50, // Penalty for wrong action
            totalScore: state.score.baseScore + state.score.timingBonus + 
                      state.score.comboBonus - (state.score.accuracyPenalty + 50),
          }
        };
      }
      
      // Calculate score based on timing
      let timingBonus = 0;
      let isPerfect = false;
      
      if (timing <= state.settings.perfectTimingWindow) {
        timingBonus = 100;
        isPerfect = true;
      } else if (timing <= state.settings.goodTimingWindow) {
        timingBonus = 50;
      } else {
        timingBonus = 25;
      }
      
      // Increment combo and calculate bonus
      const newCombo = state.combo + 1;
      const comboBonus = Math.floor(newCombo * state.settings.comboMultiplier * 100);
      
      // Update player stats if needed
      const updatedPerfectActions = isPerfect 
        ? state.playerStats.perfectActions + 1 
        : state.playerStats.perfectActions;
        
      const updatedLongestCombo = Math.max(state.playerStats.longestCombo, newCombo);
      
      // Get next action if available
      const completedActions = state.completedActions + 1;
      const nextActionIndex = completedActions;
      const nextAction = nextActionIndex < state.actions.length 
        ? state.actions[nextActionIndex] 
        : null;
        
      // Calculate new total score
      const baseScore = state.score.baseScore + 100; // Base points for completing action
      const newTimingBonus = state.score.timingBonus + timingBonus;
      const newComboBonus = state.score.comboBonus + comboBonus;
      const totalScore = baseScore + newTimingBonus + newComboBonus - state.score.accuracyPenalty;
        
      // Check if we've completed all actions
      const isCompleted = nextAction === null;
      
      return {
        ...state,
        combo: newCombo,
        completedActions,
        nextAction,
        score: {
          baseScore,
          timingBonus: newTimingBonus,
          comboBonus: newComboBonus,
          accuracyPenalty: state.score.accuracyPenalty,
          totalScore,
        },
        playerStats: {
          ...state.playerStats,
          perfectActions: updatedPerfectActions,
          longestCombo: updatedLongestCombo,
        },
        phase: isCompleted ? 'scoring' : state.phase,
      };
      
    case 'UPDATE_TIMER':
      const newTimer = state.timer - action.payload;
      
      // Check if time is up
      if (newTimer <= 0) {
        // If we're in countdown phase, transition to playing
        if (state.phase === 'countdown') {
          return {
            ...state,
            phase: 'playing',
            timer: state.settings.roundDuration, // Set to round duration
          };
        }
        
        // If we're playing, time's up - go to results
        if (state.phase === 'playing') {
          return {
            ...state,
            phase: 'results',
            timer: 0,
            playerStats: {
              ...state.playerStats,
              totalPlays: state.playerStats.totalPlays + 1,
              highScore: Math.max(state.playerStats.highScore, state.score.totalScore),
            }
          };
        }
      }
      
      return {
        ...state,
        timer: Math.max(0, newTimer),
      };
      
    case 'END_GAME':
      return {
        ...state,
        phase: 'results',
        playerStats: {
          ...state.playerStats,
          totalPlays: state.playerStats.totalPlays + 1,
          highScore: Math.max(state.playerStats.highScore, state.score.totalScore),
        }
      };
      
    case 'RESET_GAME':
      return {
        ...initialGameState,
        team: state.team,  // Preserve team selection
        tutorialComplete: state.tutorialComplete, // Preserve tutorial status
        playerStats: state.playerStats, // Preserve player stats
      };
      
    case 'SKIP_TUTORIAL':
      return {
        ...state,
        phase: 'countdown',
        tutorialComplete: true,
      };
    
    case 'LOAD_STATE':
      // Replace the current state with the loaded state
      return {
        ...action.payload,
      };
      
    default:
      return state;
  }
}
