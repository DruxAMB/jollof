"use client";

import { useAccount } from 'wagmi';
import { useTeamFollowerCount } from '@/lib/efp';
import { FollowButton } from 'ethereum-identity-kit';
import { getTeamAddress } from '@/lib/efp';

interface TeamFollowButtonProps {
  team: 'ghana' | 'nigeria';
  className?: string;
}

export const TeamFollowButton = ({ team, className }: TeamFollowButtonProps) => {
  const { address } = useAccount();
  const teamName = team === 'ghana' ? 'Ghana 🇬🇭' : 'Nigeria 🇳🇬';
  const teamAddress = getTeamAddress(team);
  
  // Get follower count
  const { count: followerCount, isLoading: isCountLoading } = useTeamFollowerCount(team);
  
  return (
    <div className={`flex flex-col ${className}`}>
      <div className={`${team === 'ghana' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'} rounded-md p-1`}>
        <FollowButton 
          lookupAddress={teamAddress}
        //   size="lg"
        //   variant="solid"
          className="w-full"
        //   loadingLabel="Processing..."
        //   followingLabel={`Following ${teamName}`}
        //   unfollowingLabel={`Unfollow ${teamName}`}
        //   followLabel={`Follow Team ${teamName}`}
        />
      </div>
      <div className="text-xs text-center mt-2">
        <p className="text-gray-500">
          {`Support Team ${teamName}`}
        </p>
        {!isCountLoading && (
          <p className="font-medium mt-1">
            <span className="text-amber-600 font-bold">{followerCount}</span> followers
          </p>
        )}
      </div>
    </div>
  );
};
