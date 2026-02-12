import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionOrThrow, getUserTeam } from "@/lib/session";
import { apiSuccess, apiError } from "@/lib/api-response";
import { post, postPlatform, eq, and } from "@socialspark/db";
import { schedulePostSchema } from "@socialspark/shared";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ postId: string }> };

const SCHEDULABLE_STATUSES = ["draft", "approved", "changes_requested", "scheduled", "failed", "partially_published"];

export async function POST(request: NextRequest, { params }: RouteParams) {
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

    if (!SCHEDULABLE_STATUSES.includes(found.status)) {
      return apiError(
        `Post cannot be scheduled from "${found.status}" status`,
        400,
      );
    }

    const body = await request.json();
    const parsed = schedulePostSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, 400);
    }

    // Must be at least 1 minute in the future
    const now = new Date();
    const minTime = new Date(now.getTime() - 60_000);
    if (parsed.data.scheduledAt < minTime) {
      return apiError("Scheduled time must be in the future", 400);
    }

    // Verify post has platform targets
    const platforms = await db
      .select({ id: postPlatform.id })
      .from(postPlatform)
      .where(eq(postPlatform.postId, postId));

    if (platforms.length === 0) {
      return apiError("Post must have at least one platform target", 400);
    }

    if (!found.content?.trim()) {
      return apiError("Post must have content before scheduling", 400);
    }

    // Update post to scheduled
    const [updated] = await db
      .update(post)
      .set({
        status: "scheduled",
        scheduledAt: parsed.data.scheduledAt,
        updatedAt: new Date(),
      })
      .where(eq(post.id, postId))
      .returning();

    // Reset all postPlatform statuses to pending (for re-scheduling failed posts)
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
    console.error("POST /api/v1/posts/[postId]/schedule error:", err);
    return apiError("Internal server error", 500);
  }
}
