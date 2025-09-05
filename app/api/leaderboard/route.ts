import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { TeamType } from '@/lib/game/types';
import { cache, LEADERBOARD_CACHE_TTL, USER_CACHE_TTL } from '@/lib/cache';

// Redis keys - match exact format in the Redis database
const LEADERBOARD_KEY = "jollof_wars:leaderboard"; // Sorted set with score mapping
const LEADERBOARD_HASH_PREFIX = "jollof_wars:leaderboard:"; // Hash entries with details
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

    // Debug: log the LEADERBOARD_KEY
    console.log('Fetching from leaderboard key:', LEADERBOARD_KEY);
    
    // Get scores from Redis using ZREVRANGE to get all entries sorted by score (highest first)
    const scores = await redis.zrange(LEADERBOARD_KEY, 0, -1, {
      rev: true, // Get scores in descending order
      withScores: true, // Include the scores
    });
    
    // Debug: log the scores from zrange
    console.log('Scores from ZRANGE:', scores, 'Length:', scores.length);
    
    // Parse the entries
    const leaderboard: LeaderboardEntry[] = [];
    const entryIds: string[] = [];
    
    // First, gather all valid IDs from the scores
    console.log('Processing ZRANGE results to extract entry IDs');
    for (let i = 0; i < scores.length; i += 2) {
      // Redis can return values in different formats depending on client configuration
      // So convert whatever we get to a string
      const entryId = String(scores[i]);
      
      console.log(`Found ID at index ${i}: ${entryId}, type: ${typeof scores[i]}`);
      
      if (!entryId) {
        console.log(`Skipping empty ID at index ${i}`);
        continue;
      }
      
      // Score should be a number or convertible to a number
      const scoreValue = scores[i+1];
      if (isNaN(Number(scoreValue))) {
        console.log(`Skipping invalid score at index ${i+1}: ${scoreValue} (not convertible to number)`);
        continue;
      }
      
      // Use the string-converted ID, not the original value
      const score = Number(scoreValue);
      console.log(`Found valid entry ID: ${entryId} with score: ${score}`);
      entryIds.push(entryId);
    }
    
    console.log('Total valid entry IDs found:', entryIds.length);
    
    if (entryIds.length === 0) {
      return NextResponse.json([]);
    }
    
    // Use pipelining to fetch all entry data in bulk
    const pipeline = redis.pipeline();
    
    // Queue up all the hgetall commands
    console.log('Redis hash prefix being used:', LEADERBOARD_HASH_PREFIX);
    entryIds.forEach(id => {
      const fullKey = `${LEADERBOARD_HASH_PREFIX}${id}`;
      console.log(`Adding hgetall command for: ${fullKey}`);
      pipeline.hgetall(fullKey);
    });
    
    // Execute the pipeline
    const entryDataResults = await pipeline.exec();
    
    // Debug: log pipeline results
    console.log('Pipeline results count:', entryDataResults?.length);
    if (entryDataResults?.[0]) {
      console.log('First pipeline result:', entryDataResults[0]);
    }
    
    // Process the results and build the leaderboard
    for (let i = 0; i < entryIds.length; i++) {
      const id = entryIds[i];
      const scoreIndex = scores.findIndex(s => s === id) + 1;
      const score = scoreIndex >= 0 ? parseFloat(String(scores[scoreIndex])) : 0;
      
      // Get the entry data from pipeline results
      // Pipeline results are [err, result] tuples
      console.log(`Processing pipeline result for entry ${id} (index ${i})`);
      
      // IORedis pipeline.exec() returns an array of [Error | null, Result] tuples
      // Check if the result is available and handle various formats that it might come in
      if (!entryDataResults || !entryDataResults[i]) {
        console.log(`No pipeline result at index ${i} for ID ${id}`);
        continue;
      }
      
      let entryData: Record<string, unknown>;
      const pipelineResult = entryDataResults[i];
      
      console.log(`Pipeline result type for ${id}:`, typeof pipelineResult, 'isArray:', Array.isArray(pipelineResult));
      
      // Handle array format [err, result]
      if (Array.isArray(pipelineResult) && pipelineResult.length >= 2) {
        if (pipelineResult[0]) {
          console.log(`Error in pipeline result at index ${i} for ID ${id}:`, pipelineResult[0]);
          continue;
        }
        entryData = pipelineResult[1] as Record<string, unknown>;
      } 
      // Handle direct result object (depends on Redis client behavior)
      else if (typeof pipelineResult === 'object' && pipelineResult !== null) {
        entryData = pipelineResult as Record<string, unknown>;
      }
      // If neither format matches, skip this entry
      else {
        console.log(`Unrecognized pipeline result format at index ${i} for ID ${id}:`, pipelineResult);
        continue;
      }
      console.log(`Entry data for ${id}:`, entryData);
      
      if (!entryData || typeof entryData !== 'object') {
        console.log(`Invalid entry data for ${id}: not an object`);
        continue;
      }
      
      if (Object.keys(entryData).length === 0) {
        console.log(`Empty entry data object for ${id}`);
        continue;
      }
      
      console.log(`Valid entry data found for ${id} with ${Object.keys(entryData).length} properties`);
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
    
    // Debug: log the final leaderboard array
    console.log('Final leaderboard entries:', leaderboard.length);
    
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
    
    // Store the full entry data as a hash using the correct prefix format
    pipeline.hset(`${LEADERBOARD_HASH_PREFIX}${id}`, entry);
    
    // If we have a Farcaster ID, add to user-specific scores
    if (body.fid) {
      pipeline.zadd(`${USER_SCORES_KEY}:${body.fid}`, {
        score: body.score,
        member: id
      });
    }
    
    // Execute all commands with error checking
    const execResults = await pipeline.exec();
    console.log('Score submission pipeline results:', execResults?.length);
    
    // Log some key details for debugging
    console.log('Added entry with ID:', id, 'team:', body.team, 'score:', body.score);
    console.log('Using key format:', LEADERBOARD_HASH_PREFIX + id);
    
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
