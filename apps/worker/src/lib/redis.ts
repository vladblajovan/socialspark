import IORedis from "ioredis";
import { getEnv } from "./env";

let _redis: IORedis | null = null;

export function getRedis(): IORedis {
  if (!_redis) {
    _redis = new IORedis(getEnv().REDIS_URL, {
      maxRetriesPerRequest: null, // Required by BullMQ
    });
  }
  return _redis;
}

export async function closeRedis(): Promise<void> {
  if (_redis) {
    await _redis.quit();
    _redis = null;
  }
}
