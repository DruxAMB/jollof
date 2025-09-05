import { Redis } from "@upstash/redis";

// Configuration options for Redis
interface RedisConfig {
  url: string;
  token: string;
  connectionTimeout?: number; // in ms
  maxRetries?: number;
}

// Default configuration with reasonable values
const DEFAULT_CONFIG: Partial<RedisConfig> = {
  connectionTimeout: 5000,  // 5 second connection timeout
  maxRetries: 3,            // Retry failed connections up to 3 times
};

/**
 * Create and validate Redis client
 */
function createRedisClient(): Redis | null {
  if (!process.env.REDIS_URL || !process.env.REDIS_TOKEN) {
    console.warn(
      "REDIS_URL or REDIS_TOKEN environment variable is not defined. Redis functionality will be disabled."
    );
    return null;
  }
  
  try {
    // Create Redis client with configuration
    const config: RedisConfig = {
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN,
      ...DEFAULT_CONFIG
    };
    
    return new Redis(config);
  } catch (error) {
    console.error("Failed to initialize Redis client:", error);
    return null;
  }
}

// Export Redis client instance
export const redis = createRedisClient();

/**
 * Validate Redis connection by pinging the server
 * @returns Promise resolving to boolean indicating if connection is valid
 */
export async function validateRedisConnection(): Promise<boolean> {
  if (!redis) return false;
  
  try {
    // Try to ping Redis server
    const result = await redis.ping();
    return result === 'PONG';
  } catch (error) {
    console.error("Redis connection validation failed:", error);
    return false;
  }
}
