import { getDb } from "../lib/db";
import { platformAccount, eq } from "@socialspark/db";
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
  };
}

const refreshers: Record<string, (refreshToken: string) => Promise<RefreshResult>> = {
  twitter: refreshTwitterToken,
  linkedin: refreshLinkedInToken,
  bluesky: refreshBlueskyToken,
};

/**
 * Attempts to refresh the access token for a platform account.
 * Returns the new decrypted access token on success.
 */
export async function tryRefreshToken(accountId: string, platform: string): Promise<string | null> {
  const db = getDb();
  const encryptionKey = getEnv().ENCRYPTION_KEY;

  const [account] = await db
    .select()
    .from(platformAccount)
    .where(eq(platformAccount.id, accountId))
    .limit(1);

  if (!account?.refreshTokenEnc) {
    return null;
  }

  const refresher = refreshers[platform];
  if (!refresher) {
    return null;
  }

  try {
    const refreshToken = decryptToken(account.refreshTokenEnc, encryptionKey);
    const result = await refresher(refreshToken);

    const newAccessTokenEnc = encryptToken(result.accessToken, encryptionKey);
    const newRefreshTokenEnc = result.refreshToken
      ? encryptToken(result.refreshToken, encryptionKey)
      : account.refreshTokenEnc;
    const newExpiresAt = result.expiresIn
      ? new Date(Date.now() + result.expiresIn * 1000)
      : null;

    await db
      .update(platformAccount)
      .set({
        accessTokenEnc: newAccessTokenEnc,
        refreshTokenEnc: newRefreshTokenEnc,
        tokenExpiresAt: newExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(platformAccount.id, accountId));

    logger.info("Token refreshed successfully", { accountId, platform });
    return result.accessToken;
  } catch (err) {
    logger.error("Token refresh failed", {
      accountId,
      platform,
      error: err instanceof Error ? err.message : "Unknown error",
    });
    return null;
  }
}
