import { TeamType } from "./game/types";
import { redis } from "./redis";

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
    
    // Process the scores array which has [id, score, id, score, ...] format
    for (let i = 0; i < scores.length; i += 2) {
      // Ensure we have valid string values
      if (typeof scores[i] !== 'string') continue;
      if (typeof scores[i+1] !== 'string' && typeof scores[i+1] !== 'number') continue;
      
      const id = scores[i] as string;
      const score = parseFloat(String(scores[i + 1]));
      
      // Get the full entry data from Redis hash
      const entryData = await redis.hgetall(`${LEADERBOARD_KEY}:${id}`);
      
      if (entryData) {
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
    
    // Store the full entry data as a Redis hash
    await redis.hset(
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
    
    // Add score to the sorted set for leaderboard ranking
    await redis.zadd(LEADERBOARD_KEY, {
      score: newEntry.score,
      member: newEntry.id
    });
    
    // If this user has an FID, associate this score with their user ID
    if (entry.fid) {
      await redis.zadd(`${USER_SCORES_KEY}:${entry.fid}`, {
        score: newEntry.score,
        member: newEntry.id
      });
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
    
    // Delete each entry's hash
    for (const id of entryIds) {
      // Ensure we have a string ID
      if (typeof id !== 'string') continue;
      await redis.del(`${LEADERBOARD_KEY}:${id}`);
    }
    
    // Delete the sorted set
    await redis.del(LEADERBOARD_KEY);
    
    console.log('Leaderboard cleared from Redis');
  } catch (error) {
    console.error("Error clearing leaderboard from Redis:", error);
  }
}

/**
 * Get user's best score
 * @param fid Farcaster ID of the user
 */
export async function getUserBestScore(fid: string): Promise<LeaderboardEntry | null> {
  try {
    if (!isRedisAvailable() || !fid || !redis) {
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
    
    return {
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
  } catch (error) {
    console.error("Error getting user's best score:", error);
    return null;
  }
}
