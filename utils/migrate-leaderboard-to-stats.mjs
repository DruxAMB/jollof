/**
 * Migration utility to populate player-stats from leaderboard data
 * 
 * This script aggregates all leaderboard scores and creates player-stats entries
 * so that the profile page shows the correct data.
 */

// Import Redis directly
import { Redis } from '@upstash/redis';

// Redis keys - match exact format in the Redis database
const LEADERBOARD_KEY = "jollof_wars:leaderboard"; // Sorted set with score mapping
const LEADERBOARD_HASH_PREFIX = "jollof_wars:leaderboard:"; // Hash entries with details
const PLAYER_STATS_KEY = "jollof_wars:player_stats"; // Where player stats are stored

// Hardcoded credentials - copied from .env file
const REDIS_URL = "https://wanted-sunbird-9039.upstash.io";
const REDIS_TOKEN = "ASNPAAImcDFmNDc0NTllYmVmMDU0OWYyOGNiNTg1MjE0OWJlNWMzM3AxOTAzOQ";

// Create Redis client with hardcoded values
let redisClient;
try {
  console.log('🔌 Initializing Redis client with URL:', REDIS_URL);
  console.log('🔑 Token length:', REDIS_TOKEN.length);
  
  redisClient = new Redis({
    url: REDIS_URL,
    token: REDIS_TOKEN,
  });
  
  // Test connection before proceeding
  console.log('🔄 Testing Redis connection...');
} catch (err) {
  console.error('❌ Failed to initialize Redis client:', err);
  process.exit(1);
}

async function migrateLeaderboardToStats() {
  console.log('🔄 Starting migration of leaderboard data to player stats...');
  
  try {
    // Get all leaderboard entries
    const leaderboardIds = await redisClient.zrange(LEADERBOARD_KEY, 0, -1);
    console.log(`📊 Found ${leaderboardIds.length} leaderboard entries`);
    
    // Map to store player stats by ID (either FID or derived from player name)
    const playerStats = new Map();
    
    // Process each leaderboard entry
    for (const id of leaderboardIds) {
      const entryData = await redisClient.hgetall(`${LEADERBOARD_HASH_PREFIX}${id}`);
      
      if (!entryData || Object.keys(entryData).length === 0) {
        console.log(`⚠️ No data found for entry ${id}, skipping`);
        continue;
      }
      
      // Use FID if available, otherwise use playerName as ID
      const playerId = entryData.fid || entryData.playerName;
      const score = parseInt(entryData.score) || 0;
      
      if (!playerId) {
        console.log(`⚠️ No player identifier found for entry ${id}, skipping`);
        continue;
      }
      
      console.log(`🧑‍🍳 Processing entry ${id} for player ${playerId} with score ${score}`);
      
      // Get or initialize player stats
      if (!playerStats.has(playerId)) {
        playerStats.set(playerId, {
          totalScore: 0,
          highScore: 0,
          gamesPlayed: 0,
          lastGameDate: new Date(0).toISOString()
        });
      }
      
      const stats = playerStats.get(playerId);
      
      // Update stats
      stats.totalScore += score;
      stats.highScore = Math.max(stats.highScore, score);
      stats.gamesPlayed += 1;
      
      // Update last game date if this entry is newer
      const timestamp = parseInt(entryData.timestamp) || 0;
      if (timestamp > new Date(stats.lastGameDate).getTime()) {
        stats.lastGameDate = new Date(timestamp).toISOString();
      }
    }
    
    // Save all player stats to Redis
    console.log(`💾 Saving stats for ${playerStats.size} players...`);
    
    for (const [playerId, stats] of playerStats.entries()) {
      console.log(`📝 Saving stats for player ${playerId}:`, stats);
      
      // Convert to plain object for Redis
      const statsObject = {
        totalScore: stats.totalScore,
        highScore: stats.highScore,
        gamesPlayed: stats.gamesPlayed,
        lastGameDate: stats.lastGameDate
      };
      
      // Save to Redis
      await redisClient.hset(`${PLAYER_STATS_KEY}:${playerId}`, statsObject);
    }
    
    // Output summary
    console.log('\n✅ Migration Summary:');
    console.log('-----------------');
    console.log(`Total leaderboard entries processed: ${leaderboardIds.length}`);
    console.log(`Total player stats created: ${playerStats.size}`);
    
    return {
      entriesProcessed: leaderboardIds.length,
      playersUpdated: playerStats.size
    };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Execute migration when script is run directly
// Using a self-executing async function for top-level await
(async () => {
  try {
    console.log('🚀 Starting Jollof Wars leaderboard migration...');
    await migrateLeaderboardToStats();
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('💥 Migration failed:', err);
    process.exit(1);
  }
})();
