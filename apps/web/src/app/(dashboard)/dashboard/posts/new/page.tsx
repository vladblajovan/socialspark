import { getDb } from "@/lib/db";
import { getSessionOrThrow, getUserTeam } from "@/lib/session";
import { platformAccount, eq, and } from "@socialspark/db";
import { PostComposer } from "@/components/composer/post-composer";

export default async function NewPostPage() {
  const session = await getSessionOrThrow();
  const team = await getUserTeam(session.user.id);
  const db = getDb();

  const accounts = await db
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
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Post</h1>
        <p className="text-muted-foreground">
          Compose your post and select which platforms to publish to.
        </p>
      </div>
      <PostComposer accounts={accounts} />
    </div>
  );
}
