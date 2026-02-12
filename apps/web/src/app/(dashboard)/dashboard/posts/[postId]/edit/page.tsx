import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { getSessionOrThrow, getUserTeam } from "@/lib/session";

export const dynamic = "force-dynamic";
import {
  post,
  postPlatform,
  postMedia,
  media,
  platformAccount,
  eq,
  and,
} from "@socialspark/db";
import { PostComposer } from "@/components/composer/post-composer";

interface Props {
  params: Promise<{ postId: string }>;
}

export default async function EditPostPage({ params }: Props) {
  const { postId } = await params;
  const session = await getSessionOrThrow();
  const team = await getUserTeam(session.user.id);
  const db = getDb();

  // Fetch post
  const [found] = await db
    .select()
    .from(post)
    .where(and(eq(post.id, postId), eq(post.teamId, team.teamId)))
    .limit(1);

  if (!found) notFound();

  // Fetch platform targets, media, and accounts in parallel
  const [platforms, mediaItems, accounts] = await Promise.all([
    db
      .select({ platformAccountId: postPlatform.platformAccountId })
      .from(postPlatform)
      .where(eq(postPlatform.postId, postId)),
    db
      .select({
        id: media.id,
        fileName: media.fileName,
        storageUrl: media.storageUrl,
        mimeType: media.mimeType,
        position: postMedia.position,
      })
      .from(postMedia)
      .innerJoin(media, eq(postMedia.mediaId, media.id))
      .where(eq(postMedia.postId, postId))
      .orderBy(postMedia.position),
    db
      .select({
        id: platformAccount.id,
        platform: platformAccount.platform,
        platformUsername: platformAccount.platformUsername,
        platformDisplayName: platformAccount.platformDisplayName,
        platformAvatarUrl: platformAccount.platformAvatarUrl,
      })
      .from(platformAccount)
      .where(
        and(
          eq(platformAccount.teamId, team.teamId),
          eq(platformAccount.isActive, true)
        )
      ),
  ]);

  const initialPost = {
    id: found.id,
    content: found.content,
    contentHtml: found.contentHtml,
    status: found.status,
    platforms,
    media: mediaItems,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Post</h1>
        <p className="text-muted-foreground">
          Update your post content and platform targets.
        </p>
      </div>
      <PostComposer accounts={accounts} initialPost={initialPost} />
    </div>
  );
}
