import { describe, it, expect } from "vitest";
import { encryptToken, decryptToken } from "../utils/crypto";

const TEST_KEY = "test-encryption-key-at-least-32-characters-long";

describe("encryptToken / decryptToken", () => {
  it("round-trips a token", () => {
    const plaintext = "oauth-access-token-12345";
    const encrypted = encryptToken(plaintext, TEST_KEY);
    const decrypted = decryptToken(encrypted, TEST_KEY);
    expect(decrypted).toBe(plaintext);
  });

  it("produces different ciphertext for the same plaintext (random IV)", () => {
    const plaintext = "same-token";
    const a = encryptToken(plaintext, TEST_KEY);
    const b = encryptToken(plaintext, TEST_KEY);
    expect(a).not.toBe(b);
    // Both should still decrypt correctly
    expect(decryptToken(a, TEST_KEY)).toBe(plaintext);
    expect(decryptToken(b, TEST_KEY)).toBe(plaintext);
  });

  it("handles empty string", () => {
    const encrypted = encryptToken("", TEST_KEY);
    expect(decryptToken(encrypted, TEST_KEY)).toBe("");
  });

  it("handles unicode content", () => {
    const plaintext = "token-with-emoji-🔑-and-中文";
    const encrypted = encryptToken(plaintext, TEST_KEY);
    expect(decryptToken(encrypted, TEST_KEY)).toBe(plaintext);
  });

  it("throws with wrong key", () => {
    const encrypted = encryptToken("secret", TEST_KEY);
    expect(() => decryptToken(encrypted, "wrong-key-that-is-also-32-characters")).toThrow();
  });

  it("throws with tampered ciphertext", () => {
    const encrypted = encryptToken("secret", TEST_KEY);
    const parts = encrypted.split(":");
    // Flip a character in the ciphertext
    parts[2] = parts[2].slice(0, -1) + (parts[2].slice(-1) === "0" ? "1" : "0");
    expect(() => decryptToken(parts.join(":"), TEST_KEY)).toThrow();
  });

  it("throws with tampered auth tag", () => {
    const encrypted = encryptToken("secret", TEST_KEY);
    const parts = encrypted.split(":");
    parts[1] = "0".repeat(32); // Invalid auth tag
    expect(() => decryptToken(parts.join(":"), TEST_KEY)).toThrow();
  });

  it("throws with invalid format", () => {
    expect(() => decryptToken("not-valid-format", TEST_KEY)).toThrow("Invalid encrypted token format");
    expect(() => decryptToken("only:two", TEST_KEY)).toThrow("Invalid encrypted token format");
  });

  it("output format is iv:authTag:ciphertext (hex)", () => {
    const encrypted = encryptToken("test", TEST_KEY);
    const parts = encrypted.split(":");
    expect(parts).toHaveLength(3);
    // IV = 12 bytes = 24 hex chars
    expect(parts[0]).toHaveLength(24);
    // Auth tag = 16 bytes = 32 hex chars
    expect(parts[1]).toHaveLength(32);
    // Ciphertext should be non-empty hex
    expect(parts[2]).toMatch(/^[0-9a-f]+$/);
  });
});
