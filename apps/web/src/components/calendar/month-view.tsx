"use client";

import { useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
} from "date-fns";
import { Plus } from "lucide-react";
import Link from "next/link";
import { CalendarPostPill } from "./calendar-post-pill";
import type { CalendarPost } from "@/hooks/use-calendar-posts";
import { cn } from "@/lib/utils";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface MonthViewProps {
  currentDate: Date;
  postsByDate: Record<string, CalendarPost[]>;
  onDrop: (postId: string, newDate: Date, originalDate: string) => void;
  onDayClick: (date: Date) => void;
}

export function MonthView({ currentDate, postsByDate, onDrop, onDayClick }: MonthViewProps) {
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weeks = Math.ceil(days.length / 7);

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
      {/* Day headers */}
      <div
        className="grid bg-muted/40"
        style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}
      >
        {DAY_NAMES.map((name, i) => (
          <div
            key={name}
            className={cn(
              "px-3 text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground",
              i > 0 && "border-l border-border/50",
            )}
            style={{ padding: "12px 12px" }}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
          gridTemplateRows: `repeat(${weeks}, minmax(120px, 1fr))`,
        }}
      >
        {days.map((day, i) => {
          const key = format(day, "yyyy-MM-dd");
          const dayPosts = postsByDate[key] ?? [];
          const inCurrentMonth = isSameMonth(day, currentDate);
          const today = isToday(day);
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          const maxVisible = 3;
          const overflow = dayPosts.length - maxVisible;
          const isDragOver = dragOverKey === key;

          return (
            <div
              key={key}
              onDragOver={(e) => handleDragOver(e, key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDropOnDay(e, day)}
              className={cn(
                "group/cell relative border-t p-1.5 transition-colors",
                i % 7 > 0 && "border-l",
                "border-border/50",
                !inCurrentMonth && "bg-muted/20",
                isWeekend && inCurrentMonth && "bg-muted/10",
              )}
              style={{
                ...(isDragOver ? { backgroundColor: "#eff6ff", boxShadow: "inset 0 0 0 2px #93c5fd" } : {}),
                ...(today ? { backgroundColor: "rgba(239,68,68,0.03)" } : {}),
              }}
            >
              {/* Day number + add button */}
              <div className="flex items-center justify-between mb-1 px-0.5">
                {today ? (
                  <button
                    onClick={() => onDayClick(day)}
                    className="flex items-center gap-1"
                  >
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: "#ef4444" }}
                    >
                      {format(day, "EEE")}
                    </span>
                    <span
                      className="flex items-center justify-center rounded-full text-sm font-semibold"
                      style={{ width: "28px", height: "28px", backgroundColor: "#ef4444", color: "#fff", boxShadow: "0 1px 3px rgba(239,68,68,0.4)" }}
                    >
                      {format(day, "d")}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => onDayClick(day)}
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-sm transition-colors",
                      inCurrentMonth ? "font-medium text-foreground hover:bg-accent" : "text-muted-foreground/50 hover:bg-accent",
                    )}
                  >
                    {format(day, "d")}
                  </button>
                )}
                {inCurrentMonth && (
                  <Link
                    href="/dashboard/posts/new"
                    className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground/0 group-hover/cell:text-muted-foreground hover:!text-foreground hover:bg-accent transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>

              {/* Posts */}
              <div className="space-y-0.5" style={{ marginTop: "4px" }}>
                {dayPosts.slice(0, maxVisible).map((p) => (
                  <CalendarPostPill key={p.id} post={p} compact />
                ))}
                {overflow > 0 && (
                  <button
                    onClick={() => onDayClick(day)}
                    className="w-full rounded-md px-2 py-0.5 text-left text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                  >
                    +{overflow} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
