import Redis from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  enableReadyCheck: true,
  lazyConnect: true,
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redis.on('connect', () => {
  console.log('Redis connected');
});

export class CacheService {
  private prefix: string;
  private defaultTTL: number;

  constructor(prefix = 'nf:', defaultTTL = 300) {
    this.prefix = prefix;
    this.defaultTTL = defaultTTL;
  }

  private key(k: string): string {
    return `${this.prefix}${k}`;
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(this.key(key));
    if (!data) return null;
    return JSON.parse(data) as T;
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl || this.defaultTTL) {
      await redis.setex(this.key(key), ttl || this.defaultTTL, serialized);
    } else {
      await redis.set(this.key(key), serialized);
    }
  }

  async del(key: string): Promise<void> {
    await redis.del(this.key(key));
  }

  async delPattern(pattern: string): Promise<void> {
    const keys = await redis.keys(this.key(pattern));
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  async incr(key: string, ttl?: number): Promise<number> {
    const val = await redis.incr(this.key(key));
    if (ttl && val === 1) {
      await redis.expire(this.key(key), ttl);
    }
    return val;
  }

  async exists(key: string): Promise<boolean> {
    return (await redis.exists(this.key(key))) === 1;
  }
}

export const cache = new CacheService();
export const sessionCache = new CacheService('nf:session:', 86400);
export const rateLimitCache = new CacheService('nf:rl:', 60);
