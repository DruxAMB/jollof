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
import { Modal } from "./components/ui/Modal";
import { GameModal } from "./components/ui/GameModal";
import { LeaderboardModal } from "./components/ui/LeaderboardModal";

export default function App() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const [frameAdded, setFrameAdded] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [gameModalOpen, setGameModalOpen] = useState(true); // Open game modal by default
  const [leaderboardModalOpen, setLeaderboardModalOpen] = useState(false);
  
  // Track the active game phase locally
  const [activeGamePhase, setActiveGamePhase] = useState<string>("team_selection");
  
  // Listen for game modal open/close to reset phase tracking
  useEffect(() => {
    if (!gameModalOpen) {
      setActiveGamePhase("team_selection");
    }
  }, [gameModalOpen]);
  
  // Listen for custom event to open leaderboard modal
  useEffect(() => {
    const handleOpenLeaderboardModal = () => {
      setLeaderboardModalOpen(true);
      setGameModalOpen(false);
    };
    
    window.addEventListener('openLeaderboardModal', handleOpenLeaderboardModal);
    
    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('openLeaderboardModal', handleOpenLeaderboardModal);
    };
  }, []);
  
  // Function to update the active game phase (will be passed to GameModal)
  const updateGamePhase = useCallback((phase: string) => {
    setActiveGamePhase(phase);
  }, []);

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
      {/* Game Modal */}
      <Modal
        isOpen={gameModalOpen}
        onClose={() => setGameModalOpen(false)}
      >
        <GameModal onPhaseChange={updateGamePhase} />
      </Modal>
      
      {/* Leaderboard Modal */}
      <Modal
        isOpen={leaderboardModalOpen}
        onClose={() => setLeaderboardModalOpen(false)}
      >
        <LeaderboardModal />
      </Modal>
      
      <div className="w-full max-w-md mx-auto px-4 py-3">
        <header className="flex justify-between items-center mb-3 h-11">
          <div>
            {activeTab === "home" && (
              <div className="flex items-center space-x-2">
                <Wallet className="z-10">
                  <ConnectWallet 
                    className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-full font-medium transition-colors duration-200"
                    disconnectedLabel="Connect Wallet"
                  >
                    <Avatar className="h-5 w-5 mr-2" />
                    <Name className="text-white" />
                  </ConnectWallet>
                  <WalletDropdown>
                    <Identity className="px-4 pt-3 pb-2 hover:bg-amber-50" hasCopyAddressOnClick>
                      <Avatar />
                      <Name />
                      <Address />
                      <EthBalance />
                    </Identity>
                    <WalletDropdownDisconnect className="hover:bg-amber-50 text-red-600" />
                  </WalletDropdown>
                </Wallet>
              </div>
            )}
          </div>
          <div>{saveFrameButton}</div>
        </header>

        <main className="flex-1">
          {activeTab === "home" && 
            <Home 
              setActiveTab={setActiveTab} 
              onOpenGame={() => setGameModalOpen(true)} 
              onOpenLeaderboard={() => setLeaderboardModalOpen(true)} 
            />}
          {activeTab === "features" && <Features setActiveTab={setActiveTab} />}
          {/* Removed redundant leaderboard and game tab content */}
        </main>

        <div className="pb-16"></div> {/* Spacer to prevent content from being hidden behind fixed nav */}
        
        <nav className={`fixed bottom-0 left-0 right-0 z-40 border-t-2 border-black bg-yellow-300 py-3 px-4 shadow-[0_-4px_6px_rgba(0,0,0,0.1)] ${gameModalOpen && activeGamePhase === "playing" ? 'hidden' : ''}`}>
          <div className="flex justify-around max-w-md mx-auto">
            <div 
              className={`flex flex-col items-center ${activeTab === "home" ? "scale-110" : ""}`}
              onClick={() => {
                setActiveTab("home");
                setGameModalOpen(false);
                setLeaderboardModalOpen(false);
              }}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 border-2 cursor-pointer ${activeTab === "home" ? "border-black bg-white" : "border-black/30 bg-cream-100"}`}>
                <span className="text-xl">🏚️</span>
              </div>
              <span className={`text-xs font-extrabold ${activeTab === "home" ? "text-black" : "text-black/60"}`}>Home</span>
            </div>
            <div 
              className={`flex flex-col items-center ${gameModalOpen ? "scale-110" : ""}`}
              onClick={() => {
                setGameModalOpen(true);
                setLeaderboardModalOpen(false);
              }}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 border-2 cursor-pointer ${gameModalOpen ? "border-black bg-white" : "border-black/30 bg-cream-100"}`}>
                <span className="text-xl">🍚</span>
              </div>
              <span className={`text-xs font-extrabold ${gameModalOpen ? "text-black" : "text-black/60"}`}>Game</span>
            </div>
            <div 
              className={`flex flex-col items-center ${leaderboardModalOpen ? "scale-110" : ""}`}
              onClick={() => {
                setLeaderboardModalOpen(true);
                setGameModalOpen(false);
              }}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 border-2 cursor-pointer ${leaderboardModalOpen ? "border-black bg-white" : "border-black/30 bg-cream-100"}`}>
                <span className="text-xl">🏆</span>
              </div>
              <span className={`text-xs font-extrabold ${leaderboardModalOpen ? "text-black" : "text-black/60"}`}>Ranks</span>
            </div>
            <div 
              className={`flex flex-col items-center ${activeTab === "features" ? "scale-110" : ""}`}
              onClick={() => {
                setActiveTab("features");
                setGameModalOpen(false);
                setLeaderboardModalOpen(false);
              }}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 border-2 cursor-pointer ${activeTab === "features" ? "border-black bg-white" : "border-black/30 bg-cream-100"}`}>
                <span className="text-xl">✨</span>
              </div>
              <span className={`text-xs font-extrabold ${activeTab === "features" ? "text-black" : "text-black/60"}`}>Features</span>
            </div>
          </div>
        </nav>
        
        {/* <footer className="mt-2 pt-4 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-amber-700 text-xs"
            onClick={() => openUrl("https://base.org/builders/minikit")}
          >
            Built on Base with MiniKit
          </Button>
        </footer> */}
      </div>
    </div>
  );
}

// We don't need the game/page.tsx and leaderboard/page.tsx files anymore, since we're using modals
