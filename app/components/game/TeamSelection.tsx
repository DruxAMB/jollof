"use client";

import { TeamType } from "@/lib/game/types";
import { Card } from "./Card";
import { Button } from "./Button";
import { useGameContext } from "@/lib/game/context";

export function TeamSelection() {
  const { state, dispatch } = useGameContext();
  
  const handleSelectTeam = (team: TeamType) => {
    dispatch({ type: 'SELECT_TEAM', payload: team });
  };
  
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Jollof Wars</h1>
        <p className="text-lg text-gray-600">Choose your team and cook the best Jollof rice!</p>
      </div>
      
      <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ghana Team */}
        <Card 
          variant="team"
          onClick={() => handleSelectTeam('ghana')}
          className={`border-4 ${state.team === 'ghana' ? 'border-amber-500' : 'border-transparent'}`}
        >
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-red-500 to-yellow-500 mb-4 flex items-center justify-center shadow-md overflow-hidden">
              <div className="w-full h-full bg-[url('/flag-ghana.png')] bg-cover bg-center"></div>
            </div>
            <h3 className="text-xl font-bold mb-2">Team Ghana</h3>
            <p className="text-gray-600 text-center mb-4">Masters of authentic Jollof with the perfect balance of flavors</p>
            <div className="flex space-x-2">
              <span className="inline-block px-2 py-1 bg-amber-100 text-amber-800 text-sm rounded-full">Rich</span>
              <span className="inline-block px-2 py-1 bg-amber-100 text-amber-800 text-sm rounded-full">Authentic</span>
              <span className="inline-block px-2 py-1 bg-amber-100 text-amber-800 text-sm rounded-full">Traditional</span>
            </div>
          </div>
        </Card>
        
        {/* Nigeria Team */}
        <Card 
          variant="team"
          onClick={() => handleSelectTeam('nigeria')}
          className={`border-4 ${state.team === 'nigeria' ? 'border-green-500' : 'border-transparent'}`}
        >
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-green-500 to-white mb-4 flex items-center justify-center shadow-md overflow-hidden">
              <div className="w-full h-full bg-[url('/flag-nigeria.png')] bg-cover bg-center"></div>
            </div>
            <h3 className="text-xl font-bold mb-2">Team Nigeria</h3>
            <p className="text-gray-600 text-center mb-4">Bold flavors with the perfect spice level that made Jollof famous</p>
            <div className="flex space-x-2">
              <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">Spicy</span>
              <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">Bold</span>
              <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">Flavorful</span>
            </div>
          </div>
        </Card>
      </div>
      
      {state.team && (
        <div className="mt-8">
          <Button 
            variant="primary" 
            size="lg" 
            onClick={() => dispatch({ type: 'START_GAME' })}
            className="px-8"
          >
            Start Cooking!
          </Button>
        </div>
      )}
    </div>
  );
}
