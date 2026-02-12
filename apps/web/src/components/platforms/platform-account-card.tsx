"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlatformIcon } from "./platform-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PLATFORM_LABELS, type Platform } from "@socialspark/shared";
import { Loader2, Unplug, RefreshCw } from "lucide-react";

interface PlatformAccountData {
  id: string;
  platform: string;
  platformUsername: string | null;
  platformDisplayName: string | null;
  platformAvatarUrl: string | null;
  tokenExpiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  lastSyncedAt: string | null;
}

function getStatusInfo(account: PlatformAccountData): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} {
  if (!account.isActive) {
    return { label: "Inactive", variant: "destructive" };
  }
  if (account.tokenExpiresAt) {
    const expiresAt = new Date(account.tokenExpiresAt);
    const now = new Date();
    if (expiresAt < now) {
      return { label: "Expired", variant: "destructive" };
    }
    const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilExpiry < 24) {
      return { label: "Expiring Soon", variant: "outline" };
    }
  }
  return { label: "Active", variant: "default" };
}

export function PlatformAccountCard({ account }: { account: PlatformAccountData }) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const status = getStatusInfo(account);

  async function handleDisconnect() {
    setLoading(true);
    try {
      const res = await fetch(`/api/platforms/${account.platform}/${account.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setShowConfirm(false);
        router.refresh();
      }
    } catch {
      // Error handled silently, user can retry
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await fetch(`/api/platforms/${account.platform}/${account.id}/refresh`, {
        method: "POST",
      });
      router.refresh();
    } catch {
      // Error handled silently
    } finally {
      setRefreshing(false);
    }
  }

  function handleReconnect() {
    window.location.assign(`/api/platforms/${account.platform}/connect`);
  }

  const isExpired = status.label === "Expired";
  const platform = account.platform as Platform;

  return (
    <>
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={account.platformAvatarUrl ?? undefined} />
              <AvatarFallback>
                <PlatformIcon platform={platform} className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 rounded-full bg-background p-0.5">
              <PlatformIcon platform={platform} className="h-3 w-3" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">
                {account.platformDisplayName ?? account.platformUsername}
              </span>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {PLATFORM_LABELS[platform]} &middot; @{account.platformUsername}
            </p>
            <p className="text-xs text-muted-foreground">
              Connected {new Date(account.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isExpired ? (
              <Button variant="outline" size="sm" onClick={handleReconnect}>
                <RefreshCw className="mr-1 h-3 w-3" />
                Reconnect
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConfirm(true)}
              className="text-destructive hover:text-destructive"
            >
              <Unplug className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect {PLATFORM_LABELS[platform]}?</DialogTitle>
            <DialogDescription>
              This will remove the connection to @{account.platformUsername}. You can reconnect at any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDisconnect} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
