"use client";

import { useAccount, useEnsAvatar, useEnsName } from 'wagmi';
import Image from 'next/image';

interface ENSProfileProps {
  address?: string;
  showAddress?: boolean;
  className?: string;
}

export const ENSProfile = ({ address, showAddress = true, className = "" }: ENSProfileProps) => {
  // Use current connected account if no address is provided
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;
  
  // Use wagmi hooks to get ENS name and avatar
  const { data: ensName } = useEnsName({ address: targetAddress as `0x${string}`, chainId: 1 });
  // Ensure name is string | undefined (not null)
  const name = ensName || undefined;
  // Ensure we pass string | undefined (not null) to the useEnsAvatar hook
  const { data: ensAvatar } = useEnsAvatar({ name, chainId: 1 });
  // Ensure avatar is string | undefined (not null)
  const avatar = ensAvatar || undefined;
  
  // Format address for display
  const displayAddress = targetAddress ? 
    `${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)}` : 
    '';
    
  if (!targetAddress) {
    return null;
  }
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {avatar ? (
        <div className="h-8 w-8 rounded-full overflow-hidden">
          <Image 
            src={avatar} 
            alt={name || 'ENS Avatar'} 
            width={32} 
            height={32} 
            className="object-cover"
          />
        </div>
      ) : (
        <div className="h-8 w-8 rounded-full bg-amber-200 flex items-center justify-center text-xs">
          {name?.slice(0, 1) || targetAddress.slice(2, 4).toUpperCase()}
        </div>
      )}
      
      <div className="flex flex-col leading-none">
        {name && <span className="font-semibold">{name}</span>}
        {showAddress && <span className="text-gray-500 text-xs">{displayAddress}</span>}
      </div>
    </div>
  );
};
