import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { teamMember, platformAccount, eq } from "@socialspark/db";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConnectPlatformDialog } from "@/components/platforms/connect-platform-dialog";
import { PlatformAccountCard } from "@/components/platforms/platform-account-card";
import { PLATFORM_LABELS, type Platform } from "@socialspark/shared";
import { CheckCircle2, AlertCircle, Unplug } from "lucide-react";

export const dynamic = "force-dynamic";

interface AccountsPageProps {
  searchParams: Promise<{ connected?: string; error?: string }>;
}

export default async function AccountsPage({ searchParams }: AccountsPageProps) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in");
  }

  const db = getDb();
  const [membership] = await db
    .select()
    .from(teamMember)
    .where(eq(teamMember.userId, session.user.id))
    .limit(1);

  if (!membership) {
    redirect("/sign-in");
  }

  const accounts = await db
    .select({
      id: platformAccount.id,
      platform: platformAccount.platform,
      platformUsername: platformAccount.platformUsername,
      platformDisplayName: platformAccount.platformDisplayName,
      platformAvatarUrl: platformAccount.platformAvatarUrl,
      tokenExpiresAt: platformAccount.tokenExpiresAt,
      isActive: platformAccount.isActive,
      createdAt: platformAccount.createdAt,
      lastSyncedAt: platformAccount.lastSyncedAt,
    })
    .from(platformAccount)
    .where(eq(platformAccount.teamId, membership.teamId));

  const connectedPlatformUserIds = new Set(accounts.map((a) => a.platform));
  const { connected, error } = await searchParams;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground">
            Connect and manage your social media accounts.
          </p>
        </div>
        <ConnectPlatformDialog connectedPlatformUserIds={connectedPlatformUserIds} />
      </div>

      {connected && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Successfully connected {PLATFORM_LABELS[connected as Platform] ?? connected}!
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error === "callback_failed"
              ? "Failed to connect account. Please try again."
              : error === "platform_not_configured"
                ? "This platform is not configured yet."
                : `Connection error: ${error}`}
          </AlertDescription>
        </Alert>
      )}

      {accounts.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          <Unplug className="mx-auto h-10 w-10 mb-3 opacity-50" />
          <p className="text-lg font-medium">No accounts connected</p>
          <p className="mt-1">Connect your first social media account to start posting.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {accounts.map((account) => (
            <PlatformAccountCard
              key={account.id}
              account={{
                ...account,
                tokenExpiresAt: account.tokenExpiresAt?.toISOString() ?? null,
                createdAt: account.createdAt.toISOString(),
                lastSyncedAt: account.lastSyncedAt?.toISOString() ?? null,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
