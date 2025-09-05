import { Redis } from "@upstash/redis";

if (!process.env.REDIS_URL || !process.env.REDIS_TOKEN) {
  console.warn(
    "REDIS_URL or REDIS_TOKEN environment variable is not defined, please add to enable Redis functionality."
  );
}

export const redis =
  process.env.REDIS_URL && process.env.REDIS_TOKEN
    ? new Redis({
        url: process.env.REDIS_URL,
        token: process.env.REDIS_TOKEN,
      })
    : null;

/**
 * Validate Redis connection by pinging the server
 * @returns Promise resolving to boolean indicating if connection is valid
 */
export async function validateRedisConnection(): Promise<boolean> {
  if (!redis) return false;
  
  try {
    // Try to ping Redis server
    const result = await redis.ping();
    const isValid = result === 'PONG';
    console.info('Redis connection validation result:', isValid ? '✅ Connected' : '❌ Failed');
    return isValid;
  } catch (error) {
    console.error("Redis connection validation failed:", error);
    return false;
  }
}

/**
 * Check if Redis is available for use
 * This function can be used synchronously throughout the codebase
 */
export function isRedisAvailable(): boolean {
  // For client-side, never use Redis
  if (typeof window !== 'undefined') {
    return false;
  }
  
  // Return true if the client exists (no need for pre-validation)
  return redis !== null;
}

// Run a simple validation on startup to confirm connection
if (typeof window === 'undefined' && redis) {
  redis.ping().then(result => {
    const connected = result === 'PONG';
    if (!connected) {
      console.warn('⚠️ Redis ping failed');
    }
  }).catch(() => {
    console.warn('⚠️ Redis connection failed');
  });
}
