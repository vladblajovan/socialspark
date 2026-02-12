import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionOrThrow, getUserTeam } from "@/lib/session";
import { apiSuccess, apiError } from "@/lib/api-response";
import {
  post,
  postPlatform,
  postMedia,
  platformAccount,
  eq,
  and,
  desc,
  ilike,
  count,
  sql,
} from "@socialspark/db";
import {
  createPostSchema,
  listPostsQuerySchema,
} from "@socialspark/shared";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionOrThrow();
    const team = await getUserTeam(session.user.id);
    const db = getDb();

    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = listPostsQuerySchema.safeParse(params);
    if (!parsed.success) {
      return apiError("Invalid query parameters", 400);
    }

    const { status, page, limit, search } = parsed.data;
    const offset = (page - 1) * limit;

    const conditions = [eq(post.teamId, team.teamId)];
    if (status) conditions.push(eq(post.status, status));
    if (search) conditions.push(ilike(post.content, `%${search}%`));

    const where = and(...conditions);

    const [posts, [{ total }]] = await Promise.all([
      db
        .select()
        .from(post)
        .where(where)
        .orderBy(desc(post.updatedAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(post).where(where),
    ]);

    // Fetch platform targets for each post
    const postIds = posts.map((p) => p.id);
    let platforms: (typeof postPlatform.$inferSelect & {
      account: typeof platformAccount.$inferSelect | null;
    })[] = [];

    if (postIds.length > 0) {
      platforms = await db
        .select({
          id: postPlatform.id,
          postId: postPlatform.postId,
          platformAccountId: postPlatform.platformAccountId,
          content: postPlatform.content,
          hashtags: postPlatform.hashtags,
          status: postPlatform.status,
          platformPostId: postPlatform.platformPostId,
          platformPostUrl: postPlatform.platformPostUrl,
          errorMessage: postPlatform.errorMessage,
          retryCount: postPlatform.retryCount,
          maxRetries: postPlatform.maxRetries,
          lastRetryAt: postPlatform.lastRetryAt,
          metadata: postPlatform.metadata,
          publishedAt: postPlatform.publishedAt,
          createdAt: postPlatform.createdAt,
          updatedAt: postPlatform.updatedAt,
          account: platformAccount,
        })
        .from(postPlatform)
        .leftJoin(
          platformAccount,
          eq(postPlatform.platformAccountId, platformAccount.id)
        )
        .where(
          sql`${postPlatform.postId} IN ${postIds}`
        );
    }

    const postsWithPlatforms = posts.map((p) => ({
      ...p,
      platforms: platforms
        .filter((pp) => pp.postId === p.id)
        .map((pp) => ({
          ...pp,
          account: pp.account
            ? {
                id: pp.account.id,
                platform: pp.account.platform,
                platformUsername: pp.account.platformUsername,
                platformDisplayName: pp.account.platformDisplayName,
                platformAvatarUrl: pp.account.platformAvatarUrl,
              }
            : null,
        })),
    }));

    return apiSuccess(postsWithPlatforms, { page, limit, total });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("GET /api/v1/posts error:", err);
    return apiError("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionOrThrow();
    const team = await getUserTeam(session.user.id);
    const db = getDb();

    const body = await request.json();
    const parsed = createPostSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, 400);
    }

    const { content, contentHtml, platformAccountIds, scheduledAt, tags, mediaIds } =
      parsed.data;

    // Verify all platform accounts belong to this team
    const accounts = await db
      .select()
      .from(platformAccount)
      .where(
        and(
          eq(platformAccount.teamId, team.teamId),
          sql`${platformAccount.id} IN ${platformAccountIds}`
        )
      );

    if (accounts.length !== platformAccountIds.length) {
      return apiError("One or more platform accounts not found", 400);
    }

    // Create post
    const [newPost] = await db
      .insert(post)
      .values({
        teamId: team.teamId,
        createdBy: session.user.id,
        content,
        contentHtml,
        status: "draft",
        scheduledAt,
        tags: tags ?? [],
      })
      .returning();

    // Create platform targets
    if (platformAccountIds.length > 0) {
      await db.insert(postPlatform).values(
        platformAccountIds.map((accountId) => ({
          postId: newPost.id,
          platformAccountId: accountId,
        }))
      );
    }

    // Link media
    if (mediaIds && mediaIds.length > 0) {
      await db.insert(postMedia).values(
        mediaIds.map((mediaId, i) => ({
          postId: newPost.id,
          mediaId,
          position: i,
        }))
      );
    }

    // Fetch complete post with platforms
    const platforms = await db
      .select()
      .from(postPlatform)
      .where(eq(postPlatform.postId, newPost.id));

    return apiSuccess({ ...newPost, platforms }, undefined, 201);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("POST /api/v1/posts error:", err);
    return apiError("Internal server error", 500);
  }
}
