import Redis from 'ioredis';

// Singleton Redis client, mirroring DatabaseManager in database.ts. Used to back the
// rate limiter's shared counter store — see the comment on `limiter` in index.ts.
class RedisManager {
  private static instance: Redis;

  static getInstance(): Redis {
    if (!RedisManager.instance) {
      RedisManager.instance = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => Math.min(times * 200, 5000),
      });

      RedisManager.instance.on('error', (err) => {
        console.error('Redis connection error:', err.message);
      });

      const shutdown = () => {
        RedisManager.instance.disconnect();
      };
      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
    }

    return RedisManager.instance;
  }
}

export const redis = RedisManager.getInstance();
