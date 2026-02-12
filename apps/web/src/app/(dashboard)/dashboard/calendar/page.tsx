export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">
          View your scheduled posts on a calendar.
        </p>
      </div>
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        <p className="text-lg font-medium">Nothing scheduled</p>
        <p className="mt-1">Scheduled posts will appear here.</p>
      </div>
    </div>
  );
}
