import { getDb } from "@/lib/db";
import { platformAccount, eq, and, sql } from "@socialspark/db";
import { encryptToken, decryptToken } from "@socialspark/shared";
import type { Platform } from "@socialspark/shared";
import { getPlatformAdapter } from "./index";

interface RefreshResult {
  total: number;
  refreshed: number;
  failed: number;
  errors: Array<{ accountId: string; platform: string; error: string }>;
}

export async function refreshExpiringTokens(): Promise<RefreshResult> {
  const db = getDb();
  const encryptionKey = process.env.ENCRYPTION_KEY!;

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

  const result: RefreshResult = {
    total: expiringAccounts.length,
    refreshed: 0,
    failed: 0,
    errors: [],
  };

  for (const account of expiringAccounts) {
    try {
      const adapter = getPlatformAdapter(account.platform as Platform);
      const refreshToken = decryptToken(account.refreshTokenEnc!, encryptionKey);
      const tokens = await adapter.refreshAccessToken(refreshToken);

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
    } catch (err) {
      result.failed++;
      result.errors.push({
        accountId: account.id,
        platform: account.platform,
        error: err instanceof Error ? err.message : "Unknown error",
      });

      // Mark account as inactive on refresh failure
      await db
        .update(platformAccount)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(platformAccount.id, account.id));
    }
  }

  return result;
}
