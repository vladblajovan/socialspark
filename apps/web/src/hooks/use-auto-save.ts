"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type SaveStatus = "idle" | "unsaved" | "saving" | "saved" | "error";

interface AutoSaveOptions {
  debounceMs?: number;
  onSave: () => Promise<void>;
}

export function useAutoSave({ debounceMs = 30_000, onSave }: AutoSaveOptions) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const markDirty = useCallback(() => {
    setStatus("unsaved");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      if (!isMountedRef.current) return;
      setStatus("saving");
      try {
        await onSave();
        if (isMountedRef.current) setStatus("saved");
      } catch {
        if (isMountedRef.current) setStatus("error");
      }
    }, debounceMs);
  }, [debounceMs, onSave]);

  const saveNow = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStatus("saving");
    try {
      await onSave();
      if (isMountedRef.current) setStatus("saved");
    } catch {
      if (isMountedRef.current) setStatus("error");
    }
  }, [onSave]);

  return { status, markDirty, saveNow };
}
