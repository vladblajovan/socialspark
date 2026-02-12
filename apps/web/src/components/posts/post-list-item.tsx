"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlatformIcon } from "@/components/platforms/platform-icons";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  RefreshCw,
  CalendarX,
  Loader2,
} from "lucide-react";
import type { Platform, PostStatus } from "@socialspark/shared";
import { usePostMutations } from "@/hooks/use-post-mutations";
const STATUS_VARIANT: Record<PostStatus, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  pending_approval: "outline",
  changes_requested: "outline",
  approved: "default",
  scheduled: "default",
  publishing: "default",
  published: "default",
  partially_published: "outline",
  failed: "destructive",
};

const STATUS_LABELS: Record<PostStatus, string> = {
  draft: "Draft",
  pending_approval: "Pending",
  changes_requested: "Changes Req.",
  approved: "Approved",
  scheduled: "Scheduled",
  publishing: "Publishing",
  published: "Published",
  partially_published: "Partial",
  failed: "Failed",
};

interface PostListItemProps {
  post: {
    id: string;
    content: string | null;
    status: string;
    scheduledAt: Date | string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    platforms: {
      account: {
        id: string;
        platform: string;
        platformUsername: string | null;
        platformDisplayName: string | null;
        platformAvatarUrl: string | null;
      } | null;
    }[];
  };
}

export function PostListItem({ post }: PostListItemProps) {
  const { deletePost, publishNow, updatePost, loading } = usePostMutations();

  const status = post.status as PostStatus;
  const truncated =
    post.content && post.content.length > 140
      ? post.content.slice(0, 140) + "..."
      : post.content || "No content";

  const platforms = post.platforms
    .map((p) => p.account?.platform)
    .filter((p): p is string => !!p);
  const uniquePlatforms = [...new Set(platforms)];

  const handleDelete = async () => {
    if (!window.confirm("Delete this post?")) return;
    await deletePost(post.id);
    window.location.assign("/dashboard/posts");
  };

  const handleRetry = async () => {
    await publishNow(post.id);
    window.location.assign("/dashboard/posts");
  };

  const handleUnschedule = async () => {
    await updatePost(post.id, { status: "draft" });
    window.location.assign("/dashboard/posts");
  };

  const isPublishing = status === "publishing";
  const canRetry = status === "failed" || status === "partially_published";
  const canUnschedule = status === "scheduled";

  return (
    <div className="flex items-start gap-4 rounded-lg border bg-card p-4">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={STATUS_VARIANT[status]}>
            {isPublishing && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
            {STATUS_LABELS[status] ?? status}
          </Badge>
          <div className="flex items-center gap-1">
            {uniquePlatforms.map((p) => (
              <PlatformIcon
                key={p}
                platform={p as Platform}
                className="h-3.5 w-3.5 text-muted-foreground"
              />
            ))}
          </div>
        </div>
        <p className="text-sm">{truncated}</p>
        <p className="text-xs text-muted-foreground">
          {post.scheduledAt
            ? `Scheduled: ${new Date(post.scheduledAt).toLocaleString()}`
            : `Updated: ${new Date(post.updatedAt).toLocaleString()}`}
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/posts/${post.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </DropdownMenuItem>
          {canRetry && (
            <DropdownMenuItem onClick={handleRetry} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </DropdownMenuItem>
          )}
          {canUnschedule && (
            <DropdownMenuItem onClick={handleUnschedule} disabled={loading}>
              <CalendarX className="mr-2 h-4 w-4" />
              Unschedule
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
