import { TeamType } from "./game/types";

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

// Mock leaderboard data (for development without a backend)
const mockLeaderboard: LeaderboardEntry[] = [
  {
    id: "1",
    playerName: "JollofMaster",
    score: 12500,
    team: "ghana",
    timestamp: Date.now() - 7200000, // 2 hours ago
    combo: 15,
    perfectActions: 12,
    accuracy: 92.5
  },
  {
    id: "2",
    playerName: "SpicyChef",
    score: 11200,
    team: "nigeria",
    timestamp: Date.now() - 3600000, // 1 hour ago
    combo: 12,
    perfectActions: 9,
    accuracy: 88.0
  },
  {
    id: "3",
    playerName: "RiceKing",
    score: 9800,
    team: "ghana",
    timestamp: Date.now() - 1800000, // 30 minutes ago
    combo: 10,
    perfectActions: 7,
    accuracy: 85.5
  },
  {
    id: "4",
    playerName: "PepperQueen",
    score: 8900,
    team: "nigeria",
    timestamp: Date.now() - 900000, // 15 minutes ago
    combo: 8,
    perfectActions: 6,
    accuracy: 80.0
  },
  {
    id: "5",
    playerName: "TomatoTaster",
    score: 7500,
    team: "ghana",
    timestamp: Date.now() - 600000, // 10 minutes ago
    combo: 6,
    perfectActions: 5,
    accuracy: 78.5
  }
];

// Local storage keys
const LEADERBOARD_STORAGE_KEY = "jollof_wars_leaderboard";

/**
 * Fetch the current leaderboard data
 * In a real app, this would call an API endpoint
 */
export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  // In a real application, this would be an API call
  // For now, we'll use local storage with mock data as fallback
  try {
    if (typeof window !== 'undefined') {
      const storedData = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        console.log('Fetched leaderboard from storage:', parsedData);
        return parsedData;
      }
      // Initialize with mock data if nothing exists
      console.log('No leaderboard in storage, using mock data');
      localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(mockLeaderboard));
    }
    return mockLeaderboard;
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return mockLeaderboard;
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
    
    // Create a new entry with ID and timestamp
    const newEntry: LeaderboardEntry = {
      ...entry,
      id: Date.now().toString(),
      timestamp: Date.now()
    };
    
    console.log('Created new leaderboard entry:', newEntry);
    
    // In a real app, this would be an API call to save the score
    if (typeof window !== 'undefined') {
      const currentLeaderboard = await fetchLeaderboard();
      
      // Check if user already has entries to ensure we're not duplicating
      if (entry.fid) {
        const existingEntries = currentLeaderboard.filter(item => 
          item.fid === entry.fid && item.team === entry.team
        );
        console.log(`Found ${existingEntries.length} existing entries for this user/team:`, existingEntries);
      }
      
      const updatedLeaderboard = [...currentLeaderboard, newEntry]
        .sort((a, b) => b.score - a.score) // Sort by score (highest first)
        .slice(0, 100); // Limit to top 100 scores
      
      localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(updatedLeaderboard));
      console.log('Updated leaderboard saved to storage');
    }
    
    return newEntry;
  } catch (error) {
    console.error("Error submitting score:", error);
    throw new Error("Failed to submit score");
  }
}

/**
 * Get team statistics from the leaderboard
 */
export async function getTeamStats(): Promise<{ ghana: number, nigeria: number }> {
  try {
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
export function clearLeaderboard(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LEADERBOARD_STORAGE_KEY);
  }
}
