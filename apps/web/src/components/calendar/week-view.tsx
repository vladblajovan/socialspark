"use client";

import { useState } from "react";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isToday,
} from "date-fns";
import { Plus } from "lucide-react";
import Link from "next/link";
import { CalendarPostPill } from "./calendar-post-pill";
import type { CalendarPost } from "@/hooks/use-calendar-posts";
import { cn } from "@/lib/utils";

interface WeekViewProps {
  currentDate: Date;
  postsByDate: Record<string, CalendarPost[]>;
  onDrop: (postId: string, newDate: Date, originalDate: string) => void;
}

export function WeekView({ currentDate, postsByDate, onDrop }: WeekViewProps) {
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  function handleDragOver(e: React.DragEvent, key: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverKey(key);
  }

  function handleDragLeave() {
    setDragOverKey(null);
  }

  function handleDropOnDay(e: React.DragEvent, date: Date) {
    e.preventDefault();
    setDragOverKey(null);
    const postId = e.dataTransfer.getData("application/calendar-post-id");
    const originalDate = e.dataTransfer.getData("application/calendar-post-date");
    if (postId) {
      onDrop(postId, date, originalDate);
    }
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div
        className="grid"
        style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}
      >
        {days.map((day, i) => {
          const key = format(day, "yyyy-MM-dd");
          const dayPosts = postsByDate[key] ?? [];
          const today = isToday(day);
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          const isDragOver = dragOverKey === key;

          // Sort by time
          const sorted = [...dayPosts].sort(
            (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
          );

          return (
            <div
              key={key}
              onDragOver={(e) => handleDragOver(e, key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDropOnDay(e, day)}
              className={cn(
                "group/col flex flex-col transition-colors",
                i > 0 && "border-l border-border/50",
                isWeekend && "bg-muted/10",
              )}
              style={{
                minHeight: "420px",
                ...(isDragOver ? { backgroundColor: "#eff6ff", boxShadow: "inset 0 0 0 2px #93c5fd" } : {}),
              }}
            >
              {/* Day header — fixed height container so today's circle doesn't shift layout */}
              <div
                className="sticky top-0 z-10 border-b px-3 text-center"
                style={{
                  backgroundColor: today ? "rgba(239,68,68,0.05)" : undefined,
                  borderColor: today ? "rgba(239,68,68,0.15)" : undefined,
                }}
              >
                <div className="flex flex-col items-center justify-center" style={{ height: "60px", gap: "0px" }}>
                  {!today ? (
                    <>
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" style={{ lineHeight: "1" }}>
                        {format(day, "EEE")}
                      </div>
                      <div
                        className="flex items-center justify-center rounded-full font-semibold text-lg"
                        style={{ width: "36px", height: "36px" }}
                      >
                        {format(day, "d")}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5">
                      <span
                        className="text-xs font-semibold uppercase tracking-wider"
                        style={{ color: "#ef4444" }}
                      >
                        {format(day, "EEE")}
                      </span>
                      <div
                        className="flex items-center justify-center rounded-full font-semibold text-lg"
                        style={{ width: "40px", height: "40px", backgroundColor: "#ef4444", color: "#fff", boxShadow: "0 1px 3px rgba(239,68,68,0.4)" }}
                      >
                        {format(day, "d")}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Posts list */}
              <div className="flex-1 px-3 pb-2 space-y-1.5" style={{ paddingTop: "16px" }}>
                {sorted.map((p) => (
                  <CalendarPostPill key={p.id} post={p} />
                ))}

                {sorted.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground/40 py-8">
                    <p className="text-xs">No posts</p>
                  </div>
                )}
              </div>

              {/* Add post button */}
              <div className="px-3 pb-3 pt-0">
                <Link
                  href="/dashboard/posts/new"
                  className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-transparent py-1.5 text-xs text-muted-foreground/0 group-hover/col:text-muted-foreground group-hover/col:border-border/60 hover:!text-foreground hover:!border-border hover:bg-accent/50 transition-all"
                >
                  <Plus className="h-3 w-3" />
                  Add post
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
