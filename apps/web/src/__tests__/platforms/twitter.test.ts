import { describe, it, expect, vi, beforeEach } from "vitest";
import { TwitterAdapter } from "@/lib/platforms/twitter";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Mock env vars
vi.stubEnv("TWITTER_CLIENT_ID", "test-client-id");
vi.stubEnv("TWITTER_CLIENT_SECRET", "test-client-secret");

describe("TwitterAdapter", () => {
  let adapter: TwitterAdapter;

  beforeEach(() => {
    mockFetch.mockReset();
    adapter = new TwitterAdapter();
  });

  describe("exchangeCodeForTokens", () => {
    it("exchanges code for tokens", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: "at-123",
          refresh_token: "rt-456",
          expires_in: 7200,
          scope: "tweet.read tweet.write",
        }),
      });

      const result = await adapter.exchangeCodeForTokens(
        "auth-code",
        "http://localhost:3000/api/platforms/twitter/callback",
        "verifier-123",
      );

      expect(result.accessToken).toBe("at-123");
      expect(result.refreshToken).toBe("rt-456");
      expect(result.expiresIn).toBe(7200);
      expect(result.scope).toBe("tweet.read tweet.write");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.twitter.com/2/oauth2/token",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/x-www-form-urlencoded",
          }),
        }),
      );
    });

    it("throws on failed exchange", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => "Bad Request",
      });

      await expect(
        adapter.exchangeCodeForTokens("bad-code", "http://localhost:3000/callback"),
      ).rejects.toThrow("Twitter token exchange failed (400)");
    });
  });

  describe("fetchUserInfo", () => {
    it("fetches user info", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            id: "123",
            username: "testuser",
            name: "Test User",
            profile_image_url: "https://pbs.twimg.com/pic.jpg",
          },
        }),
      });

      const result = await adapter.fetchUserInfo("at-123");

      expect(result.platformUserId).toBe("123");
      expect(result.platformUsername).toBe("testuser");
      expect(result.platformDisplayName).toBe("Test User");
      expect(result.platformAvatarUrl).toBe("https://pbs.twimg.com/pic.jpg");
    });

    it("throws on failed user info fetch", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      });

      await expect(adapter.fetchUserInfo("bad-token")).rejects.toThrow(
        "Twitter user info failed (401)",
      );
    });
  });

  describe("refreshAccessToken", () => {
    it("refreshes token", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: "new-at",
          refresh_token: "new-rt",
          expires_in: 7200,
          scope: "tweet.read",
        }),
      });

      const result = await adapter.refreshAccessToken("rt-456");

      expect(result.accessToken).toBe("new-at");
      expect(result.refreshToken).toBe("new-rt");
      expect(result.expiresIn).toBe(7200);
    });

    it("throws on failed refresh", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => "Invalid refresh token",
      });

      await expect(adapter.refreshAccessToken("bad-rt")).rejects.toThrow(
        "Twitter token refresh failed (400)",
      );
    });
  });
});
