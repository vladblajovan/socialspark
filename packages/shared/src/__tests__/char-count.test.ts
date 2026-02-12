import { describe, it, expect } from "vitest";
import { getCharacterCount, getCharacterLimit, isOverLimit } from "../utils/char-count";
import { PLATFORM_CHARACTER_LIMITS } from "../constants";

describe("getCharacterCount", () => {
  it("counts standard characters for most platforms", () => {
    expect(getCharacterCount("Hello!", "twitter")).toBe(6);
    expect(getCharacterCount("Hello!", "linkedin")).toBe(6);
    expect(getCharacterCount("Hello!", "facebook")).toBe(6);
  });

  it("counts grapheme clusters for Bluesky", () => {
    // Basic ASCII
    expect(getCharacterCount("Hello", "bluesky")).toBe(5);
    // Emoji (single grapheme, multiple code points)
    expect(getCharacterCount("Hi 👋", "bluesky")).toBe(4);
    // Family emoji (single grapheme via ZWJ)
    expect(getCharacterCount("👨‍👩‍👧‍👦", "bluesky")).toBe(1);
  });

  it("uses string.length for Twitter (emoji counts as 2)", () => {
    const text = "Hi 👋";
    // string.length counts surrogate pairs
    expect(getCharacterCount(text, "twitter")).toBe(text.length);
  });

  it("handles empty string", () => {
    expect(getCharacterCount("", "twitter")).toBe(0);
    expect(getCharacterCount("", "bluesky")).toBe(0);
  });

  it("handles unicode text for non-Bluesky platforms", () => {
    const text = "日本語テスト";
    expect(getCharacterCount(text, "linkedin")).toBe(text.length);
  });
});

describe("getCharacterLimit", () => {
  it("returns correct limits for all platforms", () => {
    expect(getCharacterLimit("twitter")).toBe(280);
    expect(getCharacterLimit("linkedin")).toBe(3000);
    expect(getCharacterLimit("bluesky")).toBe(300);
    expect(getCharacterLimit("instagram")).toBe(2200);
    expect(getCharacterLimit("facebook")).toBe(63206);
    expect(getCharacterLimit("threads")).toBe(500);
    expect(getCharacterLimit("pinterest")).toBe(500);
    expect(getCharacterLimit("tiktok")).toBe(2200);
    expect(getCharacterLimit("youtube")).toBe(5000);
    expect(getCharacterLimit("mastodon")).toBe(500);
  });

  it("matches PLATFORM_CHARACTER_LIMITS constant", () => {
    for (const [platform, limit] of Object.entries(PLATFORM_CHARACTER_LIMITS)) {
      expect(getCharacterLimit(platform as keyof typeof PLATFORM_CHARACTER_LIMITS)).toBe(limit);
    }
  });
});

describe("isOverLimit", () => {
  it("returns false when within limit", () => {
    expect(isOverLimit("Hello", "twitter")).toBe(false);
  });

  it("returns false at exact limit", () => {
    const text = "a".repeat(280);
    expect(isOverLimit(text, "twitter")).toBe(false);
  });

  it("returns true when over limit", () => {
    const text = "a".repeat(281);
    expect(isOverLimit(text, "twitter")).toBe(true);
  });

  it("uses grapheme counting for Bluesky", () => {
    // 300 chars is the limit for Bluesky
    const text = "a".repeat(300);
    expect(isOverLimit(text, "bluesky")).toBe(false);
    const overText = "a".repeat(301);
    expect(isOverLimit(overText, "bluesky")).toBe(true);
  });
});
