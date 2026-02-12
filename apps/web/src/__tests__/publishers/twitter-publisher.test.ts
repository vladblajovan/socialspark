import { describe, it, expect, vi, beforeEach } from "vitest";
import { PlatformPublishError, TwitterPublisher } from "@socialspark/shared";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("TwitterPublisher", () => {
  let publisher: TwitterPublisher;

  beforeEach(() => {
    mockFetch.mockReset();
    publisher = new TwitterPublisher();
  });

  it("publishes a tweet successfully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { id: "tweet-123" },
      }),
    });

    const result = await publisher.publishPost("access-token", {
      content: "Hello world!",
    });

    expect(result.platformPostId).toBe("tweet-123");
    expect(result.platformPostUrl).toBe("https://x.com/i/web/status/tweet-123");

    expect(mockFetch).toHaveBeenCalledWith("https://api.x.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: "Bearer access-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: "Hello world!" }),
    });
  });

  it("appends hashtags to content", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: "tweet-456" } }),
    });

    await publisher.publishPost("token", {
      content: "My post",
      hashtags: ["test", "#dev"],
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.text).toBe("My post\n\n#test #dev");
  });

  it("throws PlatformPublishError on failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () => "Forbidden",
      headers: new Map(),
    });

    await expect(
      publisher.publishPost("token", { content: "test" }),
    ).rejects.toThrow(PlatformPublishError);
  });

  it("includes retry-after on 429", async () => {
    const headers = new Headers();
    headers.set("retry-after", "60");

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => "Rate limited",
      headers,
    });

    try {
      await publisher.publishPost("token", { content: "test" });
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(PlatformPublishError);
      expect((err as PlatformPublishError).statusCode).toBe(429);
      expect((err as PlatformPublishError).retryAfter).toBe(60);
    }
  });
});
