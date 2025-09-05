/**
 * Redis connection test utility
 * Run this file to test if Redis connection is working
 */
import { redis, validateRedisConnection } from './redis';

async function testRedisConnection() {
  console.log('Testing Redis connection...');
  console.log('Redis environment variables:');
  console.log(`REDIS_URL: ${process.env.REDIS_URL ? '✓ Set' : '✗ Not set'}`);
  console.log(`REDIS_TOKEN: ${process.env.REDIS_TOKEN ? '✓ Set' : '✗ Not set'}`);
  
  console.log('\nRedis client initialized:', redis ? '✓ Yes' : '✗ No');
  
  if (redis) {
    try {
      const isConnected = await validateRedisConnection();
      console.log('Redis connection test:', isConnected ? '✓ Successful' : '✗ Failed');
      
      if (isConnected) {
        // Try a basic operation
        await redis.set('test_key', 'Connection test successful');
        const testValue = await redis.get('test_key');
        console.log('Redis test operation:', testValue === 'Connection test successful' ? '✓ Successful' : '✗ Failed');
      }
    } catch (error) {
      console.error('Redis connection test error:', error);
    }
  }
}

// Execute the test function
testRedisConnection().catch(console.error);
