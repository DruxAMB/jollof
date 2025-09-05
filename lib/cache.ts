/**
 * Simple in-memory cache implementation
 * Used to cache frequently accessed data and reduce Redis calls
 */

interface CacheItem<T> {
  value: T;
  expiry: number;
}

/**
 * In-memory cache for frequently accessed data
 */
class MemoryCache {
  private cache: Map<string, CacheItem<any>>;
  private defaultTTL: number; // TTL in milliseconds

  constructor(defaultTTL = 60000) { // Default 1 minute TTL
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * Get an item from the cache
   * @param key Cache key
   * @returns The cached value or null if not found or expired
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    // Return null if item doesn't exist or has expired
    if (!item || Date.now() > item.expiry) {
      if (item) this.cache.delete(key); // Clean up expired item
      return null;
    }
    
    return item.value as T;
  }

  /**
   * Set an item in the cache
   * @param key Cache key
   * @param value Value to store
   * @param ttl Time-to-live in milliseconds (optional, uses default if not provided)
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expiry });
  }

  /**
   * Delete an item from the cache
   * @param key Cache key to delete
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get an item from the cache or compute it if not present
   * @param key Cache key
   * @param fn Function to compute the value if not in cache
   * @param ttl Time-to-live in milliseconds (optional)
   * @returns The cached or computed value
   */
  async getOrCompute<T>(
    key: string, 
    fn: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cachedValue = this.get<T>(key);
    if (cachedValue !== null) return cachedValue;
    
    // Not in cache, compute the value
    const value = await fn();
    
    // Store in cache
    this.set(key, value, ttl);
    
    return value;
  }
}

// Export singleton instance
export const cache = new MemoryCache();

// For leaderboard data, use a longer TTL (5 minutes)
export const LEADERBOARD_CACHE_TTL = 5 * 60 * 1000; 

// For user data, use a shorter TTL (1 minute)
export const USER_CACHE_TTL = 60 * 1000;
