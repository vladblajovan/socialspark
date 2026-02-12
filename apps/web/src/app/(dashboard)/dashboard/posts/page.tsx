import { Suspense } from "react";
import { getDb } from "@/lib/db";
import { getSessionOrThrow, getUserTeam } from "@/lib/session";
import {
  post,
  postPlatform,
  platformAccount,
  eq,
  and,
  desc,
  ilike,
  count,
  sql,
} from "@socialspark/db";
import { listPostsQuerySchema } from "@socialspark/shared";
import { PostListItem } from "@/components/posts/post-list-item";
import { PostsToolbar } from "@/components/posts/posts-toolbar";
import { EmptyPostsState } from "@/components/posts/empty-posts-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PostsPage({ searchParams }: Props) {
  const params = await searchParams;
  const session = await getSessionOrThrow();
  const team = await getUserTeam(session.user.id);
  const db = getDb();

  // Parse query params (flatten arrays to first value)
  const flat: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") flat[key] = value;
    else if (Array.isArray(value) && value[0]) flat[key] = value[0];
  }

  const parsed = listPostsQuerySchema.safeParse(flat);
  const { status, page, limit, search } = parsed.success
    ? parsed.data
    : { status: undefined, page: 1, limit: 20, search: undefined };

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

  // Fetch platforms for all posts
  const postIds = posts.map((p) => p.id);
  let platforms: {
    postId: string;
    account: {
      id: string;
      platform: string;
      platformUsername: string | null;
      platformDisplayName: string | null;
      platformAvatarUrl: string | null;
    } | null;
  }[] = [];

  if (postIds.length > 0) {
    platforms = await db
      .select({
        postId: postPlatform.postId,
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
      .where(sql`${postPlatform.postId} IN ${postIds}`);
  }

  const postsWithPlatforms = posts.map((p) => ({
    ...p,
    platforms: platforms.filter((pp) => pp.postId === p.id),
  }));

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Posts</h1>
        <p className="text-muted-foreground">
          Create, manage, and schedule your social media posts.
        </p>
      </div>

      <Suspense>
        <PostsToolbar />
      </Suspense>

      {postsWithPlatforms.length === 0 ? (
        <EmptyPostsState />
      ) : (
        <div className="space-y-3">
          {postsWithPlatforms.map((p) => (
            <PostListItem key={p.id} post={p} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" asChild disabled={page <= 1}>
            <Link
              href={`/dashboard/posts?${new URLSearchParams({
                ...(status ? { status } : {}),
                ...(search ? { search } : {}),
                page: String(page - 1),
              }).toString()}`}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            asChild
            disabled={page >= totalPages}
          >
            <Link
              href={`/dashboard/posts?${new URLSearchParams({
                ...(status ? { status } : {}),
                ...(search ? { search } : {}),
                page: String(page + 1),
              }).toString()}`}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
