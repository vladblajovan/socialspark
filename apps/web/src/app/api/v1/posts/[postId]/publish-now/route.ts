import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionOrThrow, getUserTeam } from "@/lib/session";
import { apiSuccess, apiError } from "@/lib/api-response";
import { post, postPlatform, eq, and } from "@socialspark/db";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ postId: string }> };

const PUBLISHABLE_STATUSES = [
  "draft",
  "approved",
  "changes_requested",
  "failed",
  "partially_published",
];

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { postId } = await params;
    const session = await getSessionOrThrow();
    const team = await getUserTeam(session.user.id);
    const db = getDb();

    const [found] = await db
      .select()
      .from(post)
      .where(and(eq(post.id, postId), eq(post.teamId, team.teamId)))
      .limit(1);

    if (!found) return apiError("Post not found", 404);

    if (!PUBLISHABLE_STATUSES.includes(found.status)) {
      return apiError(
        `Post cannot be published from "${found.status}" status`,
        400,
      );
    }

    if (!found.content?.trim()) {
      return apiError("Post must have content before publishing", 400);
    }

    // Verify post has platform targets
    const platforms = await db
      .select({ id: postPlatform.id })
      .from(postPlatform)
      .where(eq(postPlatform.postId, postId));

    if (platforms.length === 0) {
      return apiError("Post must have at least one platform target", 400);
    }

    // Set scheduledAt to now, status to scheduled — scheduler picks it up within 30s
    const [updated] = await db
      .update(post)
      .set({
        status: "scheduled",
        scheduledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(post.id, postId))
      .returning();

    // Reset all postPlatform statuses to pending
    await db
      .update(postPlatform)
      .set({
        status: "pending",
        errorMessage: null,
        retryCount: 0,
        updatedAt: new Date(),
      })
      .where(eq(postPlatform.postId, postId));

    return apiSuccess(updated);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("POST /api/v1/posts/[postId]/publish-now error:", err);
    return apiError("Internal server error", 500);
  }
}
