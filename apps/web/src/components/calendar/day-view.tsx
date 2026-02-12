"use client";

import { format, isToday } from "date-fns";
import Link from "next/link";
import { Plus, Clock, ExternalLink } from "lucide-react";
import { PlatformIcon } from "@/components/platforms/platform-icons";
import type { Platform, PostStatus } from "@socialspark/shared";
import type { CalendarPost } from "@/hooks/use-calendar-posts";

const STATUS_STYLES: Record<PostStatus, { bg: string; border: string; text: string; label: string }> = {
  draft: { bg: "#f4f4f5", border: "#d4d4d8", text: "#52525b", label: "Draft" },
  pending_approval: { bg: "#fffbeb", border: "#fde68a", text: "#b45309", label: "Pending" },
  changes_requested: { bg: "#fff7ed", border: "#fed7aa", text: "#c2410c", label: "Changes Req." },
  approved: { bg: "#f0f9ff", border: "#bae6fd", text: "#0369a1", label: "Approved" },
  scheduled: { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", label: "Scheduled" },
  publishing: { bg: "#eef2ff", border: "#c7d2fe", text: "#4338ca", label: "Publishing" },
  published: { bg: "#ecfdf5", border: "#a7f3d0", text: "#047857", label: "Published" },
  partially_published: { bg: "#fff7ed", border: "#fed7aa", text: "#c2410c", label: "Partial" },
  failed: { bg: "#fef2f2", border: "#fecaca", text: "#b91c1c", label: "Failed" },
};

interface DayViewProps {
  currentDate: Date;
  postsByDate: Record<string, CalendarPost[]>;
}

export function DayView({ currentDate, postsByDate }: DayViewProps) {
  const key = format(currentDate, "yyyy-MM-dd");
  const dayPosts = postsByDate[key] ?? [];
  const today = isToday(currentDate);

  const sorted = [...dayPosts].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Day header */}
      <div
        className="border-b"
        style={{
          padding: "16px 24px",
          ...(today ? { backgroundColor: "rgba(239,68,68,0.03)", borderColor: "rgba(239,68,68,0.15)" } : {}),
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {today && (
              <div
                className="flex items-center justify-center rounded-full font-bold text-xl"
                style={{ width: "44px", height: "44px", backgroundColor: "#ef4444", color: "#fff", boxShadow: "0 1px 3px rgba(239,68,68,0.4)" }}
              >
                {format(currentDate, "d")}
              </div>
            )}
            <div>
              <h3 className="text-base font-semibold">
                {format(currentDate, "EEEE, MMMM d, yyyy")}
                {today && (
                  <span
                    className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold align-middle"
                    style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444" }}
                  >
                    Today
                  </span>
                )}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {sorted.length} {sorted.length === 1 ? "post" : "posts"} scheduled
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/posts/new"
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New Post
          </Link>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-muted-foreground" style={{ padding: "64px 24px" }}>
          <div className="rounded-full bg-muted p-3 mb-3">
            <Clock className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium">No posts scheduled</p>
          <p className="text-xs mt-1">
            <Link href="/dashboard/posts/new" className="hover:underline" style={{ color: "#ef4444" }}>
              Create a post
            </Link>{" "}
            to get started.
          </p>
        </div>
      ) : (
        <div className="divide-y">
          {sorted.map((p) => {
            const status = p.status as PostStatus;
            const styles = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
            const time = format(new Date(p.scheduledAt), "h:mm a");
            const content = p.content || "No content";

            return (
              <Link
                key={p.id}
                href={`/dashboard/posts/${p.id}/edit`}
                className="group flex items-center gap-4 hover:bg-accent/40 transition-colors"
                style={{ padding: "16px 24px" }}
              >
                {/* Time column */}
                <div className="flex flex-col items-center gap-1.5" style={{ minWidth: "60px" }}>
                  <span className="text-sm font-medium tabular-nums text-foreground">{time}</span>
                </div>

                {/* Status badge */}
                <span
                  className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium shrink-0"
                  style={{ backgroundColor: styles.bg, borderColor: styles.border, color: styles.text }}
                >
                  {styles.label}
                </span>

                {/* Platform icons */}
                <div className="flex items-center gap-1 shrink-0">
                  {p.platforms.map((pl) => (
                    <PlatformIcon
                      key={pl}
                      platform={pl as Platform}
                      className="h-4 w-4 text-muted-foreground"
                    />
                  ))}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground/80 line-clamp-2">{content}</p>
                </div>

                {/* Edit arrow */}
                <ExternalLink className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
