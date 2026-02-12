import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { teamMember, platformAccount, eq, and } from "@socialspark/db";
import { encryptToken, decryptToken } from "@socialspark/shared";
import type { Platform } from "@socialspark/shared";
import { getPlatformAdapter } from "@/lib/platforms";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ platform: string; accountId: string }> },
) {
  try {
    const { platform, accountId } = await params;
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const [membership] = await db
      .select()
      .from(teamMember)
      .where(eq(teamMember.userId, session.user.id))
      .limit(1);

    if (!membership) {
      return NextResponse.json({ error: "No team found" }, { status: 404 });
    }

    const [account] = await db
      .select()
      .from(platformAccount)
      .where(
        and(
          eq(platformAccount.id, accountId),
          eq(platformAccount.teamId, membership.teamId),
        ),
      )
      .limit(1);

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (!account.refreshTokenEnc) {
      return NextResponse.json({ error: "No refresh token available" }, { status: 400 });
    }

    const encryptionKey = process.env.ENCRYPTION_KEY!;
    const adapter = getPlatformAdapter(platform as Platform);
    const refreshToken = decryptToken(account.refreshTokenEnc, encryptionKey);
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
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(platformAccount.id, accountId));

    return NextResponse.json({ data: { refreshed: true } });
  } catch (err) {
    console.error("Manual token refresh error:", err);
    const message = err instanceof Error ? err.message : "Refresh failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
