import { TeamType } from "./game/types";
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

// API endpoints for leaderboard functionality
const LEADERBOARD_API = "/api/leaderboard";
// const USER_SCORE_API = "/api/leaderboard/user";
const TEAM_STATS_API = "/api/leaderboard/team-stats";

/**
 * Fetch the current leaderboard data
 */
export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  console.log('[CLIENT] Fetching leaderboard data...');
  
  // Try to get from cache first
  const cachedLeaderboard = cache.get<LeaderboardEntry[]>('leaderboard');
  if (cachedLeaderboard) {
    console.log('[CLIENT] Returning cached leaderboard data:', cachedLeaderboard.length, 'entries');
    return cachedLeaderboard;
  }
  
  console.log('[CLIENT] No cached data, fetching from API:', LEADERBOARD_API);
  
  try {
    const response = await fetch(LEADERBOARD_API, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
      },
      credentials: 'same-origin',
      next: { revalidate: 0 }, // Force fetch fresh data
    });

    console.log('[CLIENT] API response status:', response.status);
    
    if (!response.ok) {
      console.warn(`[CLIENT] Failed to fetch leaderboard: ${response.status}`);
      return [];
    }

    const responseText = await response.text();
    console.log('[CLIENT] Raw response text:', responseText.substring(0, 100) + '...');
    
    let leaderboard: LeaderboardEntry[] = [];
    try {
      leaderboard = JSON.parse(responseText) as LeaderboardEntry[];
    } catch (parseError) {
      console.error('[CLIENT] JSON parse error:', parseError);
      return [];
    }
    
    console.log('[CLIENT] Parsed leaderboard data:', leaderboard.length, 'entries');
    if (leaderboard.length > 0) {
      console.log('[CLIENT] First entry:', leaderboard[0]);
    } else {
      console.log('[CLIENT] No entries in leaderboard data');
    }
    
    // Cache the results before returning
    cache.set('leaderboard', leaderboard, LEADERBOARD_CACHE_TTL);
    
    return leaderboard;
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }
}

/**
 * Submit a new score to the leaderboard
 * @param entry The leaderboard entry to submit (without id or timestamp which will be generated)
 */
export async function submitScore(entry: Omit<LeaderboardEntry, "id" | "timestamp">): Promise<LeaderboardEntry> {
  try {
    console.log('submitScore received entry:', entry);
    if (entry.score === 0) {
      console.warn('WARNING: Received a zero score submission');
    }
    
    const response = await fetch(LEADERBOARD_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
      credentials: 'same-origin',
    });

    if (!response.ok) {
      throw new Error(`Failed to submit score: ${response.status}`);
    }

    const newEntry = await response.json();
    
    // Invalidate leaderboard cache
    cache.delete('leaderboard');
    
    return newEntry;
  } catch (error) {
    console.error('Failed to submit score to leaderboard:', error);
    throw error;
  }
}

/**
 * Get team statistics from the leaderboard
 */
export async function getTeamStats(): Promise<{ ghana: number, nigeria: number }> {
  try {
    const response = await fetch(`${TEAM_STATS_API}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
      },
      credentials: 'same-origin',
    });

    if (!response.ok) {
      console.warn(`Failed to get team stats: ${response.status}`);
      return { ghana: 0, nigeria: 0 };
    }

    const stats = await response.json();
    return stats;
  } catch (error) {
    console.error("Error getting team statistics:", error);
    return { ghana: 0, nigeria: 0 };
  }
}

/**
 * Clear leaderboard data (for testing purposes)
 */
export async function clearLeaderboard(): Promise<void> {
  try {
    const response = await fetch(LEADERBOARD_API, {
      method: 'DELETE',
      credentials: 'same-origin',
    });

    if (!response.ok) {
      console.error(`Failed to clear leaderboard: ${response.status}`);
      return;
    }
    
    // Clear all related caches
    cache.delete('leaderboard');
    
    console.log('Leaderboard cleared from API and cache invalidated');
  } catch (error) {
    console.error("Error clearing leaderboard from API:", error);
  }
}

/**
 * Get a user's best score from their previous submissions
 * @param fid Farcaster user ID
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
    const response = await fetch(`${LEADERBOARD_API}/user/${fid}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
      },
      credentials: 'same-origin',
    });

    if (!response.ok) {
      if (response.status !== 404) { // 404 is expected when no score exists
        console.warn(`Failed to get user best score: ${response.status}`);
      }
      return null;
    }

    const entry = await response.json();
    if (!entry) return null;
    
    // Cache the result
    cache.set(cacheKey, entry, USER_CACHE_TTL);
    
    return entry;
  } catch (error) {
    console.error('Failed to get user best score:', error);
    return null;
  }
}
