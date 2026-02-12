"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { PlatformIcon } from "@/components/platforms/platform-icons";
import { CharacterCounter } from "./character-counter";
import { PLATFORM_LABELS, type Platform } from "@socialspark/shared";

export interface PlatformAccount {
  id: string;
  platform: string;
  platformUsername: string | null;
  platformDisplayName: string | null;
  platformAvatarUrl: string | null;
}

interface PlatformSelectorProps {
  accounts: PlatformAccount[];
  selectedIds: string[];
  onToggle: (accountId: string) => void;
  content: string;
}

export function PlatformSelector({
  accounts,
  selectedIds,
  onToggle,
  content,
}: PlatformSelectorProps) {
  if (accounts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
        No connected accounts. Connect a platform first.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {accounts.map((account) => {
        const checked = selectedIds.includes(account.id);
        return (
          <label
            key={account.id}
            className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/50 transition-colors"
          >
            <Checkbox
              checked={checked}
              onCheckedChange={() => onToggle(account.id)}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <PlatformIcon
                  platform={account.platform as Platform}
                  className="h-4 w-4 shrink-0"
                />
                <span className="text-sm font-medium truncate">
                  {account.platformDisplayName || account.platformUsername}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {PLATFORM_LABELS[account.platform as Platform] ?? account.platform}
                {account.platformUsername && ` @${account.platformUsername}`}
              </p>
              {checked && (
                <div className="mt-1">
                  <CharacterCounter
                    text={content}
                    platform={account.platform as Platform}
                  />
                </div>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
}
