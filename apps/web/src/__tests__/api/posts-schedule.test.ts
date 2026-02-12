import { describe, it, expect } from "vitest";
import { schedulePostSchema } from "@socialspark/shared";

describe("Schedule/Publish API Validation", () => {
  describe("schedulePostSchema", () => {
    it("accepts a valid future date", () => {
      const futureDate = new Date(Date.now() + 3600_000).toISOString();
      const result = schedulePostSchema.safeParse({ scheduledAt: futureDate });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scheduledAt).toBeInstanceOf(Date);
      }
    });

    it("accepts date string and coerces to Date", () => {
      const result = schedulePostSchema.safeParse({
        scheduledAt: "2030-06-15T10:00:00Z",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scheduledAt).toBeInstanceOf(Date);
        expect(result.data.scheduledAt.getFullYear()).toBe(2030);
      }
    });

    it("rejects missing scheduledAt", () => {
      const result = schedulePostSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects invalid date string", () => {
      const result = schedulePostSchema.safeParse({
        scheduledAt: "not-a-date",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updatePostSchema status transitions", () => {
    // Import dynamically to test the updated schema
    it("allows 'scheduled' as a valid status", async () => {
      const { updatePostSchema } = await import("@socialspark/shared");
      const result = updatePostSchema.safeParse({ status: "scheduled" });
      expect(result.success).toBe(true);
    });

    it("allows 'draft' as a valid status", async () => {
      const { updatePostSchema } = await import("@socialspark/shared");
      const result = updatePostSchema.safeParse({ status: "draft" });
      expect(result.success).toBe(true);
    });

    it("rejects 'published' as a settable status", async () => {
      const { updatePostSchema } = await import("@socialspark/shared");
      const result = updatePostSchema.safeParse({ status: "published" });
      expect(result.success).toBe(false);
    });

    it("rejects 'failed' as a settable status", async () => {
      const { updatePostSchema } = await import("@socialspark/shared");
      const result = updatePostSchema.safeParse({ status: "failed" });
      expect(result.success).toBe(false);
    });
  });

  describe("POST_PLATFORM_STATUSES", () => {
    it("exports platform status constants", async () => {
      const { POST_PLATFORM_STATUSES } = await import("@socialspark/shared");
      expect(POST_PLATFORM_STATUSES).toEqual(["pending", "publishing", "published", "failed"]);
    });
  });

  describe("PublishingAdapter exports", () => {
    it("exports getPublishingAdapter", async () => {
      const { getPublishingAdapter } = await import("@socialspark/shared");
      expect(typeof getPublishingAdapter).toBe("function");
    });

    it("returns adapter for twitter", async () => {
      const { getPublishingAdapter } = await import("@socialspark/shared");
      const adapter = getPublishingAdapter("twitter");
      expect(adapter).toBeDefined();
      expect(typeof adapter.publishPost).toBe("function");
    });

    it("returns adapter for linkedin", async () => {
      const { getPublishingAdapter } = await import("@socialspark/shared");
      const adapter = getPublishingAdapter("linkedin");
      expect(adapter).toBeDefined();
    });

    it("returns adapter for bluesky", async () => {
      const { getPublishingAdapter } = await import("@socialspark/shared");
      const adapter = getPublishingAdapter("bluesky");
      expect(adapter).toBeDefined();
    });

    it("throws for unsupported platform", async () => {
      const { getPublishingAdapter } = await import("@socialspark/shared");
      expect(() => getPublishingAdapter("instagram")).toThrow(
        "Publishing not yet supported for platform: instagram",
      );
    });
  });
});
