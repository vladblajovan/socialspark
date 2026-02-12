"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ALLOWED_MEDIA_TYPES,
  MAX_MEDIA_SIZE_BYTES,
  MAX_MEDIA_PER_POST,
  type AllowedMediaType,
} from "@socialspark/shared";
import { cn } from "@/lib/utils";

export interface MediaItem {
  id: string;
  fileName: string;
  storageUrl: string;
  mimeType: string;
}

interface MediaUploadZoneProps {
  media: MediaItem[];
  onUpload: (file: File) => Promise<void>;
  onRemove: (mediaId: string) => void;
  disabled?: boolean;
}

export function MediaUploadZone({
  media,
  onUpload,
  onRemove,
  disabled,
}: MediaUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndUpload = useCallback(
    async (file: File) => {
      setError(null);

      if (!ALLOWED_MEDIA_TYPES.includes(file.type as AllowedMediaType)) {
        setError(`Invalid file type: ${file.type}`);
        return;
      }
      if (file.size > MAX_MEDIA_SIZE_BYTES) {
        setError(`File too large (max ${MAX_MEDIA_SIZE_BYTES / 1024 / 1024}MB)`);
        return;
      }
      if (media.length >= MAX_MEDIA_PER_POST) {
        setError(`Maximum ${MAX_MEDIA_PER_POST} files per post`);
        return;
      }

      setUploading(true);
      try {
        await onUpload(file);
      } catch {
        setError("Upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [media.length, onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const files = Array.from(e.dataTransfer.files);
      files.forEach(validateAndUpload);
    },
    [validateAndUpload]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const files = Array.from(e.clipboardData.files);
      files.forEach(validateAndUpload);
    },
    [validateAndUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      files.forEach(validateAndUpload);
      e.target.value = "";
    },
    [validateAndUpload]
  );

  const atLimit = media.length >= MAX_MEDIA_PER_POST;

  return (
    <div className="space-y-3" onPaste={handlePaste}>
      {/* Thumbnails */}
      {media.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {media.map((item) => (
            <div
              key={item.id}
              className="relative group h-20 w-20 rounded-md overflow-hidden border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.storageUrl}
                alt={item.fileName}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {!atLimit && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
            dragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50",
            disabled && "opacity-50 pointer-events-none"
          )}
        >
          {uploading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Uploading...
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-muted-foreground">
                <ImageIcon className="h-5 w-5" />
                <Upload className="h-5 w-5" />
              </div>
              <p className="text-sm text-muted-foreground">
                Drag & drop images, or{" "}
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0"
                  onClick={() => inputRef.current?.click()}
                >
                  browse
                </Button>
              </p>
              <p className="text-xs text-muted-foreground">
                JPEG, PNG, GIF, WebP up to 10MB
              </p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_MEDIA_TYPES.join(",")}
            onChange={handleFileSelect}
            className="hidden"
            multiple
          />
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
