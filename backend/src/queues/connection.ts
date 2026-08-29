import Redis, { RedisOptions } from "ioredis";
import { config } from "../config";

const isTls = config.REDIS_URL?.startsWith("rediss://");

/**
 * Standard Redis options required for BullMQ and Upstash Redis operations:
 * - maxRetriesPerRequest: null (required by BullMQ for blocking commands)
 * - enableReadyCheck: false (required for Upstash / serverless Redis)
 * - tls: configured automatically when using rediss://
 */
export const redisOptions: RedisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: false,
  connectTimeout: 10000,
  ...(isTls ? { tls: { rejectUnauthorized: false } } : {}),
  retryStrategy(times: number) {
    if (times === 1) {
      console.warn(
        `⚠️ Connecting to Redis at ${config.REDIS_URL || config.REDIS_HOST}...`
      );
    }
    return Math.min(times * 2000, 10000);
  },
};

/**
 * Single shared Redis connection instance reused everywhere:
 * Queues, Workers, Rate Limiters, and Bull Board.
 */
export const redisConnection: Redis = config.REDIS_URL
  ? new Redis(config.REDIS_URL, redisOptions)
  : new Redis({
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
      ...(config.REDIS_PASSWORD ? { password: config.REDIS_PASSWORD } : {}),
      ...redisOptions,
    });

redisConnection.on("connect", () => {
  console.log("✅ Upstash / Cloud Redis connection established successfully");
});

redisConnection.on("ready", () => {
  console.log("🚀 Redis ready to process BullMQ queue jobs");
});

redisConnection.on("error", (err: any) => {
  if (err?.code !== "ECONNREFUSED") {
    console.warn("⚠️ Redis notice:", err.message || err);
  }
});

export default redisConnection;
