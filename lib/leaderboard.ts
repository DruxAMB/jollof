import { TeamType } from "./game/types";
import { redis } from "./redis";
import { cache, LEADERBOARD_CACHE_TTL, USER_CACHE_TTL } from "./cache";

// Leaderboard entry type definition
export interface LeaderboardEntry {
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

// Redis keys
const LEADERBOARD_KEY = "jollof_wars:leaderboard";
const USER_SCORES_KEY = "jollof_wars:user_scores";

// Helper function to check if Redis is available
function isRedisAvailable(): boolean {
  return redis !== null;
}

/**
 * Fetch the current leaderboard data
 */
export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  // Try to get from cache first
  const cachedLeaderboard = cache.get<LeaderboardEntry[]>('leaderboard');
  if (cachedLeaderboard) {
    return cachedLeaderboard;
  }
  
  try {
    // Check if Redis is available
    if (!isRedisAvailable() || !redis) {
      console.error("Redis is not available for fetching leaderboard");
      return [];
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
      return []; // No valid entries
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
    
    console.log('Fetched leaderboard from Redis:', leaderboard);
    
    // Cache the results before returning
    cache.set('leaderboard', leaderboard, LEADERBOARD_CACHE_TTL);
    
    return leaderboard;
  } catch (error) {
    console.error("Error fetching leaderboard from Redis:", error);
    return [];
  }
}

/**
 * Submit a new score to the leaderboard
 * @param entry The leaderboard entry to add
 */
export async function submitScore(entry: Omit<LeaderboardEntry, "id" | "timestamp">): Promise<LeaderboardEntry> {
  try {
    console.log('submitScore received entry:', entry);
    if (entry.score === 0) {
      console.warn('WARNING: Received a zero score submission');
    }
    
    // Check if Redis is available
    if (!isRedisAvailable() || !redis) {
      throw new Error("Redis is not available for submitting scores");
    }

    // Create a new entry with ID and timestamp
    const newEntry: LeaderboardEntry = {
      ...entry,
      id: Date.now().toString(),
      timestamp: Date.now()
    };
    
    console.log('Created new leaderboard entry:', newEntry);
    
    // Use multi/exec for atomic operations across multiple keys
    const multi = redis.multi();
    
    // 1. Store the full entry data as a Redis hash
    multi.hset(
      `${LEADERBOARD_KEY}:${newEntry.id}`,
      {
        playerName: newEntry.playerName,
        score: newEntry.score.toString(),
        team: newEntry.team,
        timestamp: newEntry.timestamp.toString(),
        combo: newEntry.combo.toString(),
        perfectActions: newEntry.perfectActions.toString(),
        accuracy: newEntry.accuracy.toString(),
        ...(newEntry.fid ? { fid: newEntry.fid } : {}),
        isVerifiedUser: newEntry.isVerifiedUser ? 'true' : 'false'
      }
    );
    
    // 2. Add score to the sorted set for leaderboard ranking
    multi.zadd(LEADERBOARD_KEY, {
      score: newEntry.score,
      member: newEntry.id
    });
    
    // 3. If this user has an FID, associate this score with their user ID
    if (entry.fid) {
      multi.zadd(`${USER_SCORES_KEY}:${entry.fid}`, {
        score: newEntry.score,
        member: newEntry.id
      });
      
      // 4. Set TTL for user data (90 days)
      multi.expire(`${USER_SCORES_KEY}:${entry.fid}`, 60 * 60 * 24 * 90);
    }
    
    // 5. Set TTL for the entry hash (90 days)
    multi.expire(`${LEADERBOARD_KEY}:${newEntry.id}`, 60 * 60 * 24 * 90);
    
    // Execute all commands atomically
    const multiResults = await multi.exec() as Array<[Error | null, unknown]>;
    
    // Check for any errors in the transaction
    const hasErrors = multiResults.some(result => result[0] !== null);
    if (hasErrors) {
      throw new Error("Transaction failed: One or more Redis operations failed");
    }
    
    // Invalidate leaderboard cache since we've added a new entry
    cache.delete('leaderboard');
    
    // Invalidate user's cache if applicable
    if (entry.fid) {
      cache.delete(`user_best_score:${entry.fid}`);
    }
    
    console.log('Score submitted to Redis successfully');
    return newEntry;
  } catch (error) {
    console.error("Error submitting score to Redis:", error);
    throw new Error("Failed to submit score");
  }
}

/**
 * Get team statistics from the leaderboard
 */
export async function getTeamStats(): Promise<{ ghana: number, nigeria: number }> {
  try {
    // Check if Redis is available
    if (!isRedisAvailable() || !redis) {
      console.error("Redis is not available for getting team stats");
      return { ghana: 0, nigeria: 0 };
    }
    
    const leaderboard = await fetchLeaderboard();
    
    // Calculate the total score for each team
    const teamScores = leaderboard.reduce(
      (acc, entry) => {
        if (entry.team === "ghana") {
          acc.ghana += entry.score;
        } else {
          acc.nigeria += entry.score;
        }
        return acc;
      },
      { ghana: 0, nigeria: 0 }
    );
    
    return teamScores;
  } catch (error) {
    console.error("Error getting team stats:", error);
    return { ghana: 0, nigeria: 0 };
  }
}

/**
 * Clear leaderboard data (for testing purposes)
 */
export async function clearLeaderboard(): Promise<void> {
  try {
    if (!isRedisAvailable() || !redis) {
      console.error("Redis is not available for clearing leaderboard");
      return;
    }
    
    // Get all leaderboard entry IDs
    const entryIds = await redis.zrange(LEADERBOARD_KEY, 0, -1);
    
    // Use pipelining for bulk operations
    const pipeline = redis.pipeline();
    
    // Delete each entry's hash
    for (const id of entryIds) {
      // Ensure we have a string ID
      if (typeof id !== 'string') continue;
      pipeline.del(`${LEADERBOARD_KEY}:${id}`);
    }
    
    // Delete the sorted set
    pipeline.del(LEADERBOARD_KEY);
    
    // Execute all deletions in a single batch
    const pipelineResults = await pipeline.exec();
    
    // Check for any errors in the pipeline
    const hasErrors = pipelineResults?.some(result => {
      const [err] = result as [Error | null, unknown];
      return err !== null;
    });
    
    if (hasErrors) {
      console.error("Some operations failed during leaderboard clearing");
    }
    
    // Clear all related caches
    cache.delete('leaderboard');
    
    // Clear user score caches (we don't have an easy way to identify all users,
    // so we rely on the cache TTL to eventually expire user-specific entries)
    
    console.log('Leaderboard cleared from Redis and cache invalidated');
  } catch (error) {
    console.error("Error clearing leaderboard from Redis:", error);
  }
}

/**
 * Get user's best score
 * @param fid Farcaster ID of the user
 */
export async function getUserBestScore(fid: string): Promise<LeaderboardEntry | null> {
  // Early return if no fid
  if (!fid) return null;
  
  // Try to get from cache first
  const cacheKey = `user_best_score:${fid}`;
  const cachedScore = cache.get<LeaderboardEntry>(cacheKey);
  if (cachedScore) {
    return cachedScore;
  }
  
  try {
    if (!isRedisAvailable() || !redis) {
      return null;
    }
    
    // Get the highest scoring entry for this user
    const userBestEntry = await redis.zrange(`${USER_SCORES_KEY}:${fid}`, 0, 0, {
      rev: true, // Get highest score
      withScores: true,
    });
    
    if (!userBestEntry || userBestEntry.length < 2) {
      return null;
    }
    
    // Ensure we have a string ID
    if (typeof userBestEntry[0] !== 'string') {
      return null;
    }
    
    const id = userBestEntry[0];
    
    // Get the full entry data
    const entryData = await redis.hgetall(`${LEADERBOARD_KEY}:${id}`);
    
    if (!entryData) {
      return null;
    }
    
    const entry = {
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
    };
    
    // Cache the user's best score
    cache.set(cacheKey, entry, USER_CACHE_TTL);
    
    return entry;
  } catch (error) {
    console.error("Error getting user's best score:", error);
    return null;
  }
}
