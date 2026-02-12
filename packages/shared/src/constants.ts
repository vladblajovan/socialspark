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
