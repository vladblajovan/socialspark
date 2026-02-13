"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { TiptapEditor } from "./tiptap-editor";
import { PlatformSelector, type PlatformAccount } from "./platform-selector";
import { MediaUploadZone, type MediaItem } from "./media-upload-zone";
import { PublishActions } from "./publish-actions";
import { usePostMutations } from "@/hooks/use-post-mutations";
import { useAutoSave } from "@/hooks/use-auto-save";

interface InitialPost {
  id: string;
  contentHtml: string | null;
  content: string | null;
  platforms: { platformAccountId: string }[];
  media: (MediaItem & { position: number })[];
  status: string;
  scheduledAt?: Date | string | null;
}

interface PostComposerProps {
  accounts: PlatformAccount[];
  initialPost?: InitialPost;
}

export function PostComposer({ accounts, initialPost }: PostComposerProps) {
  const router = useRouter();
  const { createPost, updatePost, schedulePost, publishNow, loading } = usePostMutations();

  const [postId, setPostId] = useState<string | null>(initialPost?.id ?? null);
  const [content, setContent] = useState(initialPost?.content ?? "");
  const [contentHtml, setContentHtml] = useState(initialPost?.contentHtml ?? "");
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<string[]>(
    initialPost?.platforms.map((p) => p.platformAccountId) ?? []
  );
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(
    initialPost?.media?.map(({ id, fileName, storageUrl, mimeType }) => ({
      id,
      fileName,
      storageUrl,
      mimeType,
    })) ?? []
  );
  const [scheduledAt, setScheduledAt] = useState<Date | null>(
    initialPost?.scheduledAt ? new Date(initialPost.scheduledAt) : null,
  );

  const save = useCallback(async (): Promise<string | null> => {
    if (!content.trim() || selectedPlatformIds.length === 0) return null;

    const mediaIds = mediaItems.map((m) => m.id);

    if (postId) {
      await updatePost(postId, {
        content,
        contentHtml,
        platformAccountIds: selectedPlatformIds,
        mediaIds,
      });
      return postId;
    } else {
      const created = await createPost({
        content,
        contentHtml,
        platformAccountIds: selectedPlatformIds,
        mediaIds,
      });
      setPostId(created.id);
      return created.id;
    }
  }, [content, contentHtml, selectedPlatformIds, mediaItems, postId, createPost, updatePost]);

  const { status: saveStatus, markDirty, saveNow } = useAutoSave({
    onSave: save,
  });

  const handleEditorUpdate = useCallback(
    (text: string, html: string) => {
      setContent(text);
      setContentHtml(html);
      markDirty();
    },
    [markDirty]
  );

  const handlePlatformToggle = useCallback(
    (accountId: string) => {
      setSelectedPlatformIds((prev) =>
        prev.includes(accountId)
          ? prev.filter((id) => id !== accountId)
          : [...prev, accountId]
      );
      markDirty();
    },
    [markDirty]
  );

  const handleMediaUpload = useCallback(
    async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/v1/media", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setMediaItems((prev) => [
        ...prev,
        {
          id: json.data.id,
          fileName: json.data.fileName,
          storageUrl: json.data.storageUrl,
          mimeType: json.data.mimeType,
        },
      ]);
      markDirty();
    },
    [markDirty]
  );

  const handleMediaRemove = useCallback(
    (mediaId: string) => {
      setMediaItems((prev) => prev.filter((m) => m.id !== mediaId));
      markDirty();
      fetch(`/api/v1/media/${mediaId}`, { method: "DELETE" }).catch(() => {});
    },
    [markDirty]
  );

  const handleSaveDraft = useCallback(async () => {
    await saveNow();
    router.push("/dashboard/posts");
  }, [saveNow, router]);

  const handleSchedule = useCallback(
    async (date: Date) => {
      const id = postId ?? await save();
      if (!id) return;
      await schedulePost(id, date);
      setScheduledAt(date);
    },
    [postId, save, schedulePost],
  );

  const handlePublishNow = useCallback(async () => {
    const id = postId ?? await save();
    if (!id) return;
    await publishNow(id);
    window.location.assign("/dashboard/posts");
  }, [postId, save, publishNow]);

  const handleUnschedule = useCallback(async () => {
    if (!postId) return;
    await updatePost(postId, { status: "draft" });
    setScheduledAt(null);
  }, [postId, updatePost]);

  const canSave = content.trim().length > 0 && selectedPlatformIds.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
      {/* Main content area */}
      <div className="space-y-6">
        <TiptapEditor
          content={initialPost?.contentHtml ?? ""}
          onUpdate={handleEditorUpdate}
        />

        <MediaUploadZone
          media={mediaItems}
          onUpload={handleMediaUpload}
          onRemove={handleMediaRemove}
        />
      </div>

      {/* Right sidebar */}
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-3">Publish to</h3>
          <PlatformSelector
            accounts={accounts}
            selectedIds={selectedPlatformIds}
            onToggle={handlePlatformToggle}
            content={content}
          />
        </div>

        {/* Publish actions */}
        <div className="space-y-3">
          <PublishActions
            postId={postId}
            scheduledAt={scheduledAt}
            canPublish={canSave}
            loading={loading}
            onSaveDraft={handleSaveDraft}
            onSchedule={handleSchedule}
            onPublishNow={handlePublishNow}
            onUnschedule={handleUnschedule}
          />

          <div className="flex items-center justify-center">
            <SaveStatusBadge status={saveStatus} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SaveStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "saving":
      return (
        <Badge variant="secondary" className="gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving...
        </Badge>
      );
    case "saved":
      return <Badge variant="secondary">Saved</Badge>;
    case "unsaved":
      return <Badge variant="outline">Unsaved changes</Badge>;
    case "error":
      return <Badge variant="destructive">Save failed</Badge>;
    default:
      return null;
  }
}
