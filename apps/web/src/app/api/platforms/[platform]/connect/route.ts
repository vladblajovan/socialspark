import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { teamMember, eq } from "@socialspark/db";
import { getPlatformOAuthConfig } from "@socialspark/shared";
import type { Platform } from "@socialspark/shared";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateOAuthState,
} from "@/lib/platforms/oauth-state";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  try {
    const { platform } = await params;
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.redirect(new URL("/sign-in", process.env.BETTER_AUTH_URL));
    }

    const db = getDb();
    const [membership] = await db
      .select()
      .from(teamMember)
      .where(eq(teamMember.userId, session.user.id))
      .limit(1);

    if (!membership) {
      return NextResponse.redirect(
        new URL("/dashboard/accounts?error=no_team", process.env.BETTER_AUTH_URL),
      );
    }

    const config = getPlatformOAuthConfig(platform as Platform);
    if (!config || config.flowType === "credentials") {
      return NextResponse.redirect(
        new URL("/dashboard/accounts?error=unsupported_platform", process.env.BETTER_AUTH_URL),
      );
    }

    const clientId = config.clientIdEnvKey
      ? process.env[config.clientIdEnvKey]
      : undefined;

    if (!clientId) {
      return NextResponse.redirect(
        new URL("/dashboard/accounts?error=platform_not_configured", process.env.BETTER_AUTH_URL),
      );
    }

    const { state, csrf } = generateOAuthState(
      membership.teamId,
      process.env.BETTER_AUTH_SECRET!,
    );

    const redirectUri = `${process.env.BETTER_AUTH_URL}/api/platforms/${platform}/callback`;

    const authUrl = new URL(config.authorizeUrl!);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", config.scopes.join(" "));
    authUrl.searchParams.set("state", state);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 600,
      path: "/",
    };

    // Add PKCE params before building the redirect
    let codeVerifier: string | undefined;
    if (config.flowType === "oauth2-pkce") {
      codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      authUrl.searchParams.set("code_challenge", codeChallenge);
      authUrl.searchParams.set("code_challenge_method", "S256");
    }

    const response = NextResponse.redirect(authUrl.toString());
    response.cookies.set("oauth_csrf", csrf, cookieOptions);

    if (codeVerifier) {
      response.cookies.set("oauth_code_verifier", codeVerifier, cookieOptions);
    }

    return response;
  } catch (error) {
    console.error("OAuth connect error:", error);
    return NextResponse.redirect(
      new URL("/dashboard/accounts?error=connect_failed", process.env.BETTER_AUTH_URL),
    );
  }
}
