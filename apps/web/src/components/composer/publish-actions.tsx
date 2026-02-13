"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Save,
  Clock,
  Send,
  ChevronDown,
  Loader2,
  CalendarX,
} from "lucide-react";
import { SchedulePicker } from "./schedule-picker";

interface PublishActionsProps {
  postId: string | null;
  scheduledAt: Date | null;
  canPublish: boolean;
  loading: boolean;
  onSaveDraft: () => Promise<void>;
  onSchedule: (date: Date) => Promise<void>;
  onPublishNow: () => Promise<void>;
  onUnschedule: () => Promise<void>;
}

export function PublishActions({
  postId,
  scheduledAt,
  canPublish,
  loading,
  onSaveDraft,
  onSchedule,
  onPublishNow,
  onUnschedule,
}: PublishActionsProps) {
  const [showScheduler, setShowScheduler] = useState(false);
  const isScheduled = !!scheduledAt;

  if (showScheduler) {
    return (
      <SchedulePicker
        initialDate={scheduledAt}
        onSchedule={async (date) => {
          await onSchedule(date);
          setShowScheduler(false);
        }}
        onCancel={() => setShowScheduler(false)}
      />
    );
  }

  if (isScheduled) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border bg-muted/50 p-3 text-center">
          <p className="text-xs text-muted-foreground">Scheduled for</p>
          <p className="text-sm font-medium">
            {format(new Date(scheduledAt), "PPP 'at' p")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowScheduler(true)}
            className="flex-1"
            disabled={loading}
          >
            <Clock className="mr-2 h-4 w-4" />
            Reschedule
          </Button>
          <Button
            variant="outline"
            onClick={onUnschedule}
            className="flex-1"
            disabled={loading}
          >
            <CalendarX className="mr-2 h-4 w-4" />
            Unschedule
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          onClick={onSaveDraft}
          disabled={!canPublish || loading}
          variant="outline"
          className="flex-1"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Draft
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button disabled={!canPublish || loading} className="flex-1">
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Publish
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setShowScheduler(true)}>
              <Clock className="mr-2 h-4 w-4" />
              Schedule
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onPublishNow}>
              <Send className="mr-2 h-4 w-4" />
              Publish Now
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
