import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

// Redis keys
const PLAYER_STATS_KEY = "jollof_wars:player_stats";
const LEADERBOARD_KEY = "jollof_wars:leaderboard";
const LEADERBOARD_HASH_PREFIX = "jollof_wars:leaderboard:";
const USER_SCORES_KEY = "jollof_wars:user_scores";

interface PlayerStats {
  totalScore: number;
  highScore: number;
  gamesPlayed: number;
  lastGameDate: string;
}

/**
 * Get player stats by wallet address or FID
 */
export async function GET(request: NextRequest) {
  try {
    // Get player ID from query params (can be wallet address or FID)
    const playerId = request.nextUrl.searchParams.get('playerId');
    
    if (!playerId) {
      return NextResponse.json(
        { error: 'Missing playerId parameter' },
        { status: 400 }
      );
    }
    
    if (!redis) {
      return NextResponse.json(
        { error: 'Redis client not available' },
        { status: 503 }
      );
    }
    
    // First try to get player stats from Redis
    const playerData = await redis.hgetall(`${PLAYER_STATS_KEY}:${playerId}`);
    
    if (!playerData || Object.keys(playerData).length === 0) {
      // If no stats found, check if this player has leaderboard entries
      console.log(`No player stats found for ${playerId}, checking leaderboard data...`);
      
      try {
        // For Farcaster users, we can check their specific scores
        if (playerId.match(/^\d+$/)) {
          // This looks like a numeric FID, so check user-specific scores
          const userScores = await redis.zrange(`${USER_SCORES_KEY}:${playerId}`, 0, -1, {
            rev: true,
            withScores: true
          });
          
          if (userScores && userScores.length > 0) {
            console.log(`Found ${userScores.length / 2} scores for Farcaster user ${playerId}`);
            
            // Process scores
            const stats = await processLeaderboardEntries(userScores, playerId);
            return NextResponse.json(stats);
          }
        } else {
          // For wallet addresses or usernames, we need to scan through all entries
          // Get all leaderboard entries
          const allEntries = await redis.zrange(LEADERBOARD_KEY, 0, -1);
          console.log(`Checking ${allEntries.length} leaderboard entries for player ${playerId}`);
          
          // This is a wallet address or username, so we need to check each entry
          const matchingEntries = [];
          
          for (const entryId of allEntries) {
            const entry = await redis.hgetall(`${LEADERBOARD_HASH_PREFIX}${entryId}`);
            
            if (entry && typeof entry.playerName === 'string' && (
                entry.playerName === playerId || 
                (playerId.length >= 4 && entry.playerName.includes(playerId.slice(-4)))
              )) {
              console.log(`Found matching entry ${entryId} for player ${playerId}`);
              // Make sure score is properly converted to string
              const score = typeof entry.score === 'number' ? entry.score.toString() : entry.score as string;
              matchingEntries.push([entryId, score]);
            }
          }
          
          if (matchingEntries.length > 0) {
            console.log(`Found ${matchingEntries.length} matching entries for player ${playerId}`);
            const stats = await processLeaderboardEntries(matchingEntries.flat(), playerId);
            return NextResponse.json(stats);
          }
        }
      } catch (error) {
        console.error(`Error checking leaderboard data for ${playerId}:`, error);
      }
      
      // If still no data found, return default stats
      return NextResponse.json({
        totalScore: 0,
        highScore: 0,
        gamesPlayed: 0,
        lastGameDate: new Date().toISOString()
      });
    }
    
    // Format and return the stats
    const stats: PlayerStats = {
      totalScore: parseInt(playerData.totalScore as string) || 0,
      highScore: parseInt(playerData.highScore as string) || 0,
      gamesPlayed: parseInt(playerData.gamesPlayed as string) || 0,
      lastGameDate: playerData.lastGameDate as string || new Date().toISOString()
    };
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error getting player stats:", error);
    return NextResponse.json(
      { error: 'Failed to get player stats' },
      { status: 500 }
    );
  }
}

