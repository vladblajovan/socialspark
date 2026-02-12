import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { teamMember, platformAccount, eq, and } from "@socialspark/db";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ platform: string; accountId: string }> },
) {
  try {
    const { accountId } = await params;
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

    await db
      .delete(platformAccount)
      .where(eq(platformAccount.id, accountId));

    return NextResponse.json({ data: { deleted: true } });
  } catch (err) {
    console.error("Disconnect account error:", err);
    return NextResponse.json({ error: "Failed to disconnect account" }, { status: 500 });
  }
}
