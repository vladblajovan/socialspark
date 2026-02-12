import { describe, it, expect } from "vitest";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateOAuthState,
  verifyOAuthState,
} from "@/lib/platforms/oauth-state";

const TEST_SECRET = "test-secret-at-least-32-characters-long!!";

describe("PKCE", () => {
  it("generates a code verifier of sufficient length", () => {
    const verifier = generateCodeVerifier();
    expect(verifier.length).toBeGreaterThanOrEqual(32);
    expect(verifier).toMatch(/^[a-zA-Z0-9\-._~]+$/);
  });

  it("generates different verifiers each time", () => {
    const a = generateCodeVerifier();
    const b = generateCodeVerifier();
    expect(a).not.toBe(b);
  });

  it("generates a valid code challenge from a verifier", async () => {
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    expect(challenge).toBeTruthy();
    expect(challenge).toMatch(/^[a-zA-Z0-9_-]+$/); // base64url
    expect(challenge).not.toBe(verifier);
  });

  it("produces consistent challenges for the same verifier", async () => {
    const verifier = generateCodeVerifier();
    const a = await generateCodeChallenge(verifier);
    const b = await generateCodeChallenge(verifier);
    expect(a).toBe(b);
  });
});

describe("OAuth State", () => {
  it("generates and verifies state round-trip", () => {
    const teamId = "team-123";
    const { state, csrf } = generateOAuthState(teamId, TEST_SECRET);

    expect(state).toContain(".");
    expect(csrf).toBeTruthy();

    const result = verifyOAuthState(state, csrf, TEST_SECRET);
    expect(result.teamId).toBe(teamId);
  });

  it("rejects state with wrong secret", () => {
    const { state, csrf } = generateOAuthState("team-123", TEST_SECRET);
    expect(() => verifyOAuthState(state, csrf, "wrong-secret-that-is-32-chars-long!!")).toThrow(
      "Invalid OAuth state signature",
    );
  });

  it("rejects state with wrong CSRF", () => {
    const { state } = generateOAuthState("team-123", TEST_SECRET);
    expect(() => verifyOAuthState(state, "wrong-csrf", TEST_SECRET)).toThrow(
      "CSRF token mismatch",
    );
  });

  it("rejects invalid state format", () => {
    expect(() => verifyOAuthState("no-dot-here", "csrf", TEST_SECRET)).toThrow(
      "Invalid OAuth state format",
    );
  });

  it("rejects tampered state payload", () => {
    const { state, csrf } = generateOAuthState("team-123", TEST_SECRET);
    const [, signature] = state.split(".");
    const tamperedPayload = Buffer.from(JSON.stringify({ teamId: "hacked", csrf })).toString(
      "base64url",
    );
    expect(() =>
      verifyOAuthState(`${tamperedPayload}.${signature}`, csrf, TEST_SECRET),
    ).toThrow("Invalid OAuth state signature");
  });

  it("generates unique csrf tokens each time", () => {
    const a = generateOAuthState("team-1", TEST_SECRET);
    const b = generateOAuthState("team-1", TEST_SECRET);
    expect(a.csrf).not.toBe(b.csrf);
    expect(a.state).not.toBe(b.state);
  });
});
