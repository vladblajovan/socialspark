"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { PlatformIcon } from "@/components/platforms/platform-icons";
import type { Platform, PostStatus } from "@socialspark/shared";
import type { CalendarPost } from "@/hooks/use-calendar-posts";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<PostStatus, { bg: string; border: string; text: string; dot: string }> = {
  draft: { bg: "#f4f4f5", border: "#d4d4d8", text: "#52525b", dot: "#a1a1aa" },
  pending_approval: { bg: "#fffbeb", border: "#fde68a", text: "#b45309", dot: "#fbbf24" },
  changes_requested: { bg: "#fff7ed", border: "#fed7aa", text: "#c2410c", dot: "#fb923c" },
  approved: { bg: "#f0f9ff", border: "#bae6fd", text: "#0369a1", dot: "#38bdf8" },
  scheduled: { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", dot: "#3b82f6" },
  publishing: { bg: "#eef2ff", border: "#c7d2fe", text: "#4338ca", dot: "#6366f1" },
  published: { bg: "#ecfdf5", border: "#a7f3d0", text: "#047857", dot: "#10b981" },
  partially_published: { bg: "#fff7ed", border: "#fed7aa", text: "#c2410c", dot: "#fb923c" },
  failed: { bg: "#fef2f2", border: "#fecaca", text: "#b91c1c", dot: "#ef4444" },
};

interface CalendarPostPillProps {
  post: CalendarPost;
  compact?: boolean;
}

export function CalendarPostPill({ post, compact = false }: CalendarPostPillProps) {
  const router = useRouter();
  const status = post.status as PostStatus;
  const styles = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
  const time = format(new Date(post.scheduledAt), "h:mm a");
  const maxLen = compact ? 18 : 35;
  const truncated = post.content
    ? post.content.slice(0, maxLen) + (post.content.length > maxLen ? "..." : "")
    : "No content";

  return (
    <div
      draggable="true"
      onDragStart={(e) => {
        e.dataTransfer.setData("application/calendar-post-id", post.id);
        e.dataTransfer.setData("application/calendar-post-date", post.scheduledAt);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={(e) => {
        e.stopPropagation();
        router.push(`/dashboard/posts/${post.id}/edit`);
      }}
      className={cn(
        "group flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] leading-tight cursor-grab active:cursor-grabbing transition-all",
        "hover:shadow-sm active:scale-[0.98]",
      )}
      style={{
        backgroundColor: styles.bg,
        borderColor: styles.border,
        color: styles.text,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full shrink-0"
        style={{ backgroundColor: styles.dot }}
      />
      {!compact && (
        <span className="font-medium shrink-0 tabular-nums">{time}</span>
      )}
      <span className="truncate flex-1 min-w-0 opacity-80">{truncated}</span>
      {post.platforms.length > 0 && (
        <div className="flex items-center gap-0.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
          {post.platforms.slice(0, compact ? 2 : 3).map((p) => (
            <PlatformIcon key={p} platform={p as Platform} className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} />
          ))}
        </div>
      )}
    </div>
  );
}
