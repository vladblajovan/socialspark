import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
const mockQueueAdd = vi.fn();
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
};

vi.mock("../lib/db", () => ({
  getDb: () => mockDb,
}));

vi.mock("../lib/redis", () => ({
  getRedis: () => ({}),
}));

vi.mock("../lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../queues", () => ({
  getPublishingQueue: () => ({ add: mockQueueAdd }),
  getSchedulingQueue: () => ({
    add: vi.fn(),
  }),
}));

vi.mock("bullmq", () => ({
  Worker: class MockWorker {
    constructor() {}
    on() {}
  },
}));

vi.mock("@socialspark/db", () => ({
  post: { id: "post.id", status: "post.status", scheduledAt: "post.scheduledAt", content: "post.content" },
  postPlatform: {
    id: "postPlatform.id",
    postId: "postPlatform.postId",
    platformAccountId: "postPlatform.platformAccountId",
    content: "postPlatform.content",
    hashtags: "postPlatform.hashtags",
    status: "postPlatform.status",
  },
  platformAccount: { id: "platformAccount.id", platform: "platformAccount.platform" },
  eq: vi.fn(),
  and: vi.fn(),
  sql: vi.fn(),
}));

import { scanAndEnqueue } from "../workers/scheduler";

describe("Scheduler Worker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueueAdd.mockResolvedValue(undefined);
  });

  it("returns 0 when no posts are due", async () => {
    mockDb.where.mockResolvedValueOnce([]);

    const count = await scanAndEnqueue();
    expect(count).toBe(0);
    expect(mockQueueAdd).not.toHaveBeenCalled();
  });

  it("enqueues jobs for due posts", async () => {
    mockDb.where.mockResolvedValueOnce([
      {
        postPlatformId: "pp-1",
        postId: "post-1",
        platformAccountId: "pa-1",
        postPlatformContent: "Platform-specific content",
        postPlatformHashtags: ["#test"],
        postContent: "Original content",
        platform: "twitter",
      },
    ]);
    mockDb.where.mockResolvedValueOnce([]); // update parent post

    const count = await scanAndEnqueue();

    expect(count).toBe(1);
    expect(mockQueueAdd).toHaveBeenCalledWith(
      "publish",
      {
        postPlatformId: "pp-1",
        postId: "post-1",
        platformAccountId: "pa-1",
        content: "Platform-specific content",
        hashtags: ["#test"],
      },
      { jobId: "publish:pp-1" },
    );
  });

  it("uses post content when postPlatform content is null", async () => {
    mockDb.where.mockResolvedValueOnce([
      {
        postPlatformId: "pp-2",
        postId: "post-2",
        platformAccountId: "pa-2",
        postPlatformContent: null,
        postPlatformHashtags: null,
        postContent: "Fallback content",
        platform: "linkedin",
      },
    ]);
    mockDb.where.mockResolvedValueOnce([]); // update parent

    await scanAndEnqueue();

    expect(mockQueueAdd).toHaveBeenCalledWith(
      "publish",
      expect.objectContaining({ content: "Fallback content" }),
      expect.any(Object),
    );
  });

  it("enqueues multiple jobs for a multi-platform post", async () => {
    mockDb.where.mockResolvedValueOnce([
      {
        postPlatformId: "pp-1",
        postId: "post-1",
        platformAccountId: "pa-1",
        postPlatformContent: "Twitter content",
        postPlatformHashtags: null,
        postContent: "Original",
        platform: "twitter",
      },
      {
        postPlatformId: "pp-2",
        postId: "post-1",
        platformAccountId: "pa-2",
        postPlatformContent: "LinkedIn content",
        postPlatformHashtags: null,
        postContent: "Original",
        platform: "linkedin",
      },
    ]);
    mockDb.where.mockResolvedValueOnce([]); // update parent (only 1 post)

    const count = await scanAndEnqueue();

    expect(count).toBe(2);
    expect(mockQueueAdd).toHaveBeenCalledTimes(2);
    // Only one parent post update (deduplicated)
    expect(mockDb.update).toHaveBeenCalledTimes(1);
  });

  it("updates parent posts to publishing status", async () => {
    mockDb.where.mockResolvedValueOnce([
      {
        postPlatformId: "pp-1",
        postId: "post-1",
        platformAccountId: "pa-1",
        postPlatformContent: "content",
        postPlatformHashtags: null,
        postContent: "content",
        platform: "twitter",
      },
    ]);
    mockDb.where.mockResolvedValueOnce([]); // update parent

    await scanAndEnqueue();

    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: "publishing" }),
    );
  });

  it("deduplicates jobs with jobId based on postPlatformId", async () => {
    mockDb.where.mockResolvedValueOnce([
      {
        postPlatformId: "pp-1",
        postId: "post-1",
        platformAccountId: "pa-1",
        postPlatformContent: "content",
        postPlatformHashtags: null,
        postContent: "content",
        platform: "twitter",
      },
    ]);
    mockDb.where.mockResolvedValueOnce([]);

    await scanAndEnqueue();

    expect(mockQueueAdd).toHaveBeenCalledWith(
      "publish",
      expect.any(Object),
      { jobId: "publish:pp-1" },
    );
  });

  it("handles multiple posts from different teams", async () => {
    mockDb.where.mockResolvedValueOnce([
      {
        postPlatformId: "pp-1",
        postId: "post-1",
        platformAccountId: "pa-1",
        postPlatformContent: "Team 1 post",
        postPlatformHashtags: null,
        postContent: "Team 1 post",
        platform: "twitter",
      },
      {
        postPlatformId: "pp-2",
        postId: "post-2",
        platformAccountId: "pa-3",
        postPlatformContent: "Team 2 post",
        postPlatformHashtags: null,
        postContent: "Team 2 post",
        platform: "bluesky",
      },
    ]);
    mockDb.where
      .mockResolvedValueOnce([]) // update post-1
      .mockResolvedValueOnce([]); // update post-2

    const count = await scanAndEnqueue();

    expect(count).toBe(2);
    // Two distinct posts → two parent updates
    expect(mockDb.update).toHaveBeenCalledTimes(2);
  });
});
