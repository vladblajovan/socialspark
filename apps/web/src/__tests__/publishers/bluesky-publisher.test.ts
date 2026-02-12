import { describe, it, expect, vi, beforeEach } from "vitest";
import { PlatformPublishError, BlueskyPublisher } from "@socialspark/shared";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("BlueskyPublisher", () => {
  let publisher: BlueskyPublisher;

  beforeEach(() => {
    mockFetch.mockReset();
    publisher = new BlueskyPublisher();
  });

  it("publishes a Bluesky post successfully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        uri: "at://did:plc:abc123/app.bsky.feed.post/rkey456",
        cid: "bafyrei123",
      }),
    });

    const result = await publisher.publishPost(
      "access-token",
      { content: "Hello Bluesky!" },
      "did:plc:abc123",
    );

    expect(result.platformPostId).toBe("bafyrei123");
    expect(result.platformPostUrl).toBe(
      "https://bsky.app/profile/did:plc:abc123/post/rkey456",
    );

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe("https://bsky.social/xrpc/com.atproto.repo.createRecord");
    const body = JSON.parse(opts.body);
    expect(body.repo).toBe("did:plc:abc123");
    expect(body.collection).toBe("app.bsky.feed.post");
    expect(body.record.text).toBe("Hello Bluesky!");
    expect(body.record.$type).toBe("app.bsky.feed.post");
  });

  it("throws when platformUserId is missing", async () => {
    await expect(
      publisher.publishPost("token", { content: "test" }),
    ).rejects.toThrow("Bluesky publish requires platformUserId");
  });

  it("appends hashtags to text", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        uri: "at://did:plc:abc/app.bsky.feed.post/rkey",
        cid: "cid123",
      }),
    });

    await publisher.publishPost(
      "token",
      { content: "Post", hashtags: ["bsky"] },
      "did:plc:abc",
    );

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.record.text).toBe("Post\n\n#bsky");
  });

  it("throws PlatformPublishError on failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => "Invalid record",
    });

    try {
      await publisher.publishPost("token", { content: "test" }, "did:plc:abc");
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(PlatformPublishError);
      expect((err as PlatformPublishError).statusCode).toBe(400);
    }
  });
});
