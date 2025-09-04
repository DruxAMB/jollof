"use client";

import {
  useMiniKit,
  useAddFrame,
  useOpenUrl,
} from "@coinbase/onchainkit/minikit";
import {
  Name,
  Identity,
  Address,
  Avatar,
  EthBalance,
} from "@coinbase/onchainkit/identity";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Button } from "./components/ui/Button";
import { Home } from "./components/ui/Home";
import { Features } from "./components/ui/Features";
import Link from "next/link";

export default function App() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const [frameAdded, setFrameAdded] = useState(false);
  const [activeTab, setActiveTab] = useState("home");

  const addFrame = useAddFrame();
  const openUrl = useOpenUrl();

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  const handleAddFrame = useCallback(async () => {
    const frameAdded = await addFrame();
    setFrameAdded(Boolean(frameAdded));
  }, [addFrame]);

  const saveFrameButton = useMemo(() => {
    if (context && !context.client.added) {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddFrame}
          className="text-amber-600 p-4"
          icon={<span>➕</span>}
        >
          Save Frame
        </Button>
      );
    }

    if (frameAdded) {
      return (
        <div className="flex items-center space-x-1 text-sm font-medium text-amber-600 animate-fade-out">
          <span>✓</span>
          <span>Saved</span>
        </div>
      );
    }

    return null;
  }, [context, frameAdded, handleAddFrame]);

  return (
    <div className="flex flex-col min-h-screen font-sans text-amber-900 bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="w-full max-w-md mx-auto px-4 py-3">
        <header className="flex justify-between items-center mb-3 h-11">
          <div>
            <div className="flex items-center space-x-2">
              <Wallet className="z-10">
                <ConnectWallet>
                  <Name className="text-inherit" />
                </ConnectWallet>
                <WalletDropdown>
                  <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                    <Avatar />
                    <Name />
                    <Address />
                    <EthBalance />
                  </Identity>
                  <WalletDropdownDisconnect />
                </WalletDropdown>
              </Wallet>
            </div>
          </div>
          <div>{saveFrameButton}</div>
        </header>

        <main className="flex-1">
          {activeTab === "home" && <Home setActiveTab={setActiveTab} />}
          {activeTab === "features" && <Features setActiveTab={setActiveTab} />}
          {activeTab === "leaderboard" && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl shadow-md border border-amber-200 overflow-hidden">
                <div className="p-6">
                  <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-amber-800 mb-2">Jollof Wars Leaderboard</h1>
                    <p className="text-amber-700 mb-6">
                      See who's cooking the best Jollof in the competition!
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    <Link href="/leaderboard" passHref>
                      <Button
                        variant="primary"
                        size="lg"
                        className="px-8 mb-4"
                      >
                        View Leaderboard
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost"
                      size="sm" 
                      onClick={() => setActiveTab("home")} 
                      className="mt-2"
                    >
                      Back to Home
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === "game" && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl shadow-md border border-amber-200 overflow-hidden">
                <div className="p-6">
                  <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-amber-800 mb-2">Jollof Wars</h1>
                    <p className="text-amber-700 mb-6">
                      The ultimate Ghana vs Nigeria Jollof cooking competition!
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    <Link href="/game" passHref>
                      <Button
                        variant="primary"
                        size="lg"
                        className="px-8 mb-4"
                        icon={<span className="mr-1">🍚</span>}
                      >
                        Play Now
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost"
                      size="sm" 
                      onClick={() => setActiveTab("home")} 
                      className="mt-2"
                    >
                      Back to Home
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        <nav className="mt-4 border-t border-amber-200 pt-4">
          <div className="flex justify-around">
            <Button
              variant={activeTab === "home" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("home")}
              className="flex flex-col items-center"
              icon={<span className="text-lg">🏠</span>}
            >
              Home
            </Button>
            <Button
              variant={activeTab === "game" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("game")}
              className="flex flex-col items-center"
              icon={<span className="text-lg">🍚</span>}
            >
              Game
            </Button>
            <Button
              variant={activeTab === "leaderboard" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("leaderboard")}
              className="flex flex-col items-center"
              icon={<span className="text-lg">🏆</span>}
            >
              Ranks
            </Button>
            <Button
              variant={activeTab === "features" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("features")}
              className="flex flex-col items-center"
              icon={<span className="text-lg">✨</span>}
            >
              Features
            </Button>
          </div>
        </nav>
        
        <footer className="mt-2 pt-4 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-amber-700 text-xs"
            onClick={() => openUrl("https://base.org/builders/minikit")}
          >
            Built on Base with MiniKit
          </Button>
        </footer>
      </div>
    </div>
  );
}
