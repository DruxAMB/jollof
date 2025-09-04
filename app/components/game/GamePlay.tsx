"use client";

import { useEffect, useState } from "react";
import { useGameContext } from "@/lib/game/context";
import { CookingPot } from "./CookingPot";
import { Ingredients } from "./Ingredients";
import { ActionPrompt } from "./ActionPrompt";
import { ScoreDisplay } from "./ScoreDisplay";
import { CountdownTimer } from "./CountdownTimer";
import { IngredientType, SwipeDirection } from "@/lib/game/types";

export function GamePlay() {
  const { state, dispatch } = useGameContext();
  const [progressPercentage, setProgressPercentage] = useState(0);
  
  useEffect(() => {
    // Start game timer when component mounts
    const timer = setInterval(() => {
      dispatch({ type: 'UPDATE_TIMER', payload: 0.1 });
    }, 100);
    
    return () => clearInterval(timer);
  }, [dispatch]);
  
  useEffect(() => {
    // Update progress based on completed actions
    if (state.actions.length > 0) {
      const progress = (state.completedActions / state.actions.length) * 100;
      setProgressPercentage(progress);
    }
  }, [state.completedActions, state.actions.length]);
  
  const handleIngredientTap = (ingredient: IngredientType) => {
    // Only process if current action is a tap action
    if (state.nextAction?.type === 'tap') {
      // Record that user performed the action
      dispatch({ 
        type: 'PERFORM_ACTION', 
        payload: { actionType: 'tap', value: ingredient } 
      });
      
      // Check if it was the right ingredient
      const success = state.nextAction.ingredient === ingredient;
      
      // Calculate timing - in a real game we'd measure actual time since action appeared
      // For now we'll use a random value to simulate timing
      const timing = Math.floor(Math.random() * 1000); 
      
      // Complete the action with success/failure and timing
      dispatch({
        type: 'COMPLETE_ACTION',
        payload: { success, timing }
      });
    }
  };
  
  const handleSwipe = (direction: SwipeDirection) => {
    // Only process if current action is a swipe action
    if (state.nextAction?.type === 'swipe') {
      // Record that user performed the action
      dispatch({
        type: 'PERFORM_ACTION',
        payload: { actionType: 'swipe', value: direction }
      });
      
      // Check if it was the right direction
      const success = state.nextAction.direction === direction;
      
      // Calculate timing - same as above, using random for demo
      const timing = Math.floor(Math.random() * 1000);
      
      // Complete the action
      dispatch({
        type: 'COMPLETE_ACTION',
        payload: { success, timing }
      });
    }
  };
  
  const handlePotTap = () => {
    // If next action is a tap, but player tapped the pot instead of an ingredient,
    // this is a mistake
    if (state.nextAction?.type === 'tap') {
      dispatch({
        type: 'COMPLETE_ACTION',
        payload: { success: false, timing: 0 }
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with timer and score */}
      <div className="flex items-center justify-between p-4 bg-white bg-opacity-90 shadow-md">
        <div>
          <CountdownTimer
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
        <div className="w-full max-w-md mb-4">
          <ActionPrompt
            actionType={state.nextAction?.type}
            ingredient={state.nextAction?.type === 'tap' ? state.nextAction.ingredient : undefined}
            direction={state.nextAction?.type === 'swipe' ? state.nextAction.direction : undefined}
            isActive={true}
          />
        </div>
        
        {/* Cooking pot */}
        <div className="flex-1 flex items-center justify-center my-4">
          <CookingPot
            team={state.team!}
            progressPercentage={progressPercentage}
            isActive={state.nextAction?.type === 'swipe'}
            onTap={handlePotTap}
            onSwipe={handleSwipe}
          />
        </div>
        
        {/* Ingredients */}
        <div className="w-full max-w-xl mt-4">
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
