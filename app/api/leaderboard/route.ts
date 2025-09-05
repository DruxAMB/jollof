import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { TeamType } from '@/lib/game/types';
import { cache, LEADERBOARD_CACHE_TTL, USER_CACHE_TTL } from '@/lib/cache';

// Redis keys
const LEADERBOARD_KEY = "jollof_wars:leaderboard";
const USER_SCORES_KEY = "jollof_wars:user_scores";

// Leaderboard entry type definition
interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  team: TeamType;
  timestamp: number;
  combo: number;
  perfectActions: number;
  accuracy: number;
  fid?: string; // Farcaster user ID if available
  isVerifiedUser?: boolean; // Whether the user was authenticated via Farcaster
}

/**
 * Fetch leaderboard data
 */
export async function GET(request: NextRequest) {
  try {
    if (!redis) {
      return NextResponse.json(
        { error: 'Redis client not available' },
        { status: 503 }
      );
    }

    // Get scores from Redis using ZREVRANGE to get all entries sorted by score (highest first)
    const scores = await redis.zrange(LEADERBOARD_KEY, 0, -1, {
      rev: true, // Get scores in descending order
      withScores: true, // Include the scores
    });

    // Parse the entries
    const leaderboard: LeaderboardEntry[] = [];
    const entryIds: string[] = [];
    
    // First, gather all valid IDs from the scores
    for (let i = 0; i < scores.length; i += 2) {
      // Ensure we have valid string values
      if (typeof scores[i] !== 'string') continue;
      if (typeof scores[i+1] !== 'string' && typeof scores[i+1] !== 'number') continue;
      
      entryIds.push(scores[i] as string);
    }
    
    if (entryIds.length === 0) {
      return NextResponse.json([]);
    }
    
    // Use pipelining to fetch all entry data in bulk
    const pipeline = redis.pipeline();
    
    // Queue up all the hgetall commands
    entryIds.forEach(id => {
      pipeline.hgetall(`${LEADERBOARD_KEY}:${id}`);
    });
    
    // Execute the pipeline
    const entryDataResults = await pipeline.exec();
    
    // Process the results and build the leaderboard
    for (let i = 0; i < entryIds.length; i++) {
      const id = entryIds[i];
      const scoreIndex = scores.findIndex(s => s === id) + 1;
      const score = scoreIndex >= 0 ? parseFloat(String(scores[scoreIndex])) : 0;
      
      // Get the entry data from pipeline results
      // Pipeline results are [err, result] tuples
      const pipelineResult = entryDataResults[i] as [Error | null, Record<string, unknown>];
      
      // Skip if there's an error or no data
      if (!pipelineResult || pipelineResult[0]) continue;
      
      // Extract the actual data (second element in the tuple)
      const entryData = pipelineResult[1] as Record<string, unknown>;
      
      if (entryData && typeof entryData === 'object' && Object.keys(entryData).length > 0) {
        leaderboard.push({
          id,
          playerName: entryData.playerName as string,
          score: parseInt(entryData.score as string),
          team: entryData.team as TeamType,
          timestamp: parseInt(entryData.timestamp as string),
          combo: parseInt(entryData.combo as string),
          perfectActions: parseInt(entryData.perfectActions as string),
          accuracy: parseFloat(entryData.accuracy as string),
          fid: typeof entryData.fid === 'string' ? entryData.fid : undefined,
          isVerifiedUser: entryData.isVerifiedUser === 'true'
        });
      }
    }
    
    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard from Redis:", error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

/**
 * Submit a new score to the leaderboard
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.playerName || body.score === undefined || !body.team) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    if (!redis) {
      return NextResponse.json(
        { error: 'Redis client not available' },
        { status: 503 }
      );
    }
    
    // Generate a unique ID for the leaderboard entry
    const id = Date.now().toString();
    const timestamp = Date.now();
    
    // Create the entry with timestamp and ID
    const entry = {
      id,
      playerName: body.playerName,
      score: body.score,
      team: body.team,
      timestamp,
      combo: body.combo || 0,
      perfectActions: body.perfectActions || 0,
      accuracy: body.accuracy || 0,
      fid: body.fid,
      isVerifiedUser: body.isVerifiedUser ? 'true' : 'false'
    };
    
    // Use a transaction to ensure data consistency
    const pipeline = redis.pipeline();
    
    // Add to sorted set with score as the sort key
    pipeline.zadd(LEADERBOARD_KEY, {
      score: body.score,
      member: id
    });
    
    // Store the full entry data as a hash
    pipeline.hset(`${LEADERBOARD_KEY}:${id}`, entry);
    
    // If we have a Farcaster ID, add to user-specific scores
    if (body.fid) {
      pipeline.zadd(`${USER_SCORES_KEY}:${body.fid}`, {
        score: body.score,
        member: id
      });
    }
    
    // Execute all commands
    await pipeline.exec();
    
    // Invalidate leaderboard cache
    cache.delete('leaderboard');
    
    // Add to team statistics
    await updateTeamStats(body.team, body.score);
    
    return NextResponse.json(entry);
  } catch (error) {
    console.error("Error submitting score to leaderboard:", error);
    return NextResponse.json(
      { error: 'Failed to submit score' },
      { status: 500 }
    );
  }
}

// User best score functionality moved to app/api/leaderboard/user/[fid]/route.ts

// Team statistics functionality moved to app/api/leaderboard/team-stats/route.ts

/**
 * Helper function to update team statistics
 */
async function updateTeamStats(team: TeamType, score: number): Promise<void> {
  if (!redis) return;
  
  try {
    // Increment the team's total score
    await redis.incrby(`jollof_wars:team_score:${team}`, score);
  } catch (error) {
    console.error(`Failed to update team stats for ${team}:`, error);
  }
}
