import { Redis } from '@upstash/redis';

let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || 'https://placeholder.upstash.io',
      token: process.env.UPSTASH_REDIS_REST_TOKEN || 'placeholder-token',
    });
  }
  return _redis;
}

// Lazily-initialized alias
export const redis = {
  get: (...args: Parameters<Redis['get']>) => getRedis().get(...args),
  set: (...args: Parameters<Redis['set']>) => getRedis().set(...args),
  incr: (...args: Parameters<Redis['incr']>) => getRedis().incr(...args),
  expire: (...args: Parameters<Redis['expire']>) => getRedis().expire(...args),
  zadd: (...args: Parameters<Redis['zadd']>) => getRedis().zadd(...args),
  zrange: (...args: Parameters<Redis['zrange']>) => getRedis().zrange(...args),
};

function redisConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

/**
 * Cache-aside helper. Reads from Redis; on miss (or no Redis) computes `fn`,
 * caches it for `ttlSec`, and returns it. Fully graceful — any Redis error
 * falls back to a direct compute so the request still succeeds.
 * Prevents read-heavy endpoints (ranking/insights) from full-scanning per call.
 */
export async function cached<T>(key: string, ttlSec: number, fn: () => Promise<T>): Promise<T> {
  if (!redisConfigured()) return fn();
  try {
    const hit = await getRedis().get<T>(key);
    if (hit !== null && hit !== undefined) return hit;
  } catch {
    /* fall through to compute */
  }
  const value = await fn();
  try {
    await getRedis().set(key, value, { ex: ttlSec });
  } catch {
    /* ignore cache write failures */
  }
  return value;
}

// Keys
export const KEYS = {
  savingsRanking: (month: string) => `ranking:savings:${month}`,
  dealHunterRanking: (month: string) => `ranking:deals:${month}`,
  tipGuruRanking: (month: string) => `ranking:tips:${month}`,
  hotTips: 'hot_tips',
  productPriceCache: (productId: string) => `price:${productId}`,
  rateLimitTip: (userId: string) => `ratelimit:tip:${userId}`,
};
