"use client";

import { IngredientType } from "@/lib/game/types";
import { useState, useEffect } from "react";

interface IngredientsProps {
  activeIngredient?: IngredientType;
  onIngredientClick: (ingredient: IngredientType) => void;
  disabled?: boolean;
  className?: string;
}

export function Ingredients({
  activeIngredient,
  onIngredientClick,
  disabled = false,
  className = "",
}: IngredientsProps) {
  const ingredients: IngredientType[] = ['rice', 'tomato', 'pepper', 'onion', 'spice'];
  
  // Ingredient details for display
  const ingredientDetails: Record<IngredientType, { emoji: string; color: string; }> = {
    rice: { 
      emoji: "🍚", 
      color: "bg-amber-100 hover:bg-amber-200 border-amber-300" 
    },
    tomato: { 
      emoji: "🍅", 
      color: "bg-red-100 hover:bg-red-200 border-red-300" 
    },
    pepper: { 
      emoji: "🌶️", 
      color: "bg-red-100 hover:bg-red-200 border-red-300" 
    },
    onion: { 
      emoji: "🧅", 
      color: "bg-purple-100 hover:bg-purple-200 border-purple-300" 
    },
    spice: { 
      emoji: "🌿", 
      color: "bg-green-100 hover:bg-green-200 border-green-300" 
    },
  };

  return (
    <div className={`grid grid-cols-5 gap-2 sm:gap-4 ${className}`}>
      {ingredients.map((ingredient) => (
        <button
          key={ingredient}
          className={`
            aspect-square p-2 sm:p-4 rounded-full border-2 transition-all
            ${ingredientDetails[ingredient].color}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105'}
            ${activeIngredient === ingredient ? 'ring-4 ring-blue-400 animate-pulse' : ''}
          `}
          onClick={() => !disabled && onIngredientClick(ingredient)}
          disabled={disabled}
          aria-label={`Add ${ingredient}`}
        >
          <div className="text-2xl sm:text-4xl flex items-center justify-center">
            {ingredientDetails[ingredient].emoji}
          </div>
          <div className="text-xs sm:text-sm mt-1 font-medium capitalize">
            {ingredient}
          </div>
        </button>
      ))}
    </div>
  );
}
