import Redis from "ioredis";
import { config } from "./config";

const isTls = config.REDIS_URL?.startsWith("rediss://");

const redisOptions = {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
  lazyConnect: false,
  connectTimeout: 10000,
  ...(isTls ? { tls: { rejectUnauthorized: false } } : {}),
  retryStrategy(times: number) {
    if (times === 1) {
      console.warn("⚠️ Connecting to Redis at " + (config.REDIS_URL || config.REDIS_HOST) + "...");
    }
    return Math.min(times * 2000, 10000);
  },
};

// ─── Primary client (BullMQ uses this) ───────────────────────────────────────
export const redis = config.REDIS_URL
  ? new Redis(config.REDIS_URL, redisOptions)
  : new Redis({
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
      ...(config.REDIS_PASSWORD ? { password: config.REDIS_PASSWORD } : {}),
      ...redisOptions,
    });

// ─── Subscriber client (BullMQ needs a dedicated subscriber connection) ───────
export const redisSubscriber = config.REDIS_URL
  ? new Redis(config.REDIS_URL, redisOptions)
  : new Redis({
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
      ...(config.REDIS_PASSWORD ? { password: config.REDIS_PASSWORD } : {}),
      ...redisOptions,
    });

redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error", () => {
  // Handled by retryStrategy
});

redisSubscriber.on("connect", () => console.log("✅ Redis Subscriber connected"));
redisSubscriber.on("error", () => {
  // Handled by retryStrategy
});

// In-memory counter fallback when Redis is offline
const inMemoryCounters = new Map<string, number>();

/**
 * Get the current hourly rate-limit counter for a sender.
 * Key format: ratelimit:{sender}:{YYYY-MM-DDTHH}
 */
export function getRateLimitKey(sender: string): string {
  const now = new Date();
  const hourLabel = now.toISOString().slice(0, 13); // "2026-08-28T14"
  return `ratelimit:${sender}:${hourLabel}`;
}

/**
 * Increment the hourly counter and return the new value.
 * Sets TTL to 7200s (2 hours) to handle clock drift across hour boundaries.
 */
export async function incrementRateLimit(sender: string): Promise<number> {
  const key = getRateLimitKey(sender);
  if (redis.status === "ready") {
    try {
      const pipeline = redis.pipeline();
      pipeline.incr(key);
      pipeline.expire(key, 7200);
      const results = await pipeline.exec();
      if (results && results[0]) {
        const [err, count] = results[0] as [Error | null, number];
        if (!err && typeof count === "number") return count;
      }
    } catch (err) {
      console.warn("Redis increment error, falling back to memory:", err);
    }
  }
  const curr = (inMemoryCounters.get(key) || 0) + 1;
  inMemoryCounters.set(key, curr);
  return curr;
}

/**
 * Read the current hourly count without incrementing.
 */
export async function getCurrentRateLimit(sender: string): Promise<number> {
  const key = getRateLimitKey(sender);
  if (redis.status === "ready") {
    try {
      const value = await redis.get(key);
      if (value) return parseInt(value, 10);
    } catch {
      // fallback to memory
    }
  }
  return inMemoryCounters.get(key) || 0;
}

/**
 * Compute ms until the start of the next hour.
 */
export function msUntilNextHour(): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(next.getHours() + 1, 0, 0, 0);
  return next.getTime() - now.getTime();
}

export default redis;
