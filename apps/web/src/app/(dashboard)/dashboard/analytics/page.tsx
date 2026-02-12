export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Track the performance of your posts across platforms.
        </p>
      </div>
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        <p className="text-lg font-medium">No data yet</p>
        <p className="mt-1">Analytics will appear once you start publishing.</p>
      </div>
    </div>
  );
}
