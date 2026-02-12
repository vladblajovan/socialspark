import { describe, it, expect, vi, beforeEach } from "vitest";
import { LinkedInAdapter } from "@/lib/platforms/linkedin";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

vi.stubEnv("LINKEDIN_CLIENT_ID", "test-client-id");
vi.stubEnv("LINKEDIN_CLIENT_SECRET", "test-client-secret");

describe("LinkedInAdapter", () => {
  let adapter: LinkedInAdapter;

  beforeEach(() => {
    mockFetch.mockReset();
    adapter = new LinkedInAdapter();
  });

  describe("exchangeCodeForTokens", () => {
    it("exchanges code for tokens", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: "li-at-123",
          refresh_token: "li-rt-456",
          expires_in: 5184000,
          scope: "openid profile w_member_social",
        }),
      });

      const result = await adapter.exchangeCodeForTokens(
        "auth-code",
        "http://localhost:3000/api/platforms/linkedin/callback",
      );

      expect(result.accessToken).toBe("li-at-123");
      expect(result.refreshToken).toBe("li-rt-456");
      expect(result.expiresIn).toBe(5184000);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://www.linkedin.com/oauth/v2/accessToken",
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("throws on failed exchange", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      });

      await expect(
        adapter.exchangeCodeForTokens("bad-code", "http://localhost:3000/callback"),
      ).rejects.toThrow("LinkedIn token exchange failed (401)");
    });
  });

  describe("fetchUserInfo", () => {
    it("fetches user info via OpenID Connect", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sub: "abc123",
          name: "Jane Doe",
          email: "jane@example.com",
          picture: "https://media.licdn.com/pic.jpg",
        }),
      });

      const result = await adapter.fetchUserInfo("li-at-123");

      expect(result.platformUserId).toBe("abc123");
      expect(result.platformUsername).toBe("jane@example.com");
      expect(result.platformDisplayName).toBe("Jane Doe");
      expect(result.platformAvatarUrl).toBe("https://media.licdn.com/pic.jpg");
    });

    it("uses sub as username when email is missing", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sub: "abc123",
          name: "Jane Doe",
        }),
      });

      const result = await adapter.fetchUserInfo("li-at-123");
      expect(result.platformUsername).toBe("abc123");
    });

    it("throws on failed user info fetch", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => "Forbidden",
      });

      await expect(adapter.fetchUserInfo("bad-token")).rejects.toThrow(
        "LinkedIn user info failed (403)",
      );
    });
  });

  describe("refreshAccessToken", () => {
    it("refreshes token", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: "new-li-at",
          refresh_token: "new-li-rt",
          expires_in: 5184000,
        }),
      });

      const result = await adapter.refreshAccessToken("li-rt-456");

      expect(result.accessToken).toBe("new-li-at");
      expect(result.refreshToken).toBe("new-li-rt");
    });

    it("throws on failed refresh", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => "Bad Request",
      });

      await expect(adapter.refreshAccessToken("bad-rt")).rejects.toThrow(
        "LinkedIn token refresh failed (400)",
      );
    });
  });
});
