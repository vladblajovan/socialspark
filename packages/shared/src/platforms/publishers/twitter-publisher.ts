import type { PublishingAdapter, PublishInput, PublishResult } from "../publishing-adapter";
import { PlatformPublishError } from "../publishing-adapter";

export class TwitterPublisher implements PublishingAdapter {
  async publishPost(accessToken: string, input: PublishInput): Promise<PublishResult> {
    const text = input.hashtags?.length
      ? `${input.content}\n\n${input.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}`
      : input.content;

    const res = await fetch("https://api.x.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      const body = await res.text();
      const retryAfter = res.headers.get("retry-after");
      throw new PlatformPublishError(
        `Twitter publish failed (${res.status}): ${body}`,
        res.status,
        retryAfter ? parseInt(retryAfter, 10) : undefined,
      );
    }

    const { data } = await res.json();
    return {
      platformPostId: data.id,
      platformPostUrl: `https://x.com/i/web/status/${data.id}`,
    };
  }
}
