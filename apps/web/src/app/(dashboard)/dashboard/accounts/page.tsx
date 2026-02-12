export default function AccountsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
        <p className="text-muted-foreground">
          Connect and manage your social media accounts.
        </p>
      </div>
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        <p className="text-lg font-medium">No accounts connected</p>
        <p className="mt-1">Connect your first social media account to start posting.</p>
      </div>
    </div>
  );
}
