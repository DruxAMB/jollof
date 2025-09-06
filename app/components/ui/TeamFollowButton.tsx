"use client";

import { useState } from 'react';
import { Button } from './Button';
import { useAccount } from 'wagmi';
import { getTeamAddress } from '@/lib/efp';

interface TeamFollowButtonProps {
  team: 'ghana' | 'nigeria';
  className?: string;
}

export const TeamFollowButton = ({ team, className }: TeamFollowButtonProps) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { address, isConnected } = useAccount();
  
  const teamAddress = getTeamAddress(team);
  const teamName = team === 'ghana' ? 'Ghana 🇬🇭' : 'Nigeria 🇳🇬';
  
  // Toggle follow status
  const toggleFollow = async () => {
    if (!isConnected || !address) {
      // Prompt user to connect wallet
      alert('Please connect your wallet to follow this team');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // In a real implementation, this would call the EFP contract
      // For demo purposes, we'll just toggle the state
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setIsFollowing(!isFollowing);
      
      // Display success message
      if (!isFollowing) {
        // User is now following
        console.log(`Now following Team ${teamName}`);
      } else {
        // User unfollowed
        console.log(`Unfollowed Team ${teamName}`);
      }
    } catch (error) {
      console.error('Error toggling follow status:', error);
      alert('Failed to update follow status');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className={`flex flex-col ${className}`}>
      <Button
        variant={isFollowing ? "outline" : "primary"}
        onClick={toggleFollow}
        disabled={isLoading}
        className={`${team === 'ghana' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'} ${isFollowing ? 'border-2' : ''}`}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full border-2 border-t-transparent animate-spin"></div>
            <span>Processing...</span>
          </div>
        ) : isFollowing ? (
          <div className="flex items-center gap-2">
            <span>✓</span>
            <span>Following</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span>+</span>
            <span>Follow Team {teamName}</span>
          </div>
        )}
      </Button>
      <p className="text-xs text-gray-500 mt-1 text-center">
        {isFollowing 
          ? `You're following Team ${teamName}` 
          : `Follow Team ${teamName} to show your support`
        }
      </p>
    </div>
  );
};
