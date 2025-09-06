/**
 * ENS Integration Utilities
 * Functions for resolving ENS names and fetching avatars
 */
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { normalize } from 'viem/ens';

// Create a public client instance for Ethereum mainnet
export const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

/**
 * Resolves an Ethereum address to an ENS name if available
 * @param address Ethereum address to resolve
 * @returns ENS name or null if none exists
 */
export async function resolveEnsName(address: string): Promise<string | null> {
  if (!address || !address.startsWith('0x')) return null;
  
  try {
    const ensName = await publicClient.getEnsName({
      address: address as `0x${string}`,
    });
    return ensName;
  } catch (error) {
    console.error('Error resolving ENS name:', error);
    return null;
  }
}

/**
 * Resolves an ENS name to an Ethereum address
 * @param ensName ENS name to resolve (e.g., 'vitalik.eth')
 * @returns Ethereum address or null if resolution fails
 */
export async function resolveEnsAddress(ensName: string): Promise<string | null> {
  if (!ensName || !ensName.includes('.eth')) return null;
  
  try {
    const normalized = normalize(ensName);
    const address = await publicClient.getEnsAddress({
      name: normalized,
    });
    return address;
  } catch (error) {
    console.error('Error resolving ENS address:', error);
    return null;
  }
}

/**
 * Fetches ENS avatar for an address or ENS name
 * @param addressOrName Ethereum address or ENS name
 * @returns Avatar URL or null if none exists
 */
export async function getEnsAvatar(addressOrName: string): Promise<string | null> {
  try {
    // If input is an address, first get the ENS name
    let ensName = addressOrName;
    if (addressOrName.startsWith('0x')) {
      ensName = await resolveEnsName(addressOrName) || '';
      if (!ensName) return null;
    }
    
    // Now get the avatar
    const avatarUrl = await publicClient.getEnsAvatar({
      name: ensName,
    });
    
    return avatarUrl;
  } catch (error) {
    console.error('Error fetching ENS avatar:', error);
    return null;
  }
}

/**
 * Fetches additional ENS text records for a name
 * @param ensName ENS name to query
 * @param key Text record key (e.g., 'description', 'url', 'email', etc.)
 * @returns Text record value or null if none exists
 */
export async function getEnsTextRecord(ensName: string, key: string): Promise<string | null> {
  if (!ensName || !ensName.includes('.eth')) return null;
  
  try {
    const normalized = normalize(ensName);
    const record = await publicClient.getEnsText({
      name: normalized,
      key,
    });
    return record;
  } catch (error) {
    console.error(`Error fetching ENS text record (${key}):`, error);
    return null;
  }
}

/**
 * Custom hook for using ENS data
 * @param addressOrName Ethereum address or ENS name
 * @returns Object containing ENS name, address, avatar
 */
export function useEns(addressOrName: string | null | undefined) {
  const [ensData, setEnsData] = React.useState({
    name: null as string | null,
    address: null as string | null,
    avatar: null as string | null,
    loading: true,
  });

  React.useEffect(() => {
    async function fetchEnsData() {
      if (!addressOrName) {
        setEnsData({ name: null, address: null, avatar: null, loading: false });
        return;
      }

      try {
        setEnsData(prev => ({ ...prev, loading: true }));
        
        let name: string | null = null;
        let address: string | null = null;
        
        // Determine if input is address or name
        if (addressOrName.startsWith('0x')) {
          address = addressOrName;
          name = await resolveEnsName(address);
        } else if (addressOrName.includes('.eth')) {
          name = addressOrName;
          address = await resolveEnsAddress(name);
        }
        
        // Get avatar if we have a name
        const avatar = name ? await getEnsAvatar(name) : null;
        
        setEnsData({
          name,
          address,
          avatar,
          loading: false
        });
      } catch (error) {
        console.error('Error in useEns hook:', error);
        setEnsData({
          name: null,
          address: null,
          avatar: null,
          loading: false
        });
      }
    }
    
    fetchEnsData();
  }, [addressOrName]);
  
  return ensData;
}

// Need to import React for the hook
import React from 'react';
