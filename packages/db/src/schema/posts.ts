import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { team } from "./teams";
import { user } from "./users";
import { platformAccount } from "./platform-accounts";

export const post = pgTable(
  "post",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    content: text("content"),
    contentHtml: text("content_html"),
    status: text("status").notNull().default("draft"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    approvedBy: text("approved_by").references(() => user.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    approvalNote: text("approval_note"),
    aiGenerated: boolean("ai_generated").notNull().default(false),
    aiPrompt: text("ai_prompt"),
    aiModel: text("ai_model"),
    tags: text("tags").array().default([]),
    metadata: text("metadata").default("{}"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_posts_team_id").on(table.teamId),
    index("idx_posts_status").on(table.status),
    index("idx_posts_team_status").on(table.teamId, table.status),
    index("idx_posts_scheduled_at").on(table.scheduledAt),
  ]
);

export const postPlatform = pgTable(
  "post_platform",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    postId: text("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    platformAccountId: text("platform_account_id")
      .notNull()
      .references(() => platformAccount.id, { onDelete: "cascade" }),
    content: text("content"),
    hashtags: text("hashtags").array(),
    status: text("status").notNull().default("pending"),
    platformPostId: text("platform_post_id"),
    platformPostUrl: text("platform_post_url"),
    errorMessage: text("error_message"),
    retryCount: integer("retry_count").notNull().default(0),
    maxRetries: integer("max_retries").notNull().default(5),
    lastRetryAt: timestamp("last_retry_at", { withTimezone: true }),
    metadata: text("metadata").default("{}"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_post_platforms_post_id").on(table.postId),
    index("idx_post_platforms_status").on(table.status),
  ]
);

export const media = pgTable(
  "media",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    uploadedBy: text("uploaded_by")
      .notNull()
      .references(() => user.id),
    fileName: text("file_name").notNull(),
    fileSize: integer("file_size").notNull(),
    mimeType: text("mime_type").notNull(),
    width: integer("width"),
    height: integer("height"),
    duration: integer("duration"),
    storageKey: text("storage_key").notNull(),
    storageUrl: text("storage_url").notNull(),
    thumbnailKey: text("thumbnail_key"),
    thumbnailUrl: text("thumbnail_url"),
    altText: text("alt_text"),
    processingStatus: text("processing_status").notNull().default("uploaded"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_media_team_id").on(table.teamId)]
);

export const postMedia = pgTable(
  "post_media",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    postId: text("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    mediaId: text("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
  },
  (table) => [index("idx_post_media_post_id").on(table.postId)]
);
