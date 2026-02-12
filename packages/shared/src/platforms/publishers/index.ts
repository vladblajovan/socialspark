import type { Platform } from "../../constants";
import type { PublishingAdapter } from "../publishing-adapter";
import { TwitterPublisher } from "./twitter-publisher";
import { LinkedInPublisher } from "./linkedin-publisher";
import { BlueskyPublisher } from "./bluesky-publisher";

export { TwitterPublisher, LinkedInPublisher, BlueskyPublisher };

const publishers: Partial<Record<Platform, PublishingAdapter>> = {
  twitter: new TwitterPublisher(),
  linkedin: new LinkedInPublisher(),
  bluesky: new BlueskyPublisher(),
};

export function getPublishingAdapter(platform: Platform): PublishingAdapter {
  const adapter = publishers[platform];
  if (!adapter) {
    throw new Error(`Publishing not yet supported for platform: ${platform}`);
  }
  return adapter;
}
