import type { PublishingAdapter, PublishInput, PublishResult } from "../publishing-adapter";
import { PlatformPublishError } from "../publishing-adapter";

const BSKY_API = "https://bsky.social/xrpc";

export class BlueskyPublisher implements PublishingAdapter {
  async publishPost(
    accessToken: string,
    input: PublishInput,
    platformUserId?: string,
  ): Promise<PublishResult> {
    if (!platformUserId) {
      throw new PlatformPublishError("Bluesky publish requires platformUserId (DID)", 400);
    }

    const text = input.hashtags?.length
      ? `${input.content}\n\n${input.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}`
      : input.content;

    const res = await fetch(`${BSKY_API}/com.atproto.repo.createRecord`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        repo: platformUserId,
        collection: "app.bsky.feed.post",
        record: {
          $type: "app.bsky.feed.post",
          text,
          createdAt: new Date().toISOString(),
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new PlatformPublishError(
        `Bluesky publish failed (${res.status}): ${body}`,
        res.status,
      );
    }

    const data = await res.json();
    // URI format: at://did:plc:xxx/app.bsky.feed.post/rkey
    const rkey = data.uri?.split("/").pop() ?? "";
    return {
      platformPostId: data.cid,
      platformPostUrl: `https://bsky.app/profile/${platformUserId}/post/${rkey}`,
    };
  }
}
