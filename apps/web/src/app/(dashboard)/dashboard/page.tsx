import { getDb } from "@/lib/db";
import { getSessionOrThrow, getUserTeam } from "@/lib/session";
import { post, platformAccount, eq, and, count, sql } from "@socialspark/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSessionOrThrow();
  const team = await getUserTeam(session.user.id);
  const db = getDb();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [scheduledRows, publishedRows, accountRows] = await Promise.all([
    db
      .select({ total: count() })
      .from(post)
      .where(and(eq(post.teamId, team.teamId), eq(post.status, "scheduled"))),
    db
      .select({ total: count() })
      .from(post)
      .where(
        and(
          eq(post.teamId, team.teamId),
          eq(post.status, "published"),
          sql`${post.publishedAt} >= ${startOfMonth.toISOString()}`,
        ),
      ),
    db
      .select({ total: count() })
      .from(platformAccount)
      .where(
        and(
          eq(platformAccount.teamId, team.teamId),
          eq(platformAccount.isActive, true),
        ),
      ),
  ]);

  const scheduled = scheduledRows[0].total;
  const published = publishedRows[0].total;
  const accounts = accountRows[0].total;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {session.user.name?.split(" ")[0] ?? "there"}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your social media activity.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Scheduled Posts" value={String(scheduled)} description="Posts ready to publish" />
        <StatCard title="Published" value={String(published)} description="Posts published this month" />
        <StatCard title="Connected Accounts" value={String(accounts)} description="Active platform connections" />
        <StatCard title="AI Generations" value="0" description="Remaining this month" />
      </div>

      {scheduled === 0 && published === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          <p className="text-lg font-medium">No posts yet</p>
          <p className="mt-1">
            <Link href="/dashboard/posts/new" className="text-primary underline">
              Create your first post
            </Link>{" "}
            to get started.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
