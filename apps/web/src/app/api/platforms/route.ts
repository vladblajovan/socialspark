import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { teamMember, platformAccount, eq } from "@socialspark/db";

export const dynamic = "force-dynamic";

export async function GET() {
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

    const accounts = await db
      .select({
        id: platformAccount.id,
        platform: platformAccount.platform,
        platformUserId: platformAccount.platformUserId,
        platformUsername: platformAccount.platformUsername,
        platformDisplayName: platformAccount.platformDisplayName,
        platformAvatarUrl: platformAccount.platformAvatarUrl,
        tokenExpiresAt: platformAccount.tokenExpiresAt,
        scopes: platformAccount.scopes,
        isActive: platformAccount.isActive,
        lastSyncedAt: platformAccount.lastSyncedAt,
        createdAt: platformAccount.createdAt,
      })
      .from(platformAccount)
      .where(eq(platformAccount.teamId, membership.teamId));

    return NextResponse.json({ data: accounts });
  } catch (err) {
    console.error("List accounts error:", err);
    return NextResponse.json({ error: "Failed to list accounts" }, { status: 500 });
  }
}
