export const PLATFORMS = [
  "instagram",
  "facebook",
  "twitter",
  "linkedin",
  "tiktok",
  "youtube",
  "threads",
  "pinterest",
  "bluesky",
  "mastodon",
] as const;

export type Platform = (typeof PLATFORMS)[number];

export const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  twitter: "X / Twitter",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  youtube: "YouTube",
  threads: "Threads",
  pinterest: "Pinterest",
  bluesky: "Bluesky",
  mastodon: "Mastodon",
};

export const POST_STATUSES = [
  "draft",
  "pending_approval",
  "changes_requested",
  "approved",
  "scheduled",
  "publishing",
  "published",
  "partially_published",
  "failed",
] as const;

export type PostStatus = (typeof POST_STATUSES)[number];

export const TEAM_ROLES = ["owner", "admin", "editor", "viewer"] as const;

export type TeamRole = (typeof TEAM_ROLES)[number];

export const PLATFORM_CHARACTER_LIMITS: Record<Platform, number> = {
  twitter: 280,
  linkedin: 3000,
  bluesky: 300,
  instagram: 2200,
  facebook: 63206,
  threads: 500,
  pinterest: 500,
  tiktok: 2200,
  youtube: 5000,
  mastodon: 500,
};

export const ALLOWED_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

export type AllowedMediaType = (typeof ALLOWED_MEDIA_TYPES)[number];

export const MAX_MEDIA_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const MAX_MEDIA_PER_POST = 10;

export const POST_PLATFORM_STATUSES = ["pending", "publishing", "published", "failed"] as const;
export type PostPlatformStatus = (typeof POST_PLATFORM_STATUSES)[number];

export const PLANS = ["free", "pro", "team"] as const;

export type Plan = (typeof PLANS)[number];

export const PLAN_LIMITS: Record<Plan, {
  maxAccounts: number;
  maxPostsPerMonth: number;
  maxAiGenerations: number;
  maxAiImages: number;
  maxTeamMembers: number;
  maxStorageMb: number;
}> = {
  free: {
    maxAccounts: 3,
    maxPostsPerMonth: 90,
    maxAiGenerations: 20,
    maxAiImages: 5,
    maxTeamMembers: 1,
    maxStorageMb: 500,
  },
  pro: {
    maxAccounts: 10,
    maxPostsPerMonth: -1, // unlimited
    maxAiGenerations: 100,
    maxAiImages: 30,
    maxTeamMembers: 1,
    maxStorageMb: 5120,
  },
  team: {
    maxAccounts: 25,
    maxPostsPerMonth: -1, // unlimited
    maxAiGenerations: 500,
    maxAiImages: 100,
    maxTeamMembers: 10,
    maxStorageMb: 25600,
  },
};
