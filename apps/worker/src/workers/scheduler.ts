import { Worker } from "bullmq";
import { getDb } from "../lib/db";
import { getRedis } from "../lib/redis";
import { logger } from "../lib/logger";
import { getPublishingQueue, getSchedulingQueue } from "../queues";
import { post, postPlatform, platformAccount, eq, and, sql } from "@socialspark/db";

export interface PublishJobData {
  postPlatformId: string;
  postId: string;
  platformAccountId: string;
  content: string;
  hashtags: string[] | null;
}

async function scanAndEnqueue(): Promise<number> {
  const db = getDb();
  const publishingQueue = getPublishingQueue();

  // Find postPlatform rows ready to publish:
  // post.status = 'scheduled', post.scheduledAt <= NOW() + 60s, postPlatform.status = 'pending'
  const rows = await db
    .select({
      postPlatformId: postPlatform.id,
      postId: postPlatform.postId,
      platformAccountId: postPlatform.platformAccountId,
      postPlatformContent: postPlatform.content,
      postPlatformHashtags: postPlatform.hashtags,
      postContent: post.content,
      platform: platformAccount.platform,
    })
    .from(postPlatform)
    .innerJoin(post, eq(postPlatform.postId, post.id))
    .innerJoin(platformAccount, eq(postPlatform.platformAccountId, platformAccount.id))
    .where(
      and(
        eq(post.status, "scheduled"),
        sql`${post.scheduledAt} <= NOW() + INTERVAL '60 seconds'`,
        eq(postPlatform.status, "pending"),
      ),
    );

  if (rows.length === 0) return 0;

  // Collect unique post IDs to update status
  const postIds = [...new Set(rows.map((r) => r.postId))];

  // Add jobs to publishing queue (with deduplication via jobId)
  for (const row of rows) {
    const content = row.postPlatformContent ?? row.postContent ?? "";
    const jobData: PublishJobData = {
      postPlatformId: row.postPlatformId,
      postId: row.postId,
      platformAccountId: row.platformAccountId,
      content,
      hashtags: row.postPlatformHashtags,
    };

    await publishingQueue.add("publish", jobData, {
      jobId: `publish-${row.postPlatformId}`,
    });
  }

  // Update parent posts to "publishing"
  for (const postId of postIds) {
    await db
      .update(post)
      .set({ status: "publishing", updatedAt: new Date() })
      .where(eq(post.id, postId));
  }

  logger.info("Scheduler enqueued jobs", {
    jobCount: rows.length,
    postCount: postIds.length,
  });

  return rows.length;
}

export function startSchedulerWorker(): Worker {
  const schedulingQueue = getSchedulingQueue();

  // Add repeatable job that runs every 30 seconds
  schedulingQueue.upsertJobScheduler(
    "scheduler-scan",
    { every: 30_000 },
    { name: "scan", data: {} },
  );

  const worker = new Worker(
    "scheduling",
    async () => {
      await scanAndEnqueue();
    },
    {
      connection: getRedis(),
      concurrency: 1,
    },
  );

  worker.on("failed", (job, err) => {
    logger.error("Scheduler scan failed", {
      jobId: job?.id,
      error: err.message,
    });
  });

  logger.info("Scheduler worker started (30s interval)");
  return worker;
}

// Export for testing
export { scanAndEnqueue };
