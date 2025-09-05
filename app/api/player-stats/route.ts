import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

// Redis keys
const PLAYER_STATS_KEY = "jollof_wars:player_stats";

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
    
    // Get player stats from Redis
    const playerData = await redis.hgetall(`${PLAYER_STATS_KEY}:${playerId}`);
    
    if (!playerData || Object.keys(playerData).length === 0) {
      // Return default stats for new players
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
    
    // Save updated stats to Redis
    await redis.hset(`${PLAYER_STATS_KEY}:${playerId}`, updatedStats);
    
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
