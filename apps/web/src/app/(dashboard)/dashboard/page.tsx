import { getDb } from "@/lib/db";
import { getSessionOrThrow, getUserTeam } from "@/lib/session";
import { post, platformAccount, eq, and, count, sql } from "@socialspark/db";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PenSquare, Calendar, Link as LinkIcon, Sparkles } from "lucide-react";

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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {session.user.name?.split(" ")[0] ?? "there"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Here&apos;s an overview of your social media activity.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Scheduled Posts"
          value={String(scheduled)}
          description="Posts ready to publish"
          icon={Calendar}
        />
        <StatCard
          title="Published"
          value={String(published)}
          description="Posts published this month"
          icon={PenSquare}
        />
        <StatCard
          title="Connected Accounts"
          value={String(accounts)}
          description="Active platform connections"
          icon={LinkIcon}
        />
        <StatCard
          title="AI Generations"
          value="0"
          description="Remaining this month"
          icon={Sparkles}
        />
      </div>

      {scheduled === 0 && published === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">No posts yet</CardTitle>
            <CardDescription className="text-base">
              Create your first post to start scheduling content across your
              social media platforms.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Button asChild size="lg">
              <Link href="/dashboard/posts/new">
                <PenSquare className="mr-2 size-4" />
                Create your first post
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}
