"use client";

import { useEffect, useState, useCallback } from "react";
import { useGameContext } from "@/lib/game/context";
import { CookingPot } from "./CookingPot";
import { Ingredients } from "./Ingredients";
import { ActionPrompt } from "./ActionPrompt";
import { ScoreDisplay } from "./ScoreDisplay";
import { CountdownTimer } from "./CountdownTimer";
import { ActionFeedback } from "./ActionFeedback";
import { IngredientType, SwipeDirection } from "@/lib/game/types";
import { JSX } from "react";

export function GamePlay(): JSX.Element {
  const { state, dispatch } = useGameContext();
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [actionFeedback, setActionFeedback] = useState({ show: false, success: false });
  
  // Timer effect - only depends on dispatch, not on state.timer
  // This prevents unnecessary effect re-runs when timer changes
  useEffect(() => {
    // Start game timer when component mounts
    // Update by 1 second every 1 second to ensure the timer display works correctly
    const timer = setInterval(() => {
      dispatch({ type: 'UPDATE_TIMER', payload: 1 });
    }, 1000);
    
    return () => clearInterval(timer);
    // Intentionally omit state.timer to prevent re-creating interval on every tick
  }, [dispatch]);
  
  useEffect(() => {
    // Update progress based on completed actions
    if (state.actions.length > 0) {
      const progress = (state.completedActions / state.actions.length) * 100;
      setProgressPercentage(progress);
    }
  }, [state.completedActions, state.actions.length]);
  
  const handleActionFeedbackComplete = useCallback(() => {
    setActionFeedback({ show: false, success: false });
  }, []);
  
  // Calculate timing for actions - extracted to a function to avoid duplication
  const calculateActionTiming = useCallback(() => {
    // Guaranteed positive value between 200-800ms to ensure points are awarded
    return Math.floor(Math.random() * 600) + 200;
  }, []);
  
  // Handle ingredient tap with memoization
  const handleIngredientTap = useCallback((ingredient: IngredientType) => {
    // Only process if current action is a tap action
    if (state.nextAction?.type === 'tap') {
      // Record that user performed the action
      dispatch({ 
        type: 'PERFORM_ACTION', 
        payload: { actionType: 'tap', value: ingredient } 
      });
      
      // Check if it was the right ingredient
      const success = state.nextAction.ingredient === ingredient;
      
      // Show feedback animation
      setActionFeedback({ show: true, success });
      
      // Calculate timing and complete the action
      const timing = calculateActionTiming();
      
      dispatch({
        type: 'COMPLETE_ACTION',
        payload: { success, timing }
      });
    }
  }, [state.nextAction, dispatch, setActionFeedback, calculateActionTiming]);
  
  // Handle swipe with memoization
  const handleSwipe = useCallback((direction: SwipeDirection) => {
    // Only process if current action is a swipe action
    if (state.nextAction?.type === 'swipe') {
      // Record that user performed the action
      dispatch({
        type: 'PERFORM_ACTION',
        payload: { actionType: 'swipe', value: direction }
      });
      
      // Check if it was the right direction
      const success = state.nextAction.direction === direction;
      
      // Show feedback animation
      setActionFeedback({ show: true, success });
      
      // Calculate timing and complete the action 
      const timing = calculateActionTiming();
      
      dispatch({
        type: 'COMPLETE_ACTION',
        payload: { success, timing }
      });
    }
  }, [state.nextAction, dispatch, setActionFeedback, calculateActionTiming]);
  
  // Handle pot tap with memoization
  const handlePotTap = useCallback(() => {
    // If next action is a tap, but player tapped the pot instead of an ingredient,
    // this is a mistake
    if (state.nextAction?.type === 'tap') {
      dispatch({
        type: 'COMPLETE_ACTION',
        payload: { success: false, timing: 0 }
      });
    }
  }, [state.nextAction, dispatch]);

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Visual feedback for actions */}
      <ActionFeedback 
        success={actionFeedback.success}
        show={actionFeedback.show}
        onAnimationComplete={handleActionFeedbackComplete}
      />
      
      {/* Header with timer and score */}
      <div className="flex items-center justify-between p-4 bg-white bg-opacity-90 shadow-md">
        <div>
          <CountdownTimer
            key={`timer-${state.timer}`} /* Force re-render when timer changes */
            seconds={state.timer}
            onComplete={() => dispatch({ type: 'END_GAME' })}
            size="md"
          />
        </div>
        
        <div>
          <ScoreDisplay
            score={state.score}
            combo={state.combo}
            compact={true}
          />
        </div>
      </div>
      
      {/* Main game area */}
      <div className="flex-1 flex flex-col items-center justify-between p-4">
        {/* Action prompt */}
        <div className="w-full max-w-md mb-4 text-black">
          <ActionPrompt
            actionType={state.nextAction?.type}
            ingredient={state.nextAction?.type === 'tap' ? state.nextAction.ingredient : undefined}
            direction={state.nextAction?.type === 'swipe' ? state.nextAction.direction : undefined}
            isActive={state.phase === 'playing'}
          />
        </div>
        
        {/* Cooking pot */}
        <div className="flex-1 flex items-center justify-center my-4">
          {/* Provide safe default instead of using non-null assertion */}
          <CookingPot
            team={state.team || 'nigeria'}
            progressPercentage={progressPercentage}
            isActive={state.nextAction?.type === 'swipe'}
            onTap={handlePotTap}
            onSwipe={handleSwipe}
          />
        </div>
        
        {/* Ingredients */}
        <div className="w-full max-w-xl mt-4 text-black">
          <Ingredients
            activeIngredient={state.nextAction?.type === 'tap' ? state.nextAction.ingredient : undefined}
            onIngredientClick={handleIngredientTap}
            disabled={state.nextAction?.type !== 'tap'}
          />
        </div>
      </div>
    </div>
  );
}
