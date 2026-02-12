"use client";

import { useState, useMemo, useCallback } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  format,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCalendarPosts } from "@/hooks/use-calendar-posts";
import { MonthView } from "./month-view";
import { WeekView } from "./week-view";
import { DayView } from "./day-view";

type CalendarViewType = "month" | "week" | "day";

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarViewType>("month");
  const [rescheduling, setRescheduling] = useState(false);

  // Compute date range based on current view
  const { from, to } = useMemo(() => {
    switch (view) {
      case "month": {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        return {
          from: startOfWeek(monthStart),
          to: endOfWeek(monthEnd),
        };
      }
      case "week": {
        return {
          from: startOfWeek(currentDate),
          to: endOfWeek(currentDate),
        };
      }
      case "day": {
        const dayStart = new Date(currentDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);
        return { from: dayStart, to: dayEnd };
      }
    }
  }, [currentDate, view]);

  const { postsByDate, loading, error, refetch } = useCalendarPosts(from, to);

  const navigateBack = useCallback(() => {
    setCurrentDate((d) => {
      switch (view) {
        case "month": return subMonths(d, 1);
        case "week": return subWeeks(d, 1);
        case "day": return subDays(d, 1);
      }
    });
  }, [view]);

  const navigateForward = useCallback(() => {
    setCurrentDate((d) => {
      switch (view) {
        case "month": return addMonths(d, 1);
        case "week": return addWeeks(d, 1);
        case "day": return addDays(d, 1);
      }
    });
  }, [view]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const handleViewChange = useCallback((newView: string) => {
    setView(newView as CalendarViewType);
  }, []);

  const handleDayClick = useCallback((date: Date) => {
    setCurrentDate(date);
    setView("day");
  }, []);

  const handleDrop = useCallback(
    async (postId: string, newDate: Date, originalDate: string) => {
      // Preserve original time, only change the date
      const original = new Date(originalDate);
      const rescheduled = new Date(newDate);
      rescheduled.setHours(original.getHours(), original.getMinutes(), original.getSeconds());

      setRescheduling(true);
      try {
        const res = await fetch(`/api/v1/posts/${postId}/schedule`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scheduledAt: rescheduled.toISOString() }),
        });
        const json = await res.json();
        if (!res.ok) {
          alert(json.error || "Failed to reschedule post");
          return;
        }
        refetch();
      } catch {
        alert("Failed to reschedule post");
      } finally {
        setRescheduling(false);
      }
    },
    [refetch]
  );

  // Title based on view
  const title = useMemo(() => {
    switch (view) {
      case "month": return format(currentDate, "MMMM yyyy");
      case "week": {
        const ws = startOfWeek(currentDate);
        const we = endOfWeek(currentDate);
        return `${format(ws, "MMM d")} – ${format(we, "MMM d, yyyy")}`;
      }
      case "day": return format(currentDate, "EEEE, MMMM d, yyyy");
    }
  }, [currentDate, view]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center rounded-lg border bg-card shadow-sm">
            <Button variant="ghost" size="sm" onClick={navigateBack} className="rounded-r-none h-8 w-8 p-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="h-4 w-px bg-border" />
            <Button variant="ghost" size="sm" onClick={navigateForward} className="rounded-l-none h-8 w-8 p-0">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={goToToday} className="h-8 shadow-sm">
            Today
          </Button>
          <h2 className="text-lg font-semibold ml-2 select-none">{title}</h2>
          {rescheduling && (
            <span className="ml-2 text-xs text-muted-foreground animate-pulse">Rescheduling...</span>
          )}
        </div>

        <Tabs value={view} onValueChange={handleViewChange}>
          <TabsList>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="day">Day</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
          <Button variant="ghost" size="sm" className="ml-2" onClick={refetch}>
            Retry
          </Button>
        </div>
      )}

      {/* Loading overlay */}
      <div className={loading ? "opacity-60 pointer-events-none transition-opacity" : "transition-opacity"}>
        {view === "month" && (
          <MonthView
            currentDate={currentDate}
            postsByDate={postsByDate}
            onDrop={handleDrop}
            onDayClick={handleDayClick}
          />
        )}
        {view === "week" && (
          <WeekView
            currentDate={currentDate}
            postsByDate={postsByDate}
            onDrop={handleDrop}
          />
        )}
        {view === "day" && (
          <DayView
            currentDate={currentDate}
            postsByDate={postsByDate}
          />
        )}
      </div>
    </div>
  );
}
