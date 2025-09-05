/**
 * Redis Connection Diagnostics Tool
 * 
 * This script tests the connection to Redis and provides detailed diagnostics.
 * Run with: node utils/redis-diagnostics.js
 */

// Import required dependencies
const dotenv = require('dotenv');
const { Redis } = require('@upstash/redis');

// Load environment variables
dotenv.config();

async function runRedisDiagnostics() {
  console.log('====== Redis Connection Diagnostics ======\n');
  
  // 1. Check environment variables
  console.log('1. Checking environment variables:');
  const redisUrl = process.env.REDIS_URL;
  const redisToken = process.env.REDIS_TOKEN;
  
  if (!redisUrl) {
    console.error('❌ REDIS_URL is missing or empty');
    return;
  } else {
    console.log('✅ REDIS_URL is set:', maskUrl(redisUrl));
  }
  
  if (!redisToken) {
    console.error('❌ REDIS_TOKEN is missing or empty');
    return;
  } else {
    console.log('✅ REDIS_TOKEN is set:', maskToken(redisToken));
  }
  
  // 2. Try to initialize Redis client
  console.log('\n2. Initializing Redis client:');
  let client;
  try {
    client = new Redis({
      url: redisUrl,
      token: redisToken,
      connectionTimeout: 5000,
      maxRetries: 3
    });
    console.log('✅ Redis client initialized');
  } catch (err) {
    console.error('❌ Failed to initialize Redis client:', err.message);
    return;
  }
  
  // 3. Test basic Redis operations
  console.log('\n3. Testing Redis operations:');
  
  // 3.1 Test ping
  try {
    console.log('- Testing PING...');
    const pingResult = await client.ping();
    if (pingResult === 'PONG') {
      console.log('  ✅ PING successful');
    } else {
      console.log(`  ❌ PING returned unexpected value: ${pingResult}`);
    }
  } catch (err) {
    console.error('  ❌ PING failed:', err.message);
  }
  
  // 3.2 Test SET/GET
  try {
    console.log('- Testing SET/GET...');
    const testKey = 'diagnostic_test_key';
    const testValue = 'test_' + Date.now();
    
    await client.set(testKey, testValue);
    const fetchedValue = await client.get(testKey);
    
    if (fetchedValue === testValue) {
      console.log('  ✅ SET/GET successful');
    } else {
      console.log(`  ❌ SET/GET mismatch: Expected "${testValue}", got "${fetchedValue}"`);
    }
    
    // Clean up
    await client.del(testKey);
  } catch (err) {
    console.error('  ❌ SET/GET failed:', err.message);
  }
  
  // 3.3 Test accessing leaderboard key
  try {
    console.log('- Testing leaderboard access...');
    const leaderboardKey = 'jollof_wars:leaderboard';
    const exists = await client.exists(leaderboardKey);
    
    console.log(`  ${exists ? '✅' : '⚠️'} Leaderboard key ${exists ? 'exists' : 'does not exist yet'}`);
    
    if (exists) {
      const count = await client.zcard(leaderboardKey);
      console.log(`  ℹ️ Leaderboard has ${count} entries`);
    }
  } catch (err) {
    console.error('  ❌ Leaderboard access failed:', err.message);
  }
  
  console.log('\n====== Diagnostics Complete ======');
}

// Helper functions to mask sensitive information
function maskUrl(url) {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.host}/***`;
  } catch (e) {
    return url.substring(0, 10) + '...';
  }
}

function maskToken(token) {
  if (token.length <= 8) return '********';
  return token.substring(0, 4) + '...' + token.substring(token.length - 4);
}

// Run the diagnostics
runRedisDiagnostics().catch(err => {
  console.error('Fatal error in diagnostics:', err);
});
