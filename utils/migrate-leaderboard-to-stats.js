/**
 * Migration utility to populate player-stats from leaderboard data
 * 
 * This script aggregates all leaderboard scores and creates player-stats entries
 * so that the profile page shows the correct data.
 */

const { createClient } = require('redis');

// Redis keys - match exact format in the Redis database
const LEADERBOARD_KEY = "jollof_wars:leaderboard"; // Sorted set with score mapping
const LEADERBOARD_HASH_PREFIX = "jollof_wars:leaderboard:"; // Hash entries with details
const PLAYER_STATS_KEY = "jollof_wars:player_stats"; // Where player stats are stored

async function migrateLeaderboardToStats() {
  console.log('Starting migration of leaderboard data to player stats...');
  
  // Create Redis client
  const redis = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });
  
  await redis.connect();
  console.log('Connected to Redis');

  try {
    // Get all leaderboard entries
    const leaderboardIds = await redis.zRange(LEADERBOARD_KEY, 0, -1);
    console.log(`Found ${leaderboardIds.length} leaderboard entries`);
    
    // Map to store player stats by ID (either FID or derived from player name)
    const playerStats = new Map();
    
    // Process each leaderboard entry
    for (const id of leaderboardIds) {
      const entryData = await redis.hGetAll(`${LEADERBOARD_HASH_PREFIX}${id}`);
      
      if (Object.keys(entryData).length === 0) {
        console.log(`No data found for entry ${id}, skipping`);
        continue;
      }
      
      // Use FID if available, otherwise use playerName as ID
      const playerId = entryData.fid || entryData.playerName;
      const score = parseInt(entryData.score) || 0;
      
      if (!playerId) {
        console.log(`No player identifier found for entry ${id}, skipping`);
        continue;
      }
      
      console.log(`Processing entry ${id} for player ${playerId} with score ${score}`);
      
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
    const pipeline = redis.pipeline();
    
    for (const [playerId, stats] of playerStats.entries()) {
      console.log(`Saving stats for player ${playerId}:`, stats);
      pipeline.hSet(`${PLAYER_STATS_KEY}:${playerId}`, stats);
    }
    
    const results = await pipeline.exec();
    console.log(`Successfully migrated ${playerStats.size} player stats`);
    
    // Output summary
    console.log('\nMigration Summary:');
    console.log('-----------------');
    console.log(`Total leaderboard entries processed: ${leaderboardIds.length}`);
    console.log(`Total player stats created: ${playerStats.size}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await redis.quit();
    console.log('Redis connection closed');
  }
}

// Run the migration
migrateLeaderboardToStats().catch(console.error);
