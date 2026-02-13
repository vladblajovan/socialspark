import { Worker } from "bullmq";
import { getDb } from "../lib/db";
import { getRedis } from "../lib/redis";
import { getTokenRefreshQueue } from "../queues";
import { platformAccount, eq, and, sql } from "@socialspark/db";
import { encryptToken, decryptToken } from "@socialspark/shared";
import { logger } from "../lib/logger";
import { getEnv } from "../lib/env";

interface RefreshResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

async function refreshTwitterToken(refreshToken: string): Promise<RefreshResult> {
  const env = getEnv();
  const clientId = env.TWITTER_CLIENT_ID;
  const clientSecret = env.TWITTER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Twitter OAuth credentials not configured");
  }

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Twitter token refresh failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

async function refreshLinkedInToken(refreshToken: string): Promise<RefreshResult> {
  const env = getEnv();
  const clientId = env.LINKEDIN_CLIENT_ID;
  const clientSecret = env.LINKEDIN_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("LinkedIn OAuth credentials not configured");
  }

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LinkedIn token refresh failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

async function refreshBlueskyToken(refreshToken: string): Promise<RefreshResult> {
  const res = await fetch("https://bsky.social/xrpc/com.atproto.server.refreshSession", {
    method: "POST",
    headers: { Authorization: `Bearer ${refreshToken}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Bluesky token refresh failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  return {
    accessToken: data.accessJwt,
    refreshToken: data.refreshJwt,
    expiresIn: 2 * 60 * 60,
  };
}

const refreshers: Record<string, (refreshToken: string) => Promise<RefreshResult>> = {
  twitter: refreshTwitterToken,
  linkedin: refreshLinkedInToken,
  bluesky: refreshBlueskyToken,
};

async function refreshExpiringTokens(): Promise<{
  total: number;
  refreshed: number;
  failed: number;
}> {
  const db = getDb();
  const encryptionKey = getEnv().ENCRYPTION_KEY;

  // Find active accounts with tokens expiring within 150 minutes (runs every 2h with overlap)
  const expiringAccounts = await db
    .select()
    .from(platformAccount)
    .where(
      and(
        eq(platformAccount.isActive, true),
        sql`${platformAccount.tokenExpiresAt} IS NOT NULL`,
        sql`${platformAccount.tokenExpiresAt} < NOW() + INTERVAL '150 minutes'`,
        sql`${platformAccount.refreshTokenEnc} IS NOT NULL`,
      ),
    );

  const result = { total: expiringAccounts.length, refreshed: 0, failed: 0 };

  for (const account of expiringAccounts) {
    const refresher = refreshers[account.platform];
    if (!refresher) continue;

    try {
      const refreshToken = decryptToken(account.refreshTokenEnc!, encryptionKey);
      const tokens = await refresher(refreshToken);

      const newAccessTokenEnc = encryptToken(tokens.accessToken, encryptionKey);
      const newRefreshTokenEnc = tokens.refreshToken
        ? encryptToken(tokens.refreshToken, encryptionKey)
        : account.refreshTokenEnc;
      const newExpiresAt = tokens.expiresIn
        ? new Date(Date.now() + tokens.expiresIn * 1000)
        : null;

      await db
        .update(platformAccount)
        .set({
          accessTokenEnc: newAccessTokenEnc,
          refreshTokenEnc: newRefreshTokenEnc,
          tokenExpiresAt: newExpiresAt,
          updatedAt: new Date(),
        })
        .where(eq(platformAccount.id, account.id));

      result.refreshed++;
      logger.info("Token refreshed", { accountId: account.id, platform: account.platform });
    } catch (err) {
      result.failed++;
      logger.error("Token refresh failed", {
        accountId: account.id,
        platform: account.platform,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return result;
}

export function startTokenRefreshWorker(): Worker {
  const queue = getTokenRefreshQueue();

  // Run every 2 hours
  queue.upsertJobScheduler(
    "token-refresh-scan",
    { every: 2 * 60 * 60 * 1000 },
    { name: "refresh", data: {} },
  );

  const worker = new Worker(
    "token-refresh",
    async () => {
      const result = await refreshExpiringTokens();
      logger.info("Token refresh scan complete", result);
    },
    {
      connection: getRedis(),
      concurrency: 1,
    },
  );

  worker.on("failed", (job, err) => {
    logger.error("Token refresh worker failed", {
      jobId: job?.id,
      error: err.message,
    });
  });

  logger.info("Token refresh worker started (2h interval)");
  return worker;
}
