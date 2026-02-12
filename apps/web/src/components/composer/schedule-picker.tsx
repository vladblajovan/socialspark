"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SchedulePickerProps {
  onSchedule: (date: Date) => void;
  onCancel: () => void;
  initialDate?: Date | null;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

export function SchedulePicker({ onSchedule, onCancel, initialDate }: SchedulePickerProps) {
  const now = new Date();
  const defaultDate = initialDate ?? new Date(now.getTime() + 3600_000); // Default: 1 hour from now

  const [date, setDate] = useState<Date | undefined>(defaultDate);
  const [hour, setHour] = useState(
    String(defaultDate.getHours() % 12 || 12),
  );
  const [minute, setMinute] = useState(
    String(Math.floor(defaultDate.getMinutes() / 5) * 5),
  );
  const [ampm, setAmpm] = useState<"AM" | "PM">(
    defaultDate.getHours() >= 12 ? "PM" : "AM",
  );
  const [timezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );

  const combinedDate = useMemo(() => {
    if (!date) return null;
    const d = new Date(date);
    let h = parseInt(hour, 10);
    const m = parseInt(minute, 10);
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    d.setHours(h, m, 0, 0);
    return d;
  }, [date, hour, minute, ampm]);

  const isValid = combinedDate && combinedDate > new Date();

  return (
    <div className="space-y-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
          />
        </PopoverContent>
      </Popover>

      <div className="flex items-center gap-2">
        <Select value={hour} onValueChange={setHour}>
          <SelectTrigger className="w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HOURS.map((h) => (
              <SelectItem key={h} value={String(h)}>
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground">:</span>
        <Select value={minute} onValueChange={setMinute}>
          <SelectTrigger className="w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MINUTES.map((m) => (
              <SelectItem key={m} value={String(m)}>
                {String(m).padStart(2, "0")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={ampm} onValueChange={(v) => setAmpm(v as "AM" | "PM")}>
          <SelectTrigger className="w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AM">AM</SelectItem>
            <SelectItem value="PM">PM</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground">{timezone}</p>

      <div className="flex gap-2">
        <Button
          onClick={() => combinedDate && onSchedule(combinedDate)}
          disabled={!isValid}
          className="flex-1"
        >
          Confirm Schedule
        </Button>
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </div>
  );
}
