import { NextResponse } from 'next/server';
import { redis, validateRedisConnection } from '@/lib/redis';

export async function GET() {
  try {
    // Check if Redis client exists
    const hasRedisClient = !!redis;
    
    // Try to validate the connection
    const isConnected = await validateRedisConnection();
    
    // Get Redis environment variable status
    const hasRedisUrl = !!process.env.REDIS_URL;
    const hasRedisToken = !!process.env.REDIS_TOKEN;
    
    // Return the status
    return NextResponse.json({
      status: isConnected ? 'connected' : 'disconnected',
      details: {
        clientInitialized: hasRedisClient,
        environmentVariables: {
          REDIS_URL: hasRedisUrl ? 'set' : 'missing',
          REDIS_TOKEN: hasRedisToken ? 'set' : 'missing'
        },
        connectionValid: isConnected
      }
    });
  } catch (error) {
    // Return error information
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
