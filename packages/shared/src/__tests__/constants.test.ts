import { describe, it, expect } from "vitest";
import {
  PLATFORMS,
  PLATFORM_LABELS,
  POST_STATUSES,
  TEAM_ROLES,
  PLANS,
  PLAN_LIMITS,
} from "../constants";

describe("PLATFORMS", () => {
  it("contains all 10 target platforms", () => {
    expect(PLATFORMS).toHaveLength(10);
    expect(PLATFORMS).toContain("instagram");
    expect(PLATFORMS).toContain("facebook");
    expect(PLATFORMS).toContain("twitter");
    expect(PLATFORMS).toContain("linkedin");
    expect(PLATFORMS).toContain("tiktok");
    expect(PLATFORMS).toContain("youtube");
    expect(PLATFORMS).toContain("threads");
    expect(PLATFORMS).toContain("pinterest");
    expect(PLATFORMS).toContain("bluesky");
    expect(PLATFORMS).toContain("mastodon");
  });

  it("has a label for every platform", () => {
    for (const platform of PLATFORMS) {
      expect(PLATFORM_LABELS[platform]).toBeDefined();
      expect(typeof PLATFORM_LABELS[platform]).toBe("string");
    }
  });
});

describe("POST_STATUSES", () => {
  it("contains expected lifecycle statuses", () => {
    expect(POST_STATUSES).toContain("draft");
    expect(POST_STATUSES).toContain("scheduled");
    expect(POST_STATUSES).toContain("publishing");
    expect(POST_STATUSES).toContain("published");
    expect(POST_STATUSES).toContain("failed");
  });

  it("includes approval workflow statuses", () => {
    expect(POST_STATUSES).toContain("pending_approval");
    expect(POST_STATUSES).toContain("changes_requested");
    expect(POST_STATUSES).toContain("approved");
  });
});

describe("TEAM_ROLES", () => {
  it("has 4 roles in hierarchical order", () => {
    expect(TEAM_ROLES).toEqual(["owner", "admin", "editor", "viewer"]);
  });
});

describe("PLANS", () => {
  it("has free, pro, and team tiers", () => {
    expect(PLANS).toEqual(["free", "pro", "team"]);
  });
});

describe("PLAN_LIMITS", () => {
  it("has limits defined for every plan", () => {
    for (const plan of PLANS) {
      expect(PLAN_LIMITS[plan]).toBeDefined();
      expect(PLAN_LIMITS[plan].maxAccounts).toBeGreaterThan(0);
      expect(PLAN_LIMITS[plan].maxTeamMembers).toBeGreaterThan(0);
      expect(PLAN_LIMITS[plan].maxStorageMb).toBeGreaterThan(0);
    }
  });

  it("free tier is more restrictive than pro", () => {
    expect(PLAN_LIMITS.free.maxAccounts).toBeLessThan(
      PLAN_LIMITS.pro.maxAccounts,
    );
    expect(PLAN_LIMITS.free.maxAiGenerations).toBeLessThan(
      PLAN_LIMITS.pro.maxAiGenerations,
    );
  });

  it("pro tier is more restrictive than team", () => {
    expect(PLAN_LIMITS.pro.maxAccounts).toBeLessThan(
      PLAN_LIMITS.team.maxAccounts,
    );
    expect(PLAN_LIMITS.pro.maxTeamMembers).toBeLessThan(
      PLAN_LIMITS.team.maxTeamMembers,
    );
  });

  it("uses -1 to indicate unlimited posts for paid plans", () => {
    expect(PLAN_LIMITS.pro.maxPostsPerMonth).toBe(-1);
    expect(PLAN_LIMITS.team.maxPostsPerMonth).toBe(-1);
  });
});
