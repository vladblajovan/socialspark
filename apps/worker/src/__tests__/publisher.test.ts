import { describe, it, expect, vi, beforeEach } from "vitest";
import { PlatformPublishError } from "@socialspark/shared";

// Creates a chainable + thenable mock DB.
// All chain methods return `db`, and `db` has `.then()` so `await db.select()...` works.
// Results are consumed in FIFO order via `addResult()`.
function createMockDb() {
  const queryResults: unknown[][] = [];
  const db: Record<string, unknown> = {};
  const chainMethods = ["select", "from", "where", "limit", "innerJoin", "update", "set", "returning"];

  for (const method of chainMethods) {
    db[method] = vi.fn().mockReturnValue(db);
  }

  // Make db thenable — any `await` on the chain resolves to the next queued result
  db.then = (resolve: (value: unknown) => void) => {
    const result = queryResults.shift() ?? [];
    resolve(result);
    return Promise.resolve(result);
  };

  const addResult = (result: unknown[]) => queryResults.push(result);

  return { db, addResult };
}

let mockDbInstance = createMockDb();

vi.mock("../lib/db", () => ({
  getDb: () => mockDbInstance.db,
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

vi.mock("../lib/env", () => ({
  getEnv: () => ({
    ENCRYPTION_KEY: "a".repeat(32),
  }),
}));

const mockPublishPost = vi.fn();
vi.mock("@socialspark/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@socialspark/shared")>();
  return {
    ...actual,
    decryptToken: vi.fn().mockReturnValue("decrypted-access-token"),
    getPublishingAdapter: () => ({ publishPost: mockPublishPost }),
  };
});

const mockMoveToDeadLetter = vi.fn();
vi.mock("../workers/dead-letter", () => ({
  moveToDeadLetter: (...args: unknown[]) => mockMoveToDeadLetter(...args),
}));

const mockTryRefreshToken = vi.fn();
vi.mock("../workers/token-refresh-helper", () => ({
  tryRefreshToken: (...args: unknown[]) => mockTryRefreshToken(...args),
}));

const mockSendNotification = vi.fn();
vi.mock("@socialspark/email/src/notifications", () => ({
  sendPublishFailureNotification: (...args: unknown[]) => mockSendNotification(...args),
}));

let capturedProcessor: ((job: unknown) => Promise<void>) | null = null;
const capturedEventHandlers: Record<string, ((...args: unknown[]) => void)> = {};

vi.mock("bullmq", () => ({
  Worker: class MockWorker {
    constructor(_queue: string, processor: (job: unknown) => Promise<void>) {
      capturedProcessor = processor;
    }
    on(event: string, handler: (...args: unknown[]) => void) {
      capturedEventHandlers[event] = handler;
    }
  },
  Queue: class MockQueue {
    add = vi.fn();
    close = vi.fn();
  },
  UnrecoverableError: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = "UnrecoverableError";
    }
  },
}));

vi.mock("@socialspark/db", () => ({
  post: { id: "post.id", teamId: "post.teamId", status: "post.status", content: "post.content" },
  postPlatform: {
    id: "postPlatform.id",
    postId: "postPlatform.postId",
    status: "postPlatform.status",
    retryCount: "postPlatform.retryCount",
  },
  platformAccount: {
    id: "platformAccount.id",
    platform: "platformAccount.platform",
    platformUsername: "platformAccount.platformUsername",
  },
  team: { id: "team.id", ownerId: "team.ownerId" },
  user: { id: "user.id", email: "user.email" },
  eq: vi.fn(),
  sql: vi.fn(),
}));

import { startPublisherWorker } from "../workers/publisher";
import type { PublishJobData } from "../workers/scheduler";

function makeJobData(overrides?: Partial<PublishJobData>): PublishJobData {
  return {
    postPlatformId: "pp-1",
    postId: "post-1",
    platformAccountId: "pa-1",
    content: "Hello world!",
    hashtags: null,
    ...overrides,
  };
}

function makeJob(data: PublishJobData, attemptsMade = 1, maxAttempts = 5) {
  return {
    data,
    attemptsMade,
    opts: { attempts: maxAttempts },
    id: "job-1",
  };
}

const ACTIVE_ACCOUNT = {
  id: "pa-1",
  platform: "twitter",
  accessTokenEnc: "enc",
  isActive: true,
  platformUserId: "u1",
};

