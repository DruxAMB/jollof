"use client";

import { Button } from "./Button";
import { Card } from "./Card";
import { useGameContext } from "@/lib/game/context";

export function Tutorial() {
  const { dispatch } = useGameContext();

  const handleSkipTutorial = () => {
    dispatch({ type: 'SKIP_TUTORIAL' });
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-xl">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">How To Play</h2>
          <p className="text-gray-600 mt-2">
            Master the art of Jollof cooking with these simple steps
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-start">
            <div className="bg-amber-100 rounded-full p-3 mr-4">
              <span className="text-2xl">👆</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-800">Tap Ingredients</h3>
              <p className="text-gray-600">
                When you see an ingredient prompt, tap on that ingredient 
                to add it to your Jollof pot.
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="bg-amber-100 rounded-full p-3 mr-4">
              <span className="text-2xl">👋</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-800">Swipe to Stir</h3>
              <p className="text-gray-600">
                When prompted to stir, swipe in any direction across the 
                pot to mix your ingredients properly.
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="bg-amber-100 rounded-full p-3 mr-4">
              <span className="text-2xl">⏱️</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-800">Perfect Timing</h3>
              <p className="text-gray-600">
                Act quickly! Perfect timing earns bonus points. The faster you 
                complete actions, the higher your score.
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="bg-amber-100 rounded-full p-3 mr-4">
              <span className="text-2xl">🔥</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-800">Build Combos</h3>
              <p className="text-gray-600">
                Complete consecutive actions correctly to build your combo multiplier.
                Don&apos;t break your streak!
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-8">
          <Button
            variant="primary"
            size="lg"
            onClick={handleSkipTutorial}
            className="px-8"
          >
            Let&apos;s Cook!
          </Button>
        </div>
      </Card>
    </div>
  );
}
