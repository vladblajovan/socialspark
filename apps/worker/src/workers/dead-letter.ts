import { Queue } from "bullmq";
import { getRedis } from "../lib/redis";
import { logger } from "../lib/logger";

let _deadLetterQueue: Queue | null = null;

export function getDeadLetterQueue(): Queue {
  if (!_deadLetterQueue) {
    _deadLetterQueue = new Queue("dead-letter", {
      connection: getRedis(),
      defaultJobOptions: {
        removeOnComplete: { age: 90 * 24 * 3600 }, // 90 days
      },
    });
  }
  return _deadLetterQueue;
}

export async function moveToDeadLetter(
  jobData: Record<string, unknown>,
  error: string,
): Promise<void> {
  const dlq = getDeadLetterQueue();
  await dlq.add("failed-publish", {
    ...jobData,
    failedAt: new Date().toISOString(),
    error,
  });
  logger.warn("Job moved to dead letter queue", {
    postPlatformId: jobData.postPlatformId,
    error,
  });
}

export async function closeDeadLetterQueue(): Promise<void> {
  if (_deadLetterQueue) {
    await _deadLetterQueue.close();
    _deadLetterQueue = null;
  }
}
