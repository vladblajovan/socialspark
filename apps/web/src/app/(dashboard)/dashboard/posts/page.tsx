export default function PostsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Posts</h1>
        <p className="text-muted-foreground">
          Create, manage, and schedule your social media posts.
        </p>
      </div>
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        <p className="text-lg font-medium">No posts yet</p>
        <p className="mt-1">Create your first post to get started.</p>
      </div>
    </div>
  );
}
