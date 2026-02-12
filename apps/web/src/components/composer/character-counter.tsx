"use client";

import { getCharacterCount, getCharacterLimit, type Platform } from "@socialspark/shared";
import { cn } from "@/lib/utils";

interface CharacterCounterProps {
  text: string;
  platform: Platform;
}

export function CharacterCounter({ text, platform }: CharacterCounterProps) {
  const current = getCharacterCount(text, platform);
  const max = getCharacterLimit(platform);
  const ratio = current / max;

  return (
    <span
      className={cn(
        "text-xs tabular-nums",
        ratio < 0.8 && "text-muted-foreground",
        ratio >= 0.8 && ratio <= 1 && "text-yellow-600 dark:text-yellow-500",
        ratio > 1 && "text-destructive font-medium"
      )}
    >
      {current}/{max}
    </span>
  );
}
