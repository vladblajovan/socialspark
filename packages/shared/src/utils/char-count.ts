import type { Platform } from "../constants";
import { PLATFORM_CHARACTER_LIMITS } from "../constants";

/**
 * Count characters in a platform-aware way.
 * Bluesky uses grapheme clusters (via Intl.Segmenter).
 * All other platforms use string length.
 */
export function getCharacterCount(text: string, platform: Platform): number {
  if (!text) return 0;

  if (platform === "bluesky") {
    if (typeof Intl !== "undefined" && Intl.Segmenter) {
      const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
      return [...segmenter.segment(text)].length;
    }
    // Fallback for environments without Intl.Segmenter
    return [...text].length;
  }

  return text.length;
}

/**
 * Get the character limit for a given platform.
 */
export function getCharacterLimit(platform: Platform): number {
  return PLATFORM_CHARACTER_LIMITS[platform];
}

/**
 * Check if text exceeds the character limit for a given platform.
 */
export function isOverLimit(text: string, platform: Platform): boolean {
  return getCharacterCount(text, platform) > getCharacterLimit(platform);
}
