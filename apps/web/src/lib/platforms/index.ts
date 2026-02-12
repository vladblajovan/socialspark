import type { PlatformAdapter } from "@socialspark/shared";
import type { Platform } from "@socialspark/shared";
import { TwitterAdapter } from "./twitter";
import { LinkedInAdapter } from "./linkedin";
import { BlueskyAdapter } from "./bluesky";

const adapters: Partial<Record<Platform, PlatformAdapter>> = {
  twitter: new TwitterAdapter(),
  linkedin: new LinkedInAdapter(),
  bluesky: new BlueskyAdapter(),
};

export function getPlatformAdapter(platform: Platform): PlatformAdapter {
  const adapter = adapters[platform];
  if (!adapter) {
    throw new Error(`No adapter available for platform: ${platform}`);
  }
  return adapter;
}
