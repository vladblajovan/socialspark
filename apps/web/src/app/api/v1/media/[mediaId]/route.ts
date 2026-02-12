import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionOrThrow, getUserTeam } from "@/lib/session";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getStorageAdapter } from "@/lib/storage";
import { media, eq, and } from "@socialspark/db";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ mediaId: string }> };

async function getMediaForTeam(mediaId: string, teamId: string) {
  const db = getDb();
  const [found] = await db
    .select()
    .from(media)
    .where(and(eq(media.id, mediaId), eq(media.teamId, teamId)))
    .limit(1);
  return found ?? null;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { mediaId } = await params;
    const session = await getSessionOrThrow();
    const team = await getUserTeam(session.user.id);
    const db = getDb();

    const found = await getMediaForTeam(mediaId, team.teamId);
    if (!found) return apiError("Media not found", 404);

    const body = await request.json();
    const altText = typeof body.altText === "string" ? body.altText : undefined;

    const [updated] = await db
      .update(media)
      .set({ altText })
      .where(eq(media.id, mediaId))
      .returning();

    return apiSuccess(updated);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("PATCH /api/v1/media/[mediaId] error:", err);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { mediaId } = await params;
    const session = await getSessionOrThrow();
    const team = await getUserTeam(session.user.id);
    const db = getDb();

    const found = await getMediaForTeam(mediaId, team.teamId);
    if (!found) return apiError("Media not found", 404);

    // Delete file from storage
    const storage = getStorageAdapter();
    await storage.delete(found.storageKey);

    // Delete DB record
    await db.delete(media).where(eq(media.id, mediaId));

    return apiSuccess({ deleted: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("DELETE /api/v1/media/[mediaId] error:", err);
    return apiError("Internal server error", 500);
  }
}
