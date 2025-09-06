/**
 * Ethereum Follow Protocol (EFP) Integration Utilities
 * Functions for following and checking follow relationships between addresses
 */
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

// EFP Contract address on mainnet
const EFP_CONTRACT_ADDRESS = '0x843829986ca58d4ef1afe94fabaf2657b937c60b';

// ABI for the EFP contract's relevant methods
const EFP_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "follower", "type": "address"},{"internalType": "address", "name": "followee", "type": "address"}],
    "name": "isFollowing",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "followee", "type": "address"}],
    "name": "follow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "followee", "type": "address"}],
    "name": "unfollow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "getFollowerCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "getFollowingCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// Create a public client instance for Ethereum mainnet
export const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

/**
 * Check if one address is following another
 * @param follower Address that might be following
 * @param followee Address that might be followed
 * @returns Boolean indicating if follow relationship exists
 */
export async function isFollowing(follower: string, followee: string): Promise<boolean> {
  try {
    const result = await publicClient.readContract({
      address: EFP_CONTRACT_ADDRESS as `0x${string}`,
      abi: EFP_ABI,
      functionName: 'isFollowing',
      args: [follower, followee]
    });
    
    return result as boolean;
  } catch (error) {
    console.error('Error checking follow status:', error);
    return false;
  }
}

/**
 * Get follower count for an address
 * @param address Address to check followers for
 * @returns Number of followers
 */
export async function getFollowerCount(address: string): Promise<number> {
  try {
    const result = await publicClient.readContract({
      address: EFP_CONTRACT_ADDRESS as `0x${string}`,
      abi: EFP_ABI,
      functionName: 'getFollowerCount',
      args: [address]
    });
    
    return Number(result);
  } catch (error) {
    console.error('Error getting follower count:', error);
    return 0;
  }
}

/**
 * Get following count for an address
 * @param address Address to check following count for
 * @returns Number of accounts being followed
 */
export async function getFollowingCount(address: string): Promise<number> {
  try {
    const result = await publicClient.readContract({
      address: EFP_CONTRACT_ADDRESS as `0x${string}`,
      abi: EFP_ABI,
      functionName: 'getFollowingCount',
      args: [address]
    });
    
    return Number(result);
  } catch (error) {
    console.error('Error getting following count:', error);
    return 0;
  }
}

/**
 * Hook for checking if current user follows a specific address
 * @param currentUserAddress Current user's address
 * @param targetAddress Address to check if following
 * @returns Loading state and follow status
 */
export function useFollowStatus(currentUserAddress: string | undefined, targetAddress: string) {
  const [followStatus, setFollowStatus] = React.useState({
    isFollowing: false,
    loading: true
  });

  React.useEffect(() => {
    async function checkFollowStatus() {
      if (!currentUserAddress || !targetAddress) {
        setFollowStatus({ isFollowing: false, loading: false });
        return;
      }

      try {
        const follows = await isFollowing(currentUserAddress, targetAddress);
        setFollowStatus({
          isFollowing: follows,
          loading: false
        });
      } catch (error) {
        console.error('Error in useFollowStatus hook:', error);
        setFollowStatus({
          isFollowing: false,
          loading: false
        });
      }
    }
    
    checkFollowStatus();
  }, [currentUserAddress, targetAddress]);
  
  return followStatus;
}

/**
 * Convert addresses to team addresses for team following
 * @param team Team identifier
 * @returns Representative address for the team
 */
export function getTeamAddress(team: 'ghana' | 'nigeria'): string {
  // Deterministic addresses derived from team names
  // These would be controlled by the game administrators in a real implementation
  const teamAddresses = {
    ghana: '0xGHANAJollofTeam00000000000000000000000000',
    nigeria: '0xNIGERIAJollofTeam000000000000000000000000'
  };
  
  return teamAddresses[team];
}

// Need to import React for hooks
import React from 'react';
