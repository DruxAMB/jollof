"use client";

import { TeamType } from "@/lib/game/types";
import { Card } from "../ui/Card";
import { useGameContext } from "@/lib/game/context";
import { useEffect, useState } from "react";

export function TeamSelection() {
  const { state, dispatch } = useGameContext();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  
  // Auto-start with existing team if already selected
  useEffect(() => {
    // If user already has a team selected from previous sessions
    if (state.team) {
      setIsLoading(true);
      setLoadingText(`Team ${state.team} detected, loading game...`);
      console.log(`Team already selected: ${state.team}. Auto-starting game...`);
      
      // Small delay to show the loading state
      const timer = setTimeout(() => {
        dispatch({ type: 'START_GAME' });
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [state.team, dispatch]);
  
  const handleSelectTeam = (team: TeamType) => {
    dispatch({ type: 'SELECT_TEAM', payload: team });
    dispatch({ type: 'START_GAME' });
  };
  
  // Show loading state when team is already selected
  if (state.team) {
    return (
      <div className="flex flex-col items-center justify-center h-screen animate-fade-in transition-all duration-300">
        <div className="bg-amber-50 p-6 rounded-lg shadow-md text-center transform hover:scale-105 transition-transform duration-300 border-2 border-amber-300">
          <div className="mb-4">
            {state.team === "ghana" ? (
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 w-20 h-20 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-20 h-20 border-4 border-yellow-500 border-b-transparent rounded-full animate-spin animation-delay-150"></div>
                <div className="absolute inset-0 w-20 h-20 border-4 border-green-500 border-l-transparent rounded-full animate-spin animation-delay-300"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl">🇬🇭</span>
                </div>
              </div>
            ) : (
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 w-20 h-20 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-20 h-20 border-4 border-white border-b-transparent rounded-full animate-spin animation-delay-150"></div>
                <div className="absolute inset-0 w-20 h-20 border-4 border-green-600 border-l-transparent rounded-full animate-spin animation-delay-300"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl">🇳🇬</span>
                </div>
              </div>
            )}
          </div>
          <h2 className="text-xl font-bold text-amber-800 mb-2 animate-pulse">
            {loadingText || "Loading game..."}
          </h2>
          <p className="text-amber-600 font-medium">
            {state.team === "ghana" ? "Team Ghana 🇬🇭" : "Team Nigeria 🇳🇬"}
          </p>
          <div className="mt-3 flex items-center justify-center gap-1">
            <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce animation-delay-150"></div>
            <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce animation-delay-300"></div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Calculating scores...
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-start mb-16 px-4 py-8 w-full">
      <div className="text-center my-8">
        <h1 className="text-2xl font-extrabold text-black mb-3 uppercase">Which country cooks the best Jollof rice?</h1>
        <p className="text-amber-700">Select your team and prove it!</p>
      </div>
      
      <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ghana Team */}
        <Card 
          onClick={() => handleSelectTeam('ghana')}
          className={`border-4 ${state.team === 'ghana' ? 'border-yellow-400' : 'border-black'}`}
        >
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-red-500 to-yellow-500 mb-4 flex items-center justify-center shadow-md overflow-hidden">
              <div className="w-full h-full bg-[url('/flag-ghana.png')] bg-cover bg-center"></div>
            </div>
            <h3 className="text-xl font-bold mb-2 text-black">Team Ghana</h3>
            <p className="text-gray-600 text-center mb-4">Masters of authentic Jollof with the perfect balance of flavors</p>
            <div className="flex space-x-2">
              <span className="inline-block px-2 py-1 bg-yellow-300 text-black font-bold text-sm rounded-full border border-black">Rich</span>
              <span className="inline-block px-2 py-1 bg-yellow-300 text-black font-bold text-sm rounded-full border border-black">Authentic</span>
              <span className="inline-block px-2 py-1 bg-yellow-300 text-black font-bold text-sm rounded-full border border-black">Traditional</span>
            </div>
          </div>
        </Card>
        
        {/* Nigeria Team */}
        <Card 
          onClick={() => handleSelectTeam('nigeria')}
          className={`border-4 ${state.team === 'nigeria' ? 'border-green-400' : 'border-black'}`}
        >
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-green-500 to-white mb-4 flex items-center justify-center shadow-md overflow-hidden">
              <div className="w-full h-full bg-[url('/flag-nigeria.png')] bg-cover bg-center"></div>
            </div>
            <h3 className="text-xl font-bold mb-2 text-black">Team Nigeria</h3>
            <p className="text-gray-600 text-center mb-4">Bold flavors with the perfect spice level that made Jollof famous</p>
            <div className="flex space-x-2">
              <span className="inline-block px-2 py-1 bg-green-300 text-black font-bold text-sm rounded-full border border-black">Spicy</span>
              <span className="inline-block px-2 py-1 bg-green-300 text-black font-bold text-sm rounded-full border border-black">Bold</span>
              <span className="inline-block px-2 py-1 bg-green-300 text-black font-bold text-sm rounded-full border border-black">Flavorful</span>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Team selection now automatically starts the game */}
    </div>
  );
}
