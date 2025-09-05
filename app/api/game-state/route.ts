import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
// Redis key constants
const GAME_STATE_KEY = 'jollof_wars:game_state';
const USER_STATE_KEY = 'jollof_wars:user_state';

/**
 * API handler for loading game state
 */
export async function GET(request: NextRequest) {
  try {
    // Get user ID from query params
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    if (!redis) {
      return NextResponse.json(
        { error: 'Redis client not available' },
        { status: 503 }
      );
    }
    
    // Try to get user-specific state if userId provided
    let savedState: Record<string, string | number | boolean> | null = null;
    
    if (userId) {
      const userStateKey = `${USER_STATE_KEY}:${userId}`;
      savedState = await redis.hgetall(userStateKey);
    }
    
    // If no user state found or no userId provided, try the general state
    if (!savedState || Object.keys(savedState).length === 0) {
      savedState = await redis.hgetall(GAME_STATE_KEY);
    }
    
    // Parse player stats if available
    if (savedState?.playerStats && typeof savedState.playerStats === 'string') {
      try {
        savedState.playerStats = JSON.parse(savedState.playerStats);
      } catch (e) {
        console.error('Failed to parse playerStats:', e);
      }
    }
    
    // Convert tutorialComplete to boolean
    if (savedState?.tutorialComplete) {
      savedState.tutorialComplete = savedState.tutorialComplete === 'true';
    }

    return NextResponse.json(savedState || {});
  } catch (error) {
    console.error('Error loading game state:', error);
    return NextResponse.json(
      { error: 'Failed to load game state' },
      { status: 500 }
    );
  }
}

/**
 * API handler for saving game state
 */
export async function POST(request: NextRequest) {
  try {
    // Check Content-Type header to ensure it's JSON
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }
    
    // Try to parse the request body with better error handling
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error('JSON parse error:', jsonError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    // Validate the parsed body
    const { state, userId } = body || {};
    
    // Ensure state exists
    if (!state) {
      return NextResponse.json(
        { error: 'Missing state in request body' },
        { status: 400 }
      );
    }
    
    if (!redis) {
      return NextResponse.json(
        { error: 'Redis client not available' },
        { status: 503 }
      );
    }
    
    // Prepare the data to save
    const dataToSave = {
      team: state.team || '',  // Ensure team is a string, never null
      playerStats: JSON.stringify(state.playerStats),
      tutorialComplete: state.tutorialComplete ? 'true' : 'false',
    };
    
    // If we have a userId, save to user-specific state
    if (userId) {
      const userStateKey = `${USER_STATE_KEY}:${userId}`;
      await redis.hset(userStateKey, dataToSave);
      
      // Set TTL for user-specific data (30 days)
      await redis.expire(userStateKey, 60 * 60 * 24 * 30);
    } else {
      // Otherwise, save to general game state
      await redis.hset(GAME_STATE_KEY, dataToSave);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving game state:', error);
    return NextResponse.json(
      { error: 'Failed to save game state' },
      { status: 500 }
    );
  }
}

/**
 * API handler for clearing game state
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get user ID from query params
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    if (!redis) {
      return NextResponse.json(
        { error: 'Redis client not available' },
        { status: 503 }
      );
    }
    
    if (userId) {
      // Clear user-specific state
      await redis.del(`${USER_STATE_KEY}:${userId}`);
    } else {
      // Clear general game state
      await redis.del(GAME_STATE_KEY);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing game state:', error);
    return NextResponse.json(
      { error: 'Failed to clear game state' },
      { status: 500 }
    );
  }
}
