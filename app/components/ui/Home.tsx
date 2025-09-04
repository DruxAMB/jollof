"use client";

import { Card } from "./Card";
import { Button } from "./Button";
import Image from "next/image";

type HomeProps = {
  setActiveTab: (tab: string) => void;
  onOpenGame: () => void;
  onOpenLeaderboard: () => void;
};

export function Home({ setActiveTab, onOpenGame, onOpenLeaderboard }: HomeProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="bg-cream-50 border-2 border-black rounded-xl shadow-lg">
        <div className="flex flex-col items-center mb-4">
          <div className="relative w-full max-w-xs h-48 mb-4">
            <Image 
              src="/hero.png" 
              alt="Jollof Wars" 
              className="rounded-lg shadow-md object-cover"
              fill
              priority
            />
          </div>
        </div>
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-black mb-2">Welcome to Jollof Wars</h1>
          <p className="text-black mb-4">
            The ultimate Ghana vs Nigeria Jollof cooking competition! Show off your
            cooking skills and compete for the title of Jollof Champion.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button
            onClick={onOpenGame}
            variant="play"
            size="lg"
            className="w-full max-w-xs"
          >
            PLAY
          </Button>
          <Button
            variant="secondary"
            onClick={onOpenLeaderboard}
            uppercase
          >
            Leaderboard
          </Button>
          <Button
            variant="outline"
            onClick={() => setActiveTab("features")}
            uppercase
          >
            Features
          </Button>
        </div>
      </Card>
    </div>
  );
}
