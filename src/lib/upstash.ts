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

// Keys
export const KEYS = {
  savingsRanking: (month: string) => `ranking:savings:${month}`,
  dealHunterRanking: (month: string) => `ranking:deals:${month}`,
  tipGuruRanking: (month: string) => `ranking:tips:${month}`,
  hotTips: 'hot_tips',
  productPriceCache: (productId: string) => `price:${productId}`,
  rateLimitTip: (userId: string) => `ratelimit:tip:${userId}`,
};
