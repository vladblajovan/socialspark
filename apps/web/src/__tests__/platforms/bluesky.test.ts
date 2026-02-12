import { describe, it, expect, vi, beforeEach } from "vitest";
import { BlueskyAdapter } from "@/lib/platforms/bluesky";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("BlueskyAdapter", () => {
  let adapter: BlueskyAdapter;

  beforeEach(() => {
    mockFetch.mockReset();
    adapter = new BlueskyAdapter();
  });

  describe("authenticateWithCredentials", () => {
    it("authenticates and fetches profile", async () => {
      // createSession call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          did: "did:plc:abc123",
          handle: "user.bsky.social",
          accessJwt: "bsky-at",
          refreshJwt: "bsky-rt",
        }),
      });

      // getProfile call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          did: "did:plc:abc123",
          handle: "user.bsky.social",
          displayName: "Cool User",
          avatar: "https://cdn.bsky.social/avatar.jpg",
        }),
      });

      const result = await adapter.authenticateWithCredentials({
        handle: "user.bsky.social",
        appPassword: "xxxx-xxxx-xxxx-xxxx",
      });

      expect(result.accessToken).toBe("bsky-at");
      expect(result.refreshToken).toBe("bsky-rt");
      expect(result.platformUserId).toBe("did:plc:abc123");
      expect(result.platformUsername).toBe("user.bsky.social");
      expect(result.platformDisplayName).toBe("Cool User");
      expect(result.platformAvatarUrl).toBe("https://cdn.bsky.social/avatar.jpg");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://bsky.social/xrpc/com.atproto.server.createSession",
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("falls back to handle when profile fetch fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          did: "did:plc:abc123",
          handle: "user.bsky.social",
          accessJwt: "bsky-at",
          refreshJwt: "bsky-rt",
        }),
      });

      mockFetch.mockResolvedValueOnce({ ok: false, status: 500, text: async () => "Error" });

      const result = await adapter.authenticateWithCredentials({
        handle: "user.bsky.social",
        appPassword: "xxxx-xxxx-xxxx-xxxx",
      });

      expect(result.platformDisplayName).toBe("user.bsky.social");
      expect(result.platformAvatarUrl).toBeUndefined();
    });

    it("throws on failed authentication", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => "Invalid credentials",
      });

      await expect(
        adapter.authenticateWithCredentials({
          handle: "bad.user",
          appPassword: "wrong",
        }),
      ).rejects.toThrow("Bluesky authentication failed (401)");
    });
  });

  describe("refreshAccessToken", () => {
    it("refreshes token using refreshJwt", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accessJwt: "new-bsky-at",
          refreshJwt: "new-bsky-rt",
        }),
      });

      const result = await adapter.refreshAccessToken("bsky-rt");

      expect(result.accessToken).toBe("new-bsky-at");
      expect(result.refreshToken).toBe("new-bsky-rt");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://bsky.social/xrpc/com.atproto.server.refreshSession",
        expect.objectContaining({
          method: "POST",
          headers: { Authorization: "Bearer bsky-rt" },
        }),
      );
    });

    it("throws on failed refresh", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => "Token expired",
      });

      await expect(adapter.refreshAccessToken("bad-rt")).rejects.toThrow(
        "Bluesky token refresh failed (400)",
      );
    });
  });

  describe("fetchUserInfo", () => {
    it("fetches profile by DID", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          did: "did:plc:abc123",
          handle: "user.bsky.social",
          displayName: "Cool User",
          avatar: "https://cdn.bsky.social/avatar.jpg",
        }),
      });

      const result = await adapter.fetchUserInfo("bsky-at", "did:plc:abc123");

      expect(result.platformUserId).toBe("did:plc:abc123");
      expect(result.platformUsername).toBe("user.bsky.social");
    });

    it("throws without DID", async () => {
      await expect(adapter.fetchUserInfo("bsky-at")).rejects.toThrow(
        "Bluesky fetchUserInfo requires a DID",
      );
    });
  });

  describe("exchangeCodeForTokens", () => {
    it("throws since Bluesky uses credentials", async () => {
      await expect(
        adapter.exchangeCodeForTokens("code", "redirect"),
      ).rejects.toThrow("Bluesky uses credential-based auth");
    });
  });
});
