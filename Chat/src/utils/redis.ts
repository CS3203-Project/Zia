import Redis from 'ioredis';

// Singleton Redis client, mirroring the DatabaseManager pattern in database.ts. Used for
// the rate limiter's shared counter store, the Socket.IO adapter (cross-pod room/emit
// routing), and presence state (connected users / active conversations) — all of which
// need state that survives per-pod, not per-process memory, once this service runs more
// than one replica.
class RedisManager {
  private static instance: Redis;

  static getInstance(): Redis {
    if (!RedisManager.instance) {
      RedisManager.instance = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
        maxRetriesPerRequest: 3,
        // Rate limiting/caching are best-effort — if Redis is briefly unreachable, keep
        // retrying quietly instead of crashing the whole service over it.
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