/**
 * Update player stats with a new score
 */
/**
 * Process leaderboard entries to calculate player stats
 */
async function processLeaderboardEntries(entries: any[], playerId: string): Promise<PlayerStats> {
  // Initialize stats
  const stats: PlayerStats = {
    totalScore: 0,
    highScore: 0,
    gamesPlayed: 0,
    lastGameDate: new Date().toISOString()
  };
  
  // Process each entry
  for (let i = 0; i < entries.length; i += 2) {
    const entryId = entries[i];
    const score = parseInt(entries[i + 1] as string);
    
    // Update stats
    stats.totalScore += score;
    stats.highScore = Math.max(stats.highScore, score);
    stats.gamesPlayed += 1;
    
    // Get the timestamp from the entry
    try {
      if (!redis) {
        console.error('Redis client not available');
        continue;
      }
      const entryData = await redis.hgetall(`${LEADERBOARD_HASH_PREFIX}${entryId}`);
      if (entryData && entryData.timestamp) {
        const timestamp = parseInt(entryData.timestamp as string);
        if (timestamp > new Date(stats.lastGameDate).getTime()) {
          stats.lastGameDate = new Date(timestamp).toISOString();
        }
      }
    } catch (error) {
      console.error(`Error getting timestamp for entry ${entryId}:`, error);
    }
  }
  
  // Save the calculated stats for future use
  try {
    if (!redis) {
      console.error('Redis client not available');
      return stats;
    }
    // Convert PlayerStats to Record<string, unknown> for Redis
    const statsRecord: Record<string, unknown> = {
      totalScore: stats.totalScore,
      highScore: stats.highScore,
      gamesPlayed: stats.gamesPlayed,
      lastGameDate: stats.lastGameDate
    };
    await redis.hset(`${PLAYER_STATS_KEY}:${playerId}`, statsRecord);
    console.log(`Saved calculated stats for player ${playerId}:`, stats);
  } catch (error) {
    console.error(`Error saving calculated stats for player ${playerId}:`, error);
  }
  
  return stats;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.playerId || body.score === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields (playerId, score)' },
        { status: 400 }
      );
    }
    
    if (!redis) {
      return NextResponse.json(
        { error: 'Redis client not available' },
        { status: 503 }
      );
    }
    
    const { playerId, score } = body;
    
    // Get current player stats
    const currentStats = await redis.hgetall(`${PLAYER_STATS_KEY}:${playerId}`);
    
    // Prepare updated stats - handle null/empty objects from Redis
    const currentTotalScore = currentStats && currentStats.totalScore ? parseInt(currentStats.totalScore as string) : 0;
    const currentHighScore = currentStats && currentStats.highScore ? parseInt(currentStats.highScore as string) : 0;
    const currentGamesPlayed = currentStats && currentStats.gamesPlayed ? parseInt(currentStats.gamesPlayed as string) : 0;
    
    const updatedStats = {
      totalScore: currentTotalScore + score,
      highScore: Math.max(currentHighScore, score),
      gamesPlayed: currentGamesPlayed + 1,
      lastGameDate: new Date().toISOString()
    };
    
    // Save updated stats to Redis - convert to Record<string, unknown>
    const statsRecord: Record<string, unknown> = {
      totalScore: updatedStats.totalScore,
      highScore: updatedStats.highScore,
      gamesPlayed: updatedStats.gamesPlayed,
      lastGameDate: updatedStats.lastGameDate
    };
    await redis.hset(`${PLAYER_STATS_KEY}:${playerId}`, statsRecord);
    
    console.log(`Updated stats for player ${playerId}:`, updatedStats);
    
    return NextResponse.json(updatedStats);
  } catch (error) {
    console.error("Error updating player stats:", error);
    return NextResponse.json(
      { error: 'Failed to update player stats' },
      { status: 500 }
    );
  }
}
