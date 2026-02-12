import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionOrThrow, getUserTeam } from "@/lib/session";
import { apiSuccess, apiError } from "@/lib/api-response";
import {
  post,
  postPlatform,
  postMedia,
  media,
  platformAccount,
  eq,
  and,
  sql,
} from "@socialspark/db";
import { updatePostSchema } from "@socialspark/shared";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ postId: string }> };

async function getPostForTeam(postId: string, teamId: string) {
  const db = getDb();
  const [found] = await db
    .select()
    .from(post)
    .where(and(eq(post.id, postId), eq(post.teamId, teamId)))
    .limit(1);
  return found ?? null;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { postId } = await params;
    const session = await getSessionOrThrow();
    const team = await getUserTeam(session.user.id);
    const db = getDb();

    const found = await getPostForTeam(postId, team.teamId);
    if (!found) return apiError("Post not found", 404);

    // Fetch platforms with account info
    const platforms = await db
      .select({
        id: postPlatform.id,
        postId: postPlatform.postId,
        platformAccountId: postPlatform.platformAccountId,
        content: postPlatform.content,
        status: postPlatform.status,
        platformPostUrl: postPlatform.platformPostUrl,
        createdAt: postPlatform.createdAt,
        account: {
          id: platformAccount.id,
          platform: platformAccount.platform,
          platformUsername: platformAccount.platformUsername,
          platformDisplayName: platformAccount.platformDisplayName,
          platformAvatarUrl: platformAccount.platformAvatarUrl,
        },
      })
      .from(postPlatform)
      .leftJoin(
        platformAccount,
        eq(postPlatform.platformAccountId, platformAccount.id)
      )
      .where(eq(postPlatform.postId, postId));

    // Fetch media
    const mediaItems = await db
      .select({
        id: media.id,
        fileName: media.fileName,
        fileSize: media.fileSize,
        mimeType: media.mimeType,
        width: media.width,
        height: media.height,
        storageUrl: media.storageUrl,
        thumbnailUrl: media.thumbnailUrl,
        altText: media.altText,
        position: postMedia.position,
      })
      .from(postMedia)
      .innerJoin(media, eq(postMedia.mediaId, media.id))
      .where(eq(postMedia.postId, postId))
      .orderBy(postMedia.position);

    return apiSuccess({ ...found, platforms, media: mediaItems });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("GET /api/v1/posts/[postId] error:", err);
    return apiError("Internal server error", 500);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { postId } = await params;
    const session = await getSessionOrThrow();
    const team = await getUserTeam(session.user.id);
    const db = getDb();

    const found = await getPostForTeam(postId, team.teamId);
    if (!found) return apiError("Post not found", 404);

    // Only draft and changes_requested posts can be edited
    if (found.status !== "draft" && found.status !== "changes_requested") {
      return apiError("Post cannot be edited in its current status", 400);
    }

    const body = await request.json();
    const parsed = updatePostSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, 400);
    }

    const { platformAccountIds, mediaIds, ...updates } = parsed.data;

    // Update post fields
    const updateFields: Record<string, unknown> = { updatedAt: new Date() };
    if (updates.content !== undefined) updateFields.content = updates.content;
    if (updates.contentHtml !== undefined) updateFields.contentHtml = updates.contentHtml;
    if (updates.scheduledAt !== undefined) updateFields.scheduledAt = updates.scheduledAt;
    if (updates.tags !== undefined) updateFields.tags = updates.tags;
    if (updates.status !== undefined) updateFields.status = updates.status;

    const [updated] = await db
      .update(post)
      .set(updateFields)
      .where(eq(post.id, postId))
      .returning();

    // Update platform targets if provided
    if (platformAccountIds) {
      // Verify accounts belong to team
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

      // Delete existing and re-create
      await db
        .delete(postPlatform)
        .where(eq(postPlatform.postId, postId));

      if (platformAccountIds.length > 0) {
        await db.insert(postPlatform).values(
          platformAccountIds.map((accountId) => ({
            postId,
            platformAccountId: accountId,
          }))
        );
      }
    }

    // Update media links if provided
    if (mediaIds) {
      await db.delete(postMedia).where(eq(postMedia.postId, postId));

      if (mediaIds.length > 0) {
        await db.insert(postMedia).values(
          mediaIds.map((mediaId, i) => ({
            postId,
            mediaId,
            position: i,
          }))
        );
      }
    }

    return apiSuccess(updated);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("PATCH /api/v1/posts/[postId] error:", err);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { postId } = await params;
    const session = await getSessionOrThrow();
    const team = await getUserTeam(session.user.id);
    const db = getDb();

    const found = await getPostForTeam(postId, team.teamId);
    if (!found) return apiError("Post not found", 404);

    await db.delete(post).where(eq(post.id, postId));

    return apiSuccess({ deleted: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("DELETE /api/v1/posts/[postId] error:", err);
    return apiError("Internal server error", 500);
  }
}
