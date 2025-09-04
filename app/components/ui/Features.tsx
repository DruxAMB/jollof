"use client";

import { Card } from "./Card";
import { Button } from "./Button";

type FeaturesProps = {
  setActiveTab: (tab: string) => void;
};

export function Features({ setActiveTab }: FeaturesProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="bg-gradient-to-br from-amber-50 to-orange-100 border-amber-200">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-amber-800 mb-2">Jollof Wars Features</h1>
        </div>
        <ul className="space-y-3 mb-6">
          <li className="flex items-start">
            <span className="text-amber-600 mt-1 mr-2">✓</span>
            <span className="text-amber-800">
              Ghana vs Nigeria Jollof cooking competition
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-amber-600 mt-1 mr-2">✓</span>
            <span className="text-amber-800">
              Interactive gameplay with swipe and tap mechanics
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-amber-600 mt-1 mr-2">✓</span>
            <span className="text-amber-800">
              Global leaderboard to track top chefs
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-amber-600 mt-1 mr-2">✓</span>
            <span className="text-amber-800">
              Built with OnchainKit and Farcaster integration
            </span>
          </li>
        </ul>
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setActiveTab("home")}>
            Back to Home
          </Button>
        </div>
      </Card>
    </div>
  );
}
