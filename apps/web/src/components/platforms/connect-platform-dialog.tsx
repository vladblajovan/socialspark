"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformIcon } from "./platform-icons";
import { BlueskyConnectForm } from "./bluesky-connect-form";
import { Plus } from "lucide-react";
import { PLATFORM_LABELS, type Platform } from "@socialspark/shared";

interface PlatformOption {
  platform: Platform;
  supported: boolean;
  flowType: "oauth" | "credentials" | null;
}

const platformOptions: PlatformOption[] = [
  { platform: "twitter", supported: true, flowType: "oauth" },
  { platform: "linkedin", supported: true, flowType: "oauth" },
  { platform: "bluesky", supported: true, flowType: "credentials" },
  { platform: "instagram", supported: false, flowType: null },
  { platform: "facebook", supported: false, flowType: null },
  { platform: "tiktok", supported: false, flowType: null },
  { platform: "youtube", supported: false, flowType: null },
  { platform: "threads", supported: false, flowType: null },
  { platform: "pinterest", supported: false, flowType: null },
  { platform: "mastodon", supported: false, flowType: null },
];

interface ConnectPlatformDialogProps {
  connectedPlatformUserIds: Set<string>;
}

export function ConnectPlatformDialog({ connectedPlatformUserIds }: ConnectPlatformDialogProps) {
  const [open, setOpen] = useState(false);
  const [showBlueskyForm, setShowBlueskyForm] = useState(false);

  function handleConnect(option: PlatformOption) {
    if (option.flowType === "oauth") {
      window.location.assign(`/api/platforms/${option.platform}/connect`);
    } else if (option.flowType === "credentials") {
      setShowBlueskyForm(true);
    }
  }

  function handleBlueskySuccess() {
    setShowBlueskyForm(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setShowBlueskyForm(false); }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Connect Account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect a Platform</DialogTitle>
          <DialogDescription>
            Choose a social media platform to connect to your account.
          </DialogDescription>
        </DialogHeader>

        {showBlueskyForm ? (
          <BlueskyConnectForm onSuccess={handleBlueskySuccess} />
        ) : (
          <div className="grid gap-2">
            {platformOptions.map((option) => {
              const isConnected = connectedPlatformUserIds.has(option.platform);
              return (
                <button
                  key={option.platform}
                  onClick={() => handleConnect(option)}
                  disabled={!option.supported || isConnected}
                  className="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <PlatformIcon platform={option.platform} className="h-5 w-5 shrink-0" />
                  <span className="flex-1 font-medium">
                    {PLATFORM_LABELS[option.platform]}
                  </span>
                  {isConnected && <Badge variant="secondary">Connected</Badge>}
                  {!option.supported && !isConnected && (
                    <Badge variant="outline">Coming soon</Badge>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
