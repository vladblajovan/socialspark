import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function createMockDb() {
  const db: Record<string, ReturnType<typeof vi.fn>> = {};
  const chainMethods = ["select", "from", "where", "limit", "update", "set"];

  for (const method of chainMethods) {
    db[method] = vi.fn();
  }

  for (const method of chainMethods) {
    db[method].mockReturnValue(db);
  }

  return db;
}

let mockDb = createMockDb();

vi.mock("../lib/db", () => ({
  getDb: () => mockDb,
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
    TWITTER_CLIENT_ID: "tw-client",
    TWITTER_CLIENT_SECRET: "tw-secret",
    LINKEDIN_CLIENT_ID: "li-client",
    LINKEDIN_CLIENT_SECRET: "li-secret",
  }),
}));

vi.mock("@socialspark/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@socialspark/shared")>();
  return {
    ...actual,
    decryptToken: vi.fn().mockReturnValue("decrypted-refresh-token"),
    encryptToken: vi.fn().mockReturnValue("newly-encrypted-token"),
  };
});

vi.mock("@socialspark/db", () => ({
  platformAccount: { id: "platformAccount.id" },
  eq: vi.fn(),
}));

import { tryRefreshToken } from "../workers/token-refresh-helper";

describe("Token Refresh Helper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = createMockDb();
  });

  it("returns null when account has no refresh token", async () => {
    mockDb.limit.mockResolvedValueOnce([{ id: "pa-1", refreshTokenEnc: null }]);

    const result = await tryRefreshToken("pa-1", "twitter");
    expect(result).toBeNull();
  });

  it("returns null when account not found", async () => {
    mockDb.limit.mockResolvedValueOnce([]);

    const result = await tryRefreshToken("pa-nonexistent", "twitter");
    expect(result).toBeNull();
  });

  it("returns null for unsupported platform", async () => {
    mockDb.limit.mockResolvedValueOnce([{ id: "pa-1", refreshTokenEnc: "enc-token" }]);

    const result = await tryRefreshToken("pa-1", "instagram");
    expect(result).toBeNull();
  });

  it("refreshes Twitter token successfully", async () => {
    mockDb.limit.mockResolvedValueOnce([{ id: "pa-1", refreshTokenEnc: "enc-token" }]);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: "new-twitter-access",
        refresh_token: "new-twitter-refresh",
        expires_in: 7200,
      }),
    });

    const result = await tryRefreshToken("pa-1", "twitter");

    expect(result).toBe("new-twitter-access");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.twitter.com/2/oauth2/token",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("refreshes LinkedIn token successfully", async () => {
    mockDb.limit.mockResolvedValueOnce([{ id: "pa-1", refreshTokenEnc: "enc-token" }]);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: "new-li-access",
        refresh_token: "new-li-refresh",
        expires_in: 5184000,
      }),
    });

    const result = await tryRefreshToken("pa-1", "linkedin");

    expect(result).toBe("new-li-access");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://www.linkedin.com/oauth/v2/accessToken",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("refreshes Bluesky token successfully", async () => {
    mockDb.limit.mockResolvedValueOnce([{ id: "pa-1", refreshTokenEnc: "enc-token" }]);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        accessJwt: "new-bsky-access",
        refreshJwt: "new-bsky-refresh",
      }),
    });

    const result = await tryRefreshToken("pa-1", "bluesky");

    expect(result).toBe("new-bsky-access");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://bsky.social/xrpc/com.atproto.server.refreshSession",
      expect.objectContaining({
        method: "POST",
        headers: { Authorization: "Bearer decrypted-refresh-token" },
      }),
    );
  });

  it("returns null and logs error when API refresh fails", async () => {
    mockDb.limit.mockResolvedValueOnce([{ id: "pa-1", refreshTokenEnc: "enc-token" }]);

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "Invalid refresh token",
    });

    const result = await tryRefreshToken("pa-1", "twitter");

    expect(result).toBeNull();
  });

  it("stores refreshed tokens in database", async () => {
    mockDb.limit.mockResolvedValueOnce([{ id: "pa-1", refreshTokenEnc: "enc-token" }]);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: "new-access",
        refresh_token: "new-refresh",
        expires_in: 3600,
      }),
    });

    await tryRefreshToken("pa-1", "twitter");

    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.set).toHaveBeenCalledWith(
      expect.objectContaining({
        accessTokenEnc: "newly-encrypted-token",
        refreshTokenEnc: "newly-encrypted-token",
      }),
    );
  });
});
