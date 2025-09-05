"use client";

import { TeamType } from "@/lib/game/types";
import { Card } from "../ui/Card";
import { useGameContext } from "@/lib/game/context";

export function TeamSelection() {
  const { state, dispatch } = useGameContext();
  
  const handleSelectTeam = (team: TeamType) => {
    dispatch({ type: 'SELECT_TEAM', payload: team });
    dispatch({ type: 'START_GAME' });
  };
  
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
