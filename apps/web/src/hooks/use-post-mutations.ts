"use client";

import { useState, useCallback } from "react";
import type { CreatePostInput, UpdatePostInput } from "@socialspark/shared";

interface MutationState {
  loading: boolean;
  error: string | null;
}

export function usePostMutations() {
  const [state, setState] = useState<MutationState>({
    loading: false,
    error: null,
  });

  const createPost = useCallback(async (data: CreatePostInput) => {
    setState({ loading: true, error: null });
    try {
      const res = await fetch("/api/v1/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create post");
      setState({ loading: false, error: null });
      return json.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create post";
      setState({ loading: false, error: message });
      throw err;
    }
  }, []);

  const updatePost = useCallback(
    async (postId: string, data: UpdatePostInput) => {
      setState({ loading: true, error: null });
      try {
        const res = await fetch(`/api/v1/posts/${postId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to update post");
        setState({ loading: false, error: null });
        return json.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update post";
        setState({ loading: false, error: message });
        throw err;
      }
    },
    []
  );

  const deletePost = useCallback(async (postId: string) => {
    setState({ loading: true, error: null });
    try {
      const res = await fetch(`/api/v1/posts/${postId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete post");
      setState({ loading: false, error: null });
      return json.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete post";
      setState({ loading: false, error: message });
      throw err;
    }
  }, []);

  return { ...state, createPost, updatePost, deletePost };
}
