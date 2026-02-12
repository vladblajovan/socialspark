import { describe, it, expect } from "vitest";
import {
  createPostSchema,
  updatePostSchema,
  listPostsQuerySchema,
} from "../validators/posts";

describe("createPostSchema", () => {
  const validInput = {
    content: "Hello world!",
    contentHtml: "<p>Hello world!</p>",
    platformAccountIds: ["550e8400-e29b-41d4-a716-446655440000"],
  };

  it("accepts valid input", () => {
    const result = createPostSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("requires content", () => {
    const result = createPostSchema.safeParse({
      ...validInput,
      content: "",
    });
    expect(result.success).toBe(false);
  });

  it("requires at least one platform account", () => {
    const result = createPostSchema.safeParse({
      ...validInput,
      platformAccountIds: [],
    });
    expect(result.success).toBe(false);
  });

  it("validates platformAccountIds are UUIDs", () => {
    const result = createPostSchema.safeParse({
      ...validInput,
      platformAccountIds: ["not-a-uuid"],
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional scheduledAt as date string", () => {
    const result = createPostSchema.safeParse({
      ...validInput,
      scheduledAt: "2025-06-01T12:00:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.scheduledAt).toBeInstanceOf(Date);
    }
  });

  it("accepts optional tags array", () => {
    const result = createPostSchema.safeParse({
      ...validInput,
      tags: ["social", "marketing"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects more than 20 tags", () => {
    const result = createPostSchema.safeParse({
      ...validInput,
      tags: Array.from({ length: 21 }, (_, i) => `tag-${i}`),
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional mediaIds", () => {
    const result = createPostSchema.safeParse({
      ...validInput,
      mediaIds: ["550e8400-e29b-41d4-a716-446655440000"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects more than 10 media items", () => {
    const result = createPostSchema.safeParse({
      ...validInput,
      mediaIds: Array.from({ length: 11 }, () => "550e8400-e29b-41d4-a716-446655440000"),
    });
    expect(result.success).toBe(false);
  });
});

describe("updatePostSchema", () => {
  it("accepts partial updates", () => {
    const result = updatePostSchema.safeParse({ content: "Updated!" });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = updatePostSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("allows status to be draft or pending_approval", () => {
    expect(updatePostSchema.safeParse({ status: "draft" }).success).toBe(true);
    expect(
      updatePostSchema.safeParse({ status: "pending_approval" }).success
    ).toBe(true);
  });

  it("rejects invalid status values", () => {
    expect(
      updatePostSchema.safeParse({ status: "published" }).success
    ).toBe(false);
    expect(
      updatePostSchema.safeParse({ status: "failed" }).success
    ).toBe(false);
  });

  it("accepts scheduled as valid status", () => {
    expect(
      updatePostSchema.safeParse({ status: "scheduled" }).success
    ).toBe(true);
  });

  it("accepts nullable scheduledAt", () => {
    const result = updatePostSchema.safeParse({ scheduledAt: null });
    expect(result.success).toBe(true);
  });
});

describe("listPostsQuerySchema", () => {
  it("has defaults for page and limit", () => {
    const result = listPostsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it("coerces string numbers", () => {
    const result = listPostsQuerySchema.safeParse({
      page: "3",
      limit: "50",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(50);
    }
  });

  it("accepts valid status filter", () => {
    const result = listPostsQuerySchema.safeParse({ status: "draft" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = listPostsQuerySchema.safeParse({ status: "invalid" });
    expect(result.success).toBe(false);
  });

  it("limits max page size to 100", () => {
    const result = listPostsQuerySchema.safeParse({ limit: "200" });
    expect(result.success).toBe(false);
  });

  it("accepts optional search string", () => {
    const result = listPostsQuerySchema.safeParse({ search: "hello" });
    expect(result.success).toBe(true);
  });
});
