"use client";

import { useSession } from "@/lib/auth-client";

export default function DashboardPage() {
  const session = useSession();
  const user = session.data?.user;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {user?.name ? `Welcome back, ${user.name.split(" ")[0]}` : "Dashboard"}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your social media activity.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Scheduled Posts" value="0" description="Posts ready to publish" />
        <StatCard title="Published" value="0" description="Posts published this month" />
        <StatCard title="Connected Accounts" value="0" description="Active platform connections" />
        <StatCard title="AI Generations" value="0" description="Remaining this month" />
      </div>

      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        <p className="text-lg font-medium">No posts yet</p>
        <p className="mt-1">Create your first post to get started.</p>
      </div>
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
