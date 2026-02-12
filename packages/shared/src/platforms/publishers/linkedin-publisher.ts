import type { PublishingAdapter, PublishInput, PublishResult } from "../publishing-adapter";
import { PlatformPublishError } from "../publishing-adapter";

export class LinkedInPublisher implements PublishingAdapter {
  async publishPost(
    accessToken: string,
    input: PublishInput,
    platformUserId?: string,
  ): Promise<PublishResult> {
    if (!platformUserId) {
      throw new PlatformPublishError("LinkedIn publish requires platformUserId (person URN sub)", 400);
    }

    const commentary = input.hashtags?.length
      ? `${input.content}\n\n${input.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}`
      : input.content;

    const authorUrn = `urn:li:person:${platformUserId}`;

    const res = await fetch("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
        "LinkedIn-Version": "202401",
      },
      body: JSON.stringify({
        author: authorUrn,
        commentary,
        visibility: "PUBLIC",
        distribution: {
          feedDistribution: "MAIN_FEED",
        },
        lifecycleState: "PUBLISHED",
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      const retryAfter = res.headers.get("retry-after");
      throw new PlatformPublishError(
        `LinkedIn publish failed (${res.status}): ${body}`,
        res.status,
        retryAfter ? parseInt(retryAfter, 10) : undefined,
      );
    }

    const postUrn = res.headers.get("x-restli-id") ?? "";
    return {
      platformPostId: postUrn,
      platformPostUrl: `https://www.linkedin.com/feed/update/${postUrn}`,
    };
  }
}
