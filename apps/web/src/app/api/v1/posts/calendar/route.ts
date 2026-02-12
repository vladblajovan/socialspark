import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionOrThrow, getUserTeam } from "@/lib/session";
import { apiSuccess, apiError } from "@/lib/api-response";
import {
  post,
  postPlatform,
  platformAccount,
  eq,
  and,
  sql,
} from "@socialspark/db";
import { calendarPostsQuerySchema } from "@socialspark/shared";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionOrThrow();
    const team = await getUserTeam(session.user.id);
    const db = getDb();

    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = calendarPostsQuerySchema.safeParse(params);
    if (!parsed.success) {
      return apiError("Invalid query parameters: from and to are required ISO dates", 400);
    }

    const fromDate = new Date(parsed.data.from);
    const toDate = new Date(parsed.data.to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return apiError("Invalid date format for from/to parameters", 400);
    }

    // Fetch posts that have a scheduledAt within the date range (exclude drafts)
    const posts = await db
      .select({
        id: post.id,
        content: post.content,
        status: post.status,
        scheduledAt: post.scheduledAt,
      })
      .from(post)
      .where(
        and(
          eq(post.teamId, team.teamId),
          sql`${post.scheduledAt} IS NOT NULL`,
          sql`${post.scheduledAt} >= ${fromDate.toISOString()}`,
          sql`${post.scheduledAt} < ${toDate.toISOString()}`,
          sql`${post.status} != 'draft'`
        )
      )
      .orderBy(post.scheduledAt);

    // Fetch platform info for these posts
    const postIds = posts.map((p) => p.id);
    let platforms: { postId: string; platform: string }[] = [];

    if (postIds.length > 0) {
      platforms = await db
        .select({
          postId: postPlatform.postId,
          platform: platformAccount.platform,
        })
        .from(postPlatform)
        .innerJoin(
          platformAccount,
          eq(postPlatform.platformAccountId, platformAccount.id)
        )
        .where(sql`${postPlatform.postId} IN ${postIds}`);
    }

    const postsWithPlatforms = posts.map((p) => ({
      id: p.id,
      content: p.content ? p.content.slice(0, 100) : "",
      status: p.status,
      scheduledAt: p.scheduledAt,
      platforms: [...new Set(
        platforms
          .filter((pp) => pp.postId === p.id)
          .map((pp) => pp.platform)
      )],
    }));

    return apiSuccess(postsWithPlatforms);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("GET /api/v1/posts/calendar error:", err);
    return apiError("Internal server error", 500);
  }
}