describe("Publisher Worker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbInstance = createMockDb();
    capturedProcessor = null;
    Object.keys(capturedEventHandlers).forEach((k) => delete capturedEventHandlers[k]);
  });

  describe("processPublishJob (via processor)", () => {
    it("publishes successfully and updates postPlatform", async () => {
      // Query order in processPublishJob (success path):
      // 1. update postPlatform → "publishing" (await update.set.where)
      // 2. select platformAccount (await select.from.where.limit)
      // 3. update postPlatform → "published" (await update.set.where)
      // 4. select postPlatform statuses (await select.from.where) — updateParentPostStatus
      // 5. update parent post (await update.set.where) — updateParentPostStatus
      mockDbInstance.addResult([]); // 1: update to publishing
      mockDbInstance.addResult([ACTIVE_ACCOUNT]); // 2: load account
      mockDbInstance.addResult([]); // 3: update to published
      mockDbInstance.addResult([{ status: "published" }]); // 4: all platform statuses
      mockDbInstance.addResult([]); // 5: update parent post

      mockPublishPost.mockResolvedValueOnce({
        platformPostId: "tweet-123",
        platformPostUrl: "https://x.com/i/web/status/tweet-123",
      });

      startPublisherWorker();
      await capturedProcessor!(makeJob(makeJobData()));

      expect(mockPublishPost).toHaveBeenCalledWith(
        "decrypted-access-token",
        { content: "Hello world!", hashtags: undefined },
        "u1",
      );
    });

    it("throws UnrecoverableError on 400 (bad request)", async () => {
      mockDbInstance.addResult([]); // update to publishing
      mockDbInstance.addResult([ACTIVE_ACCOUNT]); // load account
      // PlatformPublishError 400 → markFailed + updateParentPostStatus
      mockDbInstance.addResult([]); // markFailed
      mockDbInstance.addResult([{ status: "failed" }]); // platform statuses
      mockDbInstance.addResult([]); // update parent

      mockPublishPost.mockRejectedValueOnce(
        new PlatformPublishError("Bad request", 400),
      );

      startPublisherWorker();

      await expect(capturedProcessor!(makeJob(makeJobData()))).rejects.toThrow("Bad request");
    });

    it("attempts token refresh on 401 error", async () => {
      mockDbInstance.addResult([]); // update to publishing
      mockDbInstance.addResult([ACTIVE_ACCOUNT]); // load account
      // After 401 + token refresh + successful retry:
      mockDbInstance.addResult([]); // update to published (after refresh retry)
      mockDbInstance.addResult([{ status: "published" }]); // platform statuses
      mockDbInstance.addResult([]); // update parent

      mockTryRefreshToken.mockResolvedValueOnce("new-access-token");

      mockPublishPost
        .mockRejectedValueOnce(new PlatformPublishError("Unauthorized", 401))
        .mockResolvedValueOnce({
          platformPostId: "tweet-456",
          platformPostUrl: "https://x.com/i/web/status/tweet-456",
        });

      startPublisherWorker();
      await capturedProcessor!(makeJob(makeJobData()));

      expect(mockTryRefreshToken).toHaveBeenCalledWith("pa-1", "twitter");
      expect(mockPublishPost).toHaveBeenCalledTimes(2);
      expect(mockPublishPost).toHaveBeenLastCalledWith(
        "new-access-token",
        expect.any(Object),
        "u1",
      );
    });

    it("throws on 429 rate limit to trigger BullMQ retry", async () => {
      mockDbInstance.addResult([]); // update to publishing
      mockDbInstance.addResult([ACTIVE_ACCOUNT]); // load account
      mockDbInstance.addResult([]); // updateRetryCount

      const error = new PlatformPublishError("Rate limited", 429, 60);
      mockPublishPost.mockRejectedValueOnce(error);

      startPublisherWorker();

      await expect(capturedProcessor!(makeJob(makeJobData()))).rejects.toThrow("Rate limited");
    });

    it("throws UnrecoverableError when account not found", async () => {
      mockDbInstance.addResult([]); // update to publishing
      mockDbInstance.addResult([]); // no account found

      startPublisherWorker();

      await expect(capturedProcessor!(makeJob(makeJobData()))).rejects.toThrow(
        "Platform account not found or no access token",
      );
    });

    it("throws UnrecoverableError when account is inactive", async () => {
      mockDbInstance.addResult([]); // update to publishing
      mockDbInstance.addResult([{ ...ACTIVE_ACCOUNT, isActive: false }]); // inactive account

      startPublisherWorker();

      await expect(capturedProcessor!(makeJob(makeJobData()))).rejects.toThrow(
        "Platform account is inactive",
      );
    });
  });

  describe("failed event handler (retries exhausted)", () => {
    it("marks postPlatform as failed and moves to dead letter on final retry", async () => {
      // failed handler query order:
      // 1. update postPlatform → failed
      // 2. select platform statuses (updateParentPostStatus)
      // 3. update parent post (updateParentPostStatus)
      // 4. select post (content + teamId)
      // 5. select team → join user (owner email)
      // 6. select platformAccount (platform + username)
      mockDbInstance.addResult([]); // 1
      mockDbInstance.addResult([{ status: "failed" }]); // 2
      mockDbInstance.addResult([]); // 3
      mockDbInstance.addResult([{ content: "Hello", teamId: "team-1" }]); // 4
      mockDbInstance.addResult([{ email: "owner@test.com" }]); // 5
      mockDbInstance.addResult([{ platform: "twitter", platformUsername: "testuser" }]); // 6

      mockMoveToDeadLetter.mockResolvedValueOnce(undefined);
      mockSendNotification.mockResolvedValueOnce({ sent: true });

      startPublisherWorker();

      const data = makeJobData();
      const job = makeJob(data, 5, 5);
      await capturedEventHandlers["failed"](job, new Error("Platform API unavailable"));

      expect(mockMoveToDeadLetter).toHaveBeenCalledWith(
        data as unknown as Record<string, unknown>,
        "Platform API unavailable",
      );
    });

    it("sends email notification to team owner on permanent failure", async () => {
      mockDbInstance.addResult([]); // update postPlatform → failed
      mockDbInstance.addResult([{ status: "failed" }]); // platform statuses
      mockDbInstance.addResult([]); // update parent
      mockDbInstance.addResult([{ content: "My post content", teamId: "team-1" }]); // post
      mockDbInstance.addResult([{ email: "owner@example.com" }]); // owner
      mockDbInstance.addResult([{ platform: "twitter", platformUsername: "myhandle" }]); // account

      mockMoveToDeadLetter.mockResolvedValueOnce(undefined);
      mockSendNotification.mockResolvedValueOnce({ sent: true });

      startPublisherWorker();

      const data = makeJobData({ content: "My post content" });
      const job = makeJob(data, 5, 5);
      await capturedEventHandlers["failed"](job, new Error("API timeout"));

      expect(mockSendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "owner@example.com",
          postContent: "My post content",
          postId: "post-1",
        }),
      );
    });

    it("does not send email or move to DLQ when retries remain", async () => {
      startPublisherWorker();

      const data = makeJobData();
      const job = makeJob(data, 2, 5);
      await capturedEventHandlers["failed"](job, new Error("Temporary error"));

      expect(mockMoveToDeadLetter).not.toHaveBeenCalled();
      expect(mockSendNotification).not.toHaveBeenCalled();
    });

    it("does not crash worker when email notification fails", async () => {
      mockDbInstance.addResult([]); // update postPlatform → failed
      mockDbInstance.addResult([{ status: "failed" }]); // platform statuses
      mockDbInstance.addResult([]); // update parent
      mockDbInstance.addResult([{ content: "Post", teamId: "team-1" }]); // post
      mockDbInstance.addResult([{ email: "owner@test.com" }]); // owner
      mockDbInstance.addResult([{ platform: "twitter", platformUsername: "user" }]); // account

      mockMoveToDeadLetter.mockResolvedValueOnce(undefined);
      mockSendNotification.mockRejectedValueOnce(new Error("SMTP failure"));

      startPublisherWorker();

      const data = makeJobData();
      const job = makeJob(data, 5, 5);

      // Should not throw
      await capturedEventHandlers["failed"](job, new Error("Publish failed"));

      expect(mockMoveToDeadLetter).toHaveBeenCalled();
    });

    it("skips event handler when job is null", async () => {
      startPublisherWorker();
      await capturedEventHandlers["failed"](null, new Error("No job"));
      expect(mockMoveToDeadLetter).not.toHaveBeenCalled();
    });
  });
});
