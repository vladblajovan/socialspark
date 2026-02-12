"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { POST_STATUSES, type PostStatus } from "@socialspark/shared";
import { useCallback, useState } from "react";

const STATUS_LABELS: Record<PostStatus, string> = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  changes_requested: "Changes Requested",
  approved: "Approved",
  scheduled: "Scheduled",
  publishing: "Publishing",
  published: "Published",
  partially_published: "Partially Published",
  failed: "Failed",
};

export function PostsToolbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const updateParams = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page"); // Reset page on filter change
      router.push(`/dashboard/posts?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      updateParams("search", search || null);
    },
    [search, updateParams]
  );

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <form onSubmit={handleSearch} className="relative flex-1 w-full sm:max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search posts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </form>

      <Select
        value={searchParams.get("status") ?? "all"}
        onValueChange={(value) =>
          updateParams("status", value === "all" ? null : value)
        }
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {POST_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button asChild>
        <Link href="/dashboard/posts/new">
          <Plus className="mr-2 h-4 w-4" />
          New Post
        </Link>
      </Button>
    </div>
  );
}
