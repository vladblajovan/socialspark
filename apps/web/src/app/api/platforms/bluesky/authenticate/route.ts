import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { teamMember, platformAccount, eq } from "@socialspark/db";
import { blueskyCredentialsSchema, encryptToken } from "@socialspark/shared";
import { BlueskyAdapter } from "@/lib/platforms/bluesky";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const parsed = blueskyCredentialsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid credentials", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const adapter = new BlueskyAdapter();
    const result = await adapter.authenticateWithCredentials(parsed.data);

    const encryptionKey = process.env.ENCRYPTION_KEY!;
    const accessTokenEnc = encryptToken(result.accessToken, encryptionKey);
    const refreshTokenEnc = result.refreshToken
      ? encryptToken(result.refreshToken, encryptionKey)
      : null;

    await db
      .insert(platformAccount)
      .values({
        teamId: membership.teamId,
        platform: "bluesky",
        platformUserId: result.platformUserId,
        platformUsername: result.platformUsername,
        platformDisplayName: result.platformDisplayName,
        platformAvatarUrl: result.platformAvatarUrl,
        accessTokenEnc,
        refreshTokenEnc,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: [platformAccount.teamId, platformAccount.platform, platformAccount.platformUserId],
        set: {
          platformUsername: result.platformUsername,
          platformDisplayName: result.platformDisplayName,
          platformAvatarUrl: result.platformAvatarUrl,
          accessTokenEnc,
          refreshTokenEnc,
          isActive: true,
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({
      data: {
        platform: "bluesky",
        platformUsername: result.platformUsername,
        platformDisplayName: result.platformDisplayName,
      },
    });
  } catch (err) {
    console.error("Bluesky auth error:", err);
    const message = err instanceof Error ? err.message : "Authentication failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
