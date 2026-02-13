import { Queue } from "bullmq";
import { getRedis } from "./lib/redis";

let _publishingQueue: Queue | null = null;
let _schedulingQueue: Queue | null = null;
let _tokenRefreshQueue: Queue | null = null;

export function getPublishingQueue(): Queue {
  if (!_publishingQueue) {
    _publishingQueue = new Queue("publishing", {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: "custom" },
        removeOnComplete: { age: 7 * 24 * 3600 }, // 7 days
        removeOnFail: { age: 30 * 24 * 3600 }, // 30 days
      },
    });
  }
  return _publishingQueue;
}

export function getSchedulingQueue(): Queue {
  if (!_schedulingQueue) {
    _schedulingQueue = new Queue("scheduling", {
      connection: getRedis(),
    });
  }
  return _schedulingQueue;
}

export function getTokenRefreshQueue(): Queue {
  if (!_tokenRefreshQueue) {
    _tokenRefreshQueue = new Queue("token-refresh", {
      connection: getRedis(),
    });
  }
  return _tokenRefreshQueue;
}

export async function closeQueues(): Promise<void> {
  if (_publishingQueue) {
    await _publishingQueue.close();
    _publishingQueue = null;
  }
  if (_schedulingQueue) {
    await _schedulingQueue.close();
    _schedulingQueue = null;
  }
  if (_tokenRefreshQueue) {
    await _tokenRefreshQueue.close();
    _tokenRefreshQueue = null;
  }
}
