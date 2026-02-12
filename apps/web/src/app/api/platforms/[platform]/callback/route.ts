import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { platformAccount } from "@socialspark/db";
import { encryptToken, getPlatformOAuthConfig } from "@socialspark/shared";
import type { Platform } from "@socialspark/shared";
import { getPlatformAdapter } from "@/lib/platforms";
import { verifyOAuthState } from "@/lib/platforms/oauth-state";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;
  const baseUrl = process.env.BETTER_AUTH_URL!;

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL(`/dashboard/accounts?error=${encodeURIComponent(error)}`, baseUrl),
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/dashboard/accounts?error=missing_params", baseUrl),
      );
    }

    const csrfCookie = request.cookies.get("oauth_csrf")?.value;
    if (!csrfCookie) {
      return NextResponse.redirect(
        new URL("/dashboard/accounts?error=missing_csrf", baseUrl),
      );
    }

    const { teamId } = verifyOAuthState(state, csrfCookie, process.env.BETTER_AUTH_SECRET!);

    const config = getPlatformOAuthConfig(platform as Platform);
    if (!config) {
      return NextResponse.redirect(
        new URL("/dashboard/accounts?error=unsupported_platform", baseUrl),
      );
    }

    const adapter = getPlatformAdapter(platform as Platform);
    const redirectUri = `${baseUrl}/api/platforms/${platform}/callback`;
    const codeVerifier = request.cookies.get("oauth_code_verifier")?.value;

    const tokens = await adapter.exchangeCodeForTokens(code, redirectUri, codeVerifier);
    const userInfo = await adapter.fetchUserInfo(tokens.accessToken);

    const encryptionKey = process.env.ENCRYPTION_KEY!;
    const accessTokenEnc = encryptToken(tokens.accessToken, encryptionKey);
    const refreshTokenEnc = tokens.refreshToken
      ? encryptToken(tokens.refreshToken, encryptionKey)
      : null;

    const tokenExpiresAt = tokens.expiresIn
      ? new Date(Date.now() + tokens.expiresIn * 1000)
      : null;

    const db = getDb();
    await db
      .insert(platformAccount)
      .values({
        teamId,
        platform,
        platformUserId: userInfo.platformUserId,
        platformUsername: userInfo.platformUsername,
        platformDisplayName: userInfo.platformDisplayName,
        platformAvatarUrl: userInfo.platformAvatarUrl,
        accessTokenEnc,
        refreshTokenEnc,
        tokenExpiresAt,
        scopes: tokens.scope ? tokens.scope.split(" ") : config.scopes,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: [platformAccount.teamId, platformAccount.platform, platformAccount.platformUserId],
        set: {
          platformUsername: userInfo.platformUsername,
          platformDisplayName: userInfo.platformDisplayName,
          platformAvatarUrl: userInfo.platformAvatarUrl,
          accessTokenEnc,
          refreshTokenEnc,
          tokenExpiresAt,
          scopes: tokens.scope ? tokens.scope.split(" ") : config.scopes,
          isActive: true,
          updatedAt: new Date(),
        },
      });

    const response = NextResponse.redirect(
      new URL(`/dashboard/accounts?connected=${platform}`, baseUrl),
    );

    response.cookies.delete("oauth_csrf");
    response.cookies.delete("oauth_code_verifier");

    return response;
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/dashboard/accounts?error=callback_failed", baseUrl),
    );
  }
}
