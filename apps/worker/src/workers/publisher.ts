import { Worker, UnrecoverableError } from "bullmq";
import { getDb } from "../lib/db";
import { getRedis } from "../lib/redis";
import { logger } from "../lib/logger";
import { getEnv } from "../lib/env";
import { post, postPlatform, platformAccount, eq, sql } from "@socialspark/db";
import {
  decryptToken,
  getPublishingAdapter,
  PlatformPublishError,
} from "@socialspark/shared";
import type { Platform } from "@socialspark/shared";
import type { PublishJobData } from "./scheduler";
import { tryRefreshToken } from "./token-refresh-helper";
import { moveToDeadLetter } from "./dead-letter";

const BACKOFF_DELAYS = [30_000, 120_000, 600_000, 1_800_000, 3_600_000];

async function updateParentPostStatus(postId: string): Promise<void> {
  const db = getDb();

  const platforms = await db
    .select({ status: postPlatform.status })
    .from(postPlatform)
    .where(eq(postPlatform.postId, postId));

  if (platforms.length === 0) return;

  const statuses = platforms.map((p) => p.status);
  const allPublished = statuses.every((s) => s === "published");
  const allFailed = statuses.every((s) => s === "failed");
  const nonePending = statuses.every((s) => s !== "pending" && s !== "publishing");

  let newStatus: string | null = null;
  if (allPublished) {
    newStatus = "published";
  } else if (allFailed) {
    newStatus = "failed";
  } else if (nonePending) {
    newStatus = "partially_published";
  }

  if (newStatus) {
    await db
      .update(post)
      .set({
        status: newStatus,
        publishedAt: newStatus === "published" ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(post.id, postId));
  }
}

async function processPublishJob(data: PublishJobData): Promise<void> {
  const db = getDb();
  const encryptionKey = getEnv().ENCRYPTION_KEY;

  // Update postPlatform status to publishing
  await db
    .update(postPlatform)
    .set({ status: "publishing", updatedAt: new Date() })
    .where(eq(postPlatform.id, data.postPlatformId));

  // Load platform account
  const [account] = await db
    .select()
    .from(platformAccount)
    .where(eq(platformAccount.id, data.platformAccountId))
    .limit(1);

  if (!account || !account.accessTokenEnc) {
    throw new UnrecoverableError("Platform account not found or no access token");
  }

  if (!account.isActive) {
    throw new UnrecoverableError("Platform account is inactive");
  }

  const platform = account.platform as Platform;
  const accessToken = decryptToken(account.accessTokenEnc, encryptionKey);
  const adapter = getPublishingAdapter(platform);

  try {
    const result = await adapter.publishPost(accessToken, {
      content: data.content,
      hashtags: data.hashtags ?? undefined,
    }, account.platformUserId);

    // Success — update postPlatform
    await db
      .update(postPlatform)
      .set({
        status: "published",
        platformPostId: result.platformPostId,
        platformPostUrl: result.platformPostUrl,
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(postPlatform.id, data.postPlatformId));

    logger.info("Post published successfully", {
      postPlatformId: data.postPlatformId,
      platform,
      platformPostId: result.platformPostId,
    });

    await updateParentPostStatus(data.postId);
  } catch (err) {
    if (err instanceof PlatformPublishError) {
      // HTTP 400 — bad request, no retry
      if (err.statusCode === 400) {
        await markFailed(data, err.message);
        await updateParentPostStatus(data.postId);
        throw new UnrecoverableError(err.message);
      }

      // HTTP 401 — attempt token refresh
      if (err.statusCode === 401) {
        const newToken = await tryRefreshToken(data.platformAccountId, platform);
        if (newToken) {
          // Retry with refreshed token
          try {
            const result = await adapter.publishPost(newToken, {
              content: data.content,
              hashtags: data.hashtags ?? undefined,
            }, account.platformUserId);

            await db
              .update(postPlatform)
              .set({
                status: "published",
                platformPostId: result.platformPostId,
                platformPostUrl: result.platformPostUrl,
                publishedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(postPlatform.id, data.postPlatformId));

            logger.info("Post published after token refresh", {
              postPlatformId: data.postPlatformId,
              platform,
            });

            await updateParentPostStatus(data.postId);
            return;
          } catch {
            // Token refresh didn't help, fall through to retry
          }
        }
      }

      // HTTP 429 — rate limited
      if (err.statusCode === 429 && err.retryAfter) {
        await updateRetryCount(data);
        throw err; // Let BullMQ retry with backoff
      }
    }

    // All other errors — increment retry count and let BullMQ retry
    await updateRetryCount(data);
    throw err;
  }
}

async function markFailed(data: PublishJobData, errorMessage: string): Promise<void> {
  const db = getDb();
  await db
    .update(postPlatform)
    .set({
      status: "failed",
      errorMessage,
      updatedAt: new Date(),
    })
    .where(eq(postPlatform.id, data.postPlatformId));
}

async function updateRetryCount(data: PublishJobData): Promise<void> {
  const db = getDb();
  await db
    .update(postPlatform)
    .set({
      retryCount: sql`${postPlatform.retryCount} + 1`,
      lastRetryAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(postPlatform.id, data.postPlatformId));
}

export function startPublisherWorker(): Worker {
  const worker = new Worker<PublishJobData>(
    "publishing",
    async (job) => {
      await processPublishJob(job.data);
    },
    {
      connection: getRedis(),
      concurrency: 5,
      settings: {
        backoffStrategy: (attemptsMade: number) => {
          const idx = Math.min(attemptsMade - 1, BACKOFF_DELAYS.length - 1);
          return BACKOFF_DELAYS[idx];
        },
      },
    },
  );

  worker.on("failed", async (job, err) => {
    if (!job) return;
    const data = job.data as PublishJobData;

    logger.error("Publish job failed", {
      postPlatformId: data.postPlatformId,
      attempt: job.attemptsMade,
      maxAttempts: job.opts.attempts,
      error: err.message,
    });

    // If all retries exhausted, mark as permanently failed
    if (job.attemptsMade >= (job.opts.attempts ?? 5)) {
      const db = getDb();
      await db
        .update(postPlatform)
        .set({
          status: "failed",
          errorMessage: `Failed after ${job.attemptsMade} attempts: ${err.message}`,
          updatedAt: new Date(),
        })
        .where(eq(postPlatform.id, data.postPlatformId));

      await updateParentPostStatus(data.postId);
      await moveToDeadLetter(data as unknown as Record<string, unknown>, err.message);
    }
  });

  worker.on("completed", (job) => {
    logger.info("Publish job completed", {
      jobId: job.id,
      postPlatformId: job.data.postPlatformId,
    });
  });

  logger.info("Publisher worker started (concurrency: 5)");
  return worker;
}
