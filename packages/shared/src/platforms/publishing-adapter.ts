import type { Platform } from "../constants";

export interface PublishInput {
  content: string;
  hashtags?: string[];
}

export interface PublishResult {
  platformPostId: string;
  platformPostUrl: string;
}

export interface PublishingAdapter {
  publishPost(
    accessToken: string,
    input: PublishInput,
    platformUserId?: string,
  ): Promise<PublishResult>;
}

export class PlatformPublishError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly retryAfter?: number,
  ) {
    super(message);
    this.name = "PlatformPublishError";
  }
}

export const SUPPORTED_PUBLISHING_PLATFORMS: Platform[] = [
  "twitter",
  "linkedin",
  "bluesky",
];
