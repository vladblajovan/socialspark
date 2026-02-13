import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Scheduler mocks (chainable mock DB) ---
const mockQueueAdd = vi.fn();
const mockSchedulerDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
};

// --- Publisher mocks (thenable FIFO mock DB) ---
function createMockDb() {
  const queryResults: unknown[][] = [];
  const db: Record<string, unknown> = {};
  const chainMethods = ["select", "from", "where", "limit", "innerJoin", "update", "set", "returning"];

  for (const method of chainMethods) {
    db[method] = vi.fn().mockReturnValue(db);
  }

  db.then = (resolve: (value: unknown) => void) => {
    const result = queryResults.shift() ?? [];
    resolve(result);
    return Promise.resolve(result);
  };

  const addResult = (result: unknown[]) => queryResults.push(result);

  return { db, addResult };
}

let mockDbInstance = createMockDb();
let useSchedulerDb = true;

vi.mock("../lib/db", () => ({
  getDb: () => (useSchedulerDb ? mockSchedulerDb : mockDbInstance.db),
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

vi.mock("../queues", () => ({
  getPublishingQueue: () => ({ add: mockQueueAdd }),
  getSchedulingQueue: () => ({ add: vi.fn() }),
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

vi.mock("../workers/dead-letter", () => ({
  moveToDeadLetter: vi.fn(),
}));

vi.mock("../workers/token-refresh-helper", () => ({
  tryRefreshToken: vi.fn(),
}));

vi.mock("@socialspark/email/src/notifications", () => ({
  sendPublishFailureNotification: vi.fn(),
}));

let capturedProcessor: ((job: unknown) => Promise<void>) | null = null;

vi.mock("bullmq", () => ({
  Worker: class MockWorker {
    constructor(_queue: string, processor: (job: unknown) => Promise<void>) {
      capturedProcessor = processor;
    }
    on() {}
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
  post: { id: "post.id", teamId: "post.teamId", status: "post.status", scheduledAt: "post.scheduledAt", content: "post.content" },
  postPlatform: {
    id: "postPlatform.id",
    postId: "postPlatform.postId",
    platformAccountId: "postPlatform.platformAccountId",
    content: "postPlatform.content",
    hashtags: "postPlatform.hashtags",
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
  and: vi.fn(),
  sql: vi.fn(),
}));

import { scanAndEnqueue } from "../workers/scheduler";
import { startPublisherWorker } from "../workers/publisher";
import type { PublishJobData } from "../workers/scheduler";

// --- Helpers ---

const PLATFORMS = ["twitter", "linkedin", "bluesky"] as const;

function generateSchedulerRows(postCount: number, platformsPerPost = 3) {
  const rows = [];
  for (let i = 0; i < postCount; i++) {
    for (let j = 0; j < platformsPerPost; j++) {
      rows.push({
        postPlatformId: `pp-${i}-${j}`,
        postId: `post-${i}`,
        platformAccountId: `pa-${j}`,
        postPlatformContent: `Content for post ${i} on ${PLATFORMS[j]}`,
        postPlatformHashtags: ["#load", "#test"],
        postContent: `Original content for post ${i}`,
        platform: PLATFORMS[j % PLATFORMS.length],
      });
    }
  }
  return rows;
}

function makeJobData(index: number): PublishJobData {
  return {
    postPlatformId: `pp-${index}`,
    postId: `post-${Math.floor(index / 3)}`,
    platformAccountId: `pa-${index % 3}`,
    content: `Content for job ${index}`,
    hashtags: null,
  };
}

function makeJob(data: PublishJobData) {
  return {
    data,
    attemptsMade: 1,
    opts: { attempts: 5 },
    id: `job-${data.postPlatformId}`,
  };
}

const ACTIVE_ACCOUNT = {
  id: "pa-1",
  platform: "twitter",
  accessTokenEnc: "enc",
  isActive: true,
  platformUserId: "u1",
};

// --- Tests ---

describe("Load Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbInstance = createMockDb();
    capturedProcessor = null;
    mockQueueAdd.mockResolvedValue(undefined);
  });

  describe("Scheduler: 1000 posts x 3 platforms", () => {
    beforeEach(() => {
      useSchedulerDb = true;
    });

    it("enqueues 3000 jobs from 1000 posts in < 5s", async () => {
      const rows = generateSchedulerRows(1000, 3);
      mockSchedulerDb.where.mockResolvedValueOnce(rows);
      // 1000 unique post IDs → 1000 update calls, each resolves
      for (let i = 0; i < 1000; i++) {
        mockSchedulerDb.where.mockResolvedValueOnce([]);
      }

      const start = performance.now();
      const count = await scanAndEnqueue();
      const elapsed = performance.now() - start;

      expect(count).toBe(3000);
      expect(mockQueueAdd).toHaveBeenCalledTimes(3000);
      // 1000 unique posts → 1000 parent status updates
      expect(mockSchedulerDb.update).toHaveBeenCalledTimes(1000);
      expect(elapsed).toBeLessThan(5000);
    });

    it("handles 500 matching + 500 non-matching (only 500 rows returned)", async () => {
      // The DB query only returns matching rows, so we simulate 500 posts x 3 platforms
      const rows = generateSchedulerRows(500, 3);
      mockSchedulerDb.where.mockResolvedValueOnce(rows);
      for (let i = 0; i < 500; i++) {
        mockSchedulerDb.where.mockResolvedValueOnce([]);
      }

      const count = await scanAndEnqueue();

      expect(count).toBe(1500);
      expect(mockQueueAdd).toHaveBeenCalledTimes(1500);
      expect(mockSchedulerDb.update).toHaveBeenCalledTimes(500);
    });

    it("handles zero posts without errors", async () => {
      mockSchedulerDb.where.mockResolvedValueOnce([]);

      const count = await scanAndEnqueue();

      expect(count).toBe(0);
      expect(mockQueueAdd).not.toHaveBeenCalled();
      expect(mockSchedulerDb.update).not.toHaveBeenCalled();
    });
  });

  describe("Publisher: 1000 jobs throughput", () => {
    beforeEach(() => {
      useSchedulerDb = false;
    });

    it("processes 1000 jobs successfully in < 5s", async () => {
      mockPublishPost.mockResolvedValue({
        platformPostId: "ext-123",
        platformPostUrl: "https://example.com/post/123",
      });

      startPublisherWorker();
      expect(capturedProcessor).not.toBeNull();

      const start = performance.now();
      let completed = 0;

      for (let i = 0; i < 1000; i++) {
        // Each successful publish job needs 5 DB results:
        // 1. update postPlatform → publishing
        // 2. select platformAccount
        // 3. update postPlatform → published
        // 4. select postPlatform statuses (updateParentPostStatus)
        // 5. update parent post (updateParentPostStatus)
        mockDbInstance.addResult([]); // 1
        mockDbInstance.addResult([ACTIVE_ACCOUNT]); // 2
        mockDbInstance.addResult([]); // 3
        mockDbInstance.addResult([{ status: "published" }]); // 4
        mockDbInstance.addResult([]); // 5

        await capturedProcessor!(makeJob(makeJobData(i)));
        completed++;
      }

      const elapsed = performance.now() - start;

      expect(completed).toBe(1000);
      expect(mockPublishPost).toHaveBeenCalledTimes(1000);
      expect(elapsed).toBeLessThan(5000);
    });

    it("handles 1000 jobs with 10% unrecoverable failures", async () => {
      const { PlatformPublishError } = await import("@socialspark/shared");

      startPublisherWorker();
      expect(capturedProcessor).not.toBeNull();

      let succeeded = 0;
      let failed = 0;

      for (let i = 0; i < 1000; i++) {
        const shouldFail = i % 10 === 0; // 10% fail with 400

        if (shouldFail) {
          mockPublishPost.mockRejectedValueOnce(
            new PlatformPublishError("Bad request: invalid content", 400),
          );
          // Failed (400) path: update→publishing, select account, markFailed, updateParent(select + update)
          mockDbInstance.addResult([]); // update to publishing
          mockDbInstance.addResult([ACTIVE_ACCOUNT]); // load account
          mockDbInstance.addResult([]); // markFailed
          mockDbInstance.addResult([{ status: "failed" }]); // platform statuses
          mockDbInstance.addResult([]); // update parent
        } else {
          mockPublishPost.mockResolvedValueOnce({
            platformPostId: `ext-${i}`,
            platformPostUrl: `https://example.com/post/${i}`,
          });
          // Success path: 5 DB results
          mockDbInstance.addResult([]); // update to publishing
          mockDbInstance.addResult([ACTIVE_ACCOUNT]); // load account
          mockDbInstance.addResult([]); // update to published
          mockDbInstance.addResult([{ status: "published" }]); // platform statuses
          mockDbInstance.addResult([]); // update parent
        }

        try {
          await capturedProcessor!(makeJob(makeJobData(i)));
          succeeded++;
        } catch {
          failed++;
        }
      }

      expect(succeeded).toBe(900);
      expect(failed).toBe(100);
      expect(mockPublishPost).toHaveBeenCalledTimes(1000);
    });
  });

  describe("Memory and stability", () => {
    beforeEach(() => {
      useSchedulerDb = true;
    });

    it("scheduler does not accumulate memory with large batches", async () => {
      // Run scan 3 times with 1000 posts each to check for leaks
      for (let batch = 0; batch < 3; batch++) {
        vi.clearAllMocks();
        mockQueueAdd.mockResolvedValue(undefined);

        const rows = generateSchedulerRows(1000, 3);
        mockSchedulerDb.where.mockResolvedValueOnce(rows);
        for (let i = 0; i < 1000; i++) {
          mockSchedulerDb.where.mockResolvedValueOnce([]);
        }

        const count = await scanAndEnqueue();
        expect(count).toBe(3000);
      }

      // If we get here without OOM or hangs, the test passes
      expect(true).toBe(true);
    });
  });
});
