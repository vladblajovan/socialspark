import { z } from "zod";
import { POST_STATUSES } from "../constants";

export const createPostSchema = z.object({
  content: z.string().min(1, "Content is required").max(100_000),
  contentHtml: z.string().max(200_000).optional(),
  platformAccountIds: z
    .array(z.string().uuid())
    .min(1, "Select at least one platform"),
  scheduledAt: z.coerce.date().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  mediaIds: z.array(z.string().uuid()).max(10).optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

export const updatePostSchema = z.object({
  content: z.string().min(1).max(100_000).optional(),
  contentHtml: z.string().max(200_000).optional(),
  platformAccountIds: z.array(z.string().uuid()).min(1).optional(),
  scheduledAt: z.coerce.date().nullable().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  mediaIds: z.array(z.string().uuid()).max(10).optional(),
  status: z.enum(["draft", "pending_approval", "scheduled"]).optional(),
});

export type UpdatePostInput = z.infer<typeof updatePostSchema>;

export const schedulePostSchema = z.object({
  scheduledAt: z.coerce.date(),
});

export const listPostsQuerySchema = z.object({
  status: z.enum(POST_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
});

export type ListPostsQuery = z.infer<typeof listPostsQuerySchema>;

export const calendarPostsQuerySchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
});

export type CalendarPostsQuery = z.infer<typeof calendarPostsQuerySchema>;
