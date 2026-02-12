import { describe, it, expect, vi, beforeEach } from "vitest";
import { PlatformPublishError, LinkedInPublisher } from "@socialspark/shared";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("LinkedInPublisher", () => {
  let publisher: LinkedInPublisher;

  beforeEach(() => {
    mockFetch.mockReset();
    publisher = new LinkedInPublisher();
  });

  it("publishes a LinkedIn post successfully", async () => {
    const headers = new Headers();
    headers.set("x-restli-id", "urn:li:share:123456");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers,
    });

    const result = await publisher.publishPost(
      "access-token",
      { content: "Hello LinkedIn!" },
      "user-sub-id",
    );

    expect(result.platformPostId).toBe("urn:li:share:123456");
    expect(result.platformPostUrl).toBe(
      "https://www.linkedin.com/feed/update/urn:li:share:123456",
    );

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.linkedin.com/rest/posts");
    const body = JSON.parse(opts.body);
    expect(body.author).toBe("urn:li:person:user-sub-id");
    expect(body.commentary).toBe("Hello LinkedIn!");
    expect(body.visibility).toBe("PUBLIC");
  });

  it("throws when platformUserId is missing", async () => {
    await expect(
      publisher.publishPost("token", { content: "test" }),
    ).rejects.toThrow("LinkedIn publish requires platformUserId");
  });

  it("appends hashtags to commentary", async () => {
    const headers = new Headers();
    headers.set("x-restli-id", "urn:li:share:789");

    mockFetch.mockResolvedValueOnce({ ok: true, headers });

    await publisher.publishPost(
      "token",
      { content: "My post", hashtags: ["hiring", "#tech"] },
      "user-123",
    );

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.commentary).toBe("My post\n\n#hiring #tech");
  });

  it("throws PlatformPublishError on failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      text: async () => "Validation error",
      headers: new Headers(),
    });

    await expect(
      publisher.publishPost("token", { content: "test" }, "user-id"),
    ).rejects.toThrow(PlatformPublishError);
  });
});
