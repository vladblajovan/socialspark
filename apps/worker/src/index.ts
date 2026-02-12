import { getEnv } from "./lib/env";
import { getRedis, closeRedis } from "./lib/redis";
import { closeQueues } from "./queues";
import { closeDeadLetterQueue } from "./workers/dead-letter";
import { startSchedulerWorker } from "./workers/scheduler";
import { startPublisherWorker } from "./workers/publisher";
import { startHeartbeat, stopHeartbeat } from "./lib/heartbeat";
import { logger } from "./lib/logger";
import type { Worker } from "bullmq";

let schedulerWorker: Worker | null = null;
let publisherWorker: Worker | null = null;

async function main() {
  // Validate environment
  getEnv();
  logger.info("Environment validated");

  // Test Redis connection
  const redis = getRedis();
  const pong = await redis.ping();
  if (pong !== "PONG") {
    throw new Error(`Redis ping failed: ${pong}`);
  }
  logger.info("Redis connected");

  // Start workers
  schedulerWorker = startSchedulerWorker();
  publisherWorker = startPublisherWorker();

  // Start heartbeat
  startHeartbeat();

  logger.info("SocialSpark Worker started successfully");
}

async function shutdown() {
  logger.info("Shutting down...");
  stopHeartbeat();

  if (schedulerWorker) {
    await schedulerWorker.close();
    schedulerWorker = null;
  }
  if (publisherWorker) {
    await publisherWorker.close();
    publisherWorker = null;
  }

  await closeQueues();
  await closeDeadLetterQueue();
  await closeRedis();
  logger.info("Shutdown complete");
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

main().catch((err) => {
  logger.error("Worker failed to start", {
    error: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});
