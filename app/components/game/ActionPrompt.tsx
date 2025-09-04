"use client";

import { useEffect, useState } from "react";
import { ActionType, IngredientType, SwipeDirection } from "@/lib/game/types";

interface ActionPromptProps {
  actionType?: ActionType;
  ingredient?: IngredientType;
  direction?: SwipeDirection;
  isActive: boolean;
  className?: string;
}

export function ActionPrompt({
  actionType,
  ingredient,
  direction,
  isActive,
  className = "",
}: ActionPromptProps) {
  const [animation, setAnimation] = useState("");
  
  useEffect(() => {
    if (isActive) {
      setAnimation("animate-pulse");
    } else {
      setAnimation("");
    }
  }, [isActive]);

  if (!actionType) {
    return null;
  }

  // Icons/images for each ingredient
  const ingredientIcons: Record<IngredientType, string> = {
    rice: "🍚",
    tomato: "🍅",
    pepper: "🌶️",
    onion: "🧅",
    spice: "🌿",
  };

  // Icons for each swipe direction
  const directionIcons: Record<SwipeDirection, string> = {
    left: "⬅️",
    right: "➡️",
    stir: "🔄",
  };

  return (
    <div className={`text-center ${className}`}>
      <div className="mb-2">
        <span className="text-lg font-semibold text-gray-700">
          {actionType === "tap" ? "Tap" : "Swipe"}:
        </span>
      </div>

      <div className={`text-4xl ${animation}`}>
        {actionType === "tap" && ingredient && ingredientIcons[ingredient]}
        {actionType === "swipe" && direction && directionIcons[direction]}
      </div>

      <div className="mt-3 text-lg font-medium">
        {actionType === "tap" && ingredient && 
          <span>Add {ingredient.charAt(0).toUpperCase() + ingredient.slice(1)}</span>
        }
        {actionType === "swipe" && direction && 
          <span>{direction === "stir" ? "Stir the pot" : `Swipe ${direction}`}</span>
        }
      </div>
    </div>
  );
}
