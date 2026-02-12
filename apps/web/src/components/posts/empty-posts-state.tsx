import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export function EmptyPostsState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-12 text-center">
      <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium">No posts yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Create your first post to get started.
      </p>
      <Button asChild className="mt-4">
        <Link href="/dashboard/posts/new">Create Post</Link>
      </Button>
    </div>
  );
}
