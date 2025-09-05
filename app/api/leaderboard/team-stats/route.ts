import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

/**
 * Get team statistics API route
 */
export async function GET(request: NextRequest) {
  try {
    if (!redis) {
      return NextResponse.json(
        { error: 'Redis client not available' },
        { status: 503 }
      );
    }
    
    // Get team stats from Redis
    const ghanaScore = await redis.get('jollof_wars:team_score:ghana') || '0';
    const nigeriaScore = await redis.get('jollof_wars:team_score:nigeria') || '0';
    
    return NextResponse.json({
      ghana: parseInt(ghanaScore as string),
      nigeria: parseInt(nigeriaScore as string)
    });
  } catch (error) {
    console.error("Error getting team stats:", error);
    return NextResponse.json(
      { error: 'Failed to get team stats' },
      { status: 500 }
    );
  }
}
