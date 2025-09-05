import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { TeamType } from '@/lib/game/types';

// Redis keys
const LEADERBOARD_KEY = "jollof_wars:leaderboard";
const USER_SCORES_KEY = "jollof_wars:user_scores";

/**
 * Get user's best score using query param instead of path param
 * This avoids the type issues with dynamic routes in Next.js 15
 */
export async function GET(request: NextRequest) {
  // Get fid from query params
  const url = new URL(request.url);
  const fid = url.searchParams.get('fid');
  
  if (!fid) {
    return NextResponse.json(
      { error: 'Missing fid parameter' },
      { status: 400 }
    );
  }
  
  try {
    if (!redis) {
      return NextResponse.json(
        { error: 'Redis client not available' },
        { status: 503 }
      );
    }
    
    // Get the highest scoring entry for this user
    const userBestEntry = await redis.zrange(`${USER_SCORES_KEY}:${fid}`, 0, 0, {
      rev: true, // Get highest score
      withScores: true,
    });
    
    if (!userBestEntry || userBestEntry.length < 2) {
      return NextResponse.json(null);
    }
    
    const entryId = userBestEntry[0];
    
    // Get the full entry data
    const entryData = await redis.hgetall(`${LEADERBOARD_KEY}:${entryId}`);
    
    if (!entryData || Object.keys(entryData).length === 0) {
      return NextResponse.json(null);
    }
    
    // Format and return the entry
    const entry = {
      id: entryId as string,
      playerName: entryData.playerName as string,
      score: parseInt(entryData.score as string),
      team: entryData.team as TeamType,
      timestamp: parseInt(entryData.timestamp as string),
      combo: parseInt(entryData.combo as string),
      perfectActions: parseInt(entryData.perfectActions as string),
      accuracy: parseFloat(entryData.accuracy as string),
      fid: entryData.fid as string,
      isVerifiedUser: entryData.isVerifiedUser === 'true'
    };
    
    return NextResponse.json(entry);
  } catch (error) {
    console.error("Error getting user best score:", error);
    return NextResponse.json(
      { error: 'Failed to get user best score' },
      { status: 500 }
    );
  }
}
