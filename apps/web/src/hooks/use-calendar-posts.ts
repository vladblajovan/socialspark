"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { format } from "date-fns";

export interface CalendarPost {
  id: string;
  content: string;
  status: string;
  scheduledAt: string;
  platforms: string[];
}

interface UseCalendarPostsResult {
  posts: CalendarPost[];
  postsByDate: Record<string, CalendarPost[]>;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCalendarPosts(from: Date, to: Date): UseCalendarPostsResult {
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fromISO = from.toISOString();
  const toISO = to.toISOString();

  useEffect(() => {
    let cancelled = false;

    async function fetchPosts() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ from: fromISO, to: toISO });
        const res = await fetch(`/api/v1/posts/calendar?${params}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to fetch calendar posts");
        if (!cancelled) {
          setPosts(json.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to fetch calendar posts");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchPosts();
    return () => { cancelled = true; };
  }, [fromISO, toISO, refreshKey]);

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const postsByDate = useMemo(() => {
    const map: Record<string, CalendarPost[]> = {};
    for (const p of posts) {
      const key = format(new Date(p.scheduledAt), "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(p);
    }
    return map;
  }, [posts]);

  return { posts, postsByDate, loading, error, refetch };
}
