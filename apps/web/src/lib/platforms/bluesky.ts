import type { PlatformAdapter } from "@socialspark/shared";
import type {
  OAuthTokenResponse,
  PlatformUserInfo,
  BlueskyCredentials,
} from "@socialspark/shared";

const BSKY_API = "https://bsky.social/xrpc";

export class BlueskyAdapter implements PlatformAdapter {
  async exchangeCodeForTokens(
    _code: string,
    _redirectUri: string,
    _codeVerifier?: string,
  ): Promise<OAuthTokenResponse> {
    throw new Error("Bluesky uses credential-based auth, not OAuth code exchange");
  }

  async fetchUserInfo(accessToken: string, did?: string): Promise<PlatformUserInfo> {
    if (!did) {
      throw new Error("Bluesky fetchUserInfo requires a DID");
    }

    const res = await fetch(
      `${BSKY_API}/app.bsky.actor.getProfile?actor=${encodeURIComponent(did)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Bluesky profile fetch failed (${res.status}): ${body}`);
    }

    const data = await res.json();
    return {
      platformUserId: data.did,
      platformUsername: data.handle,
      platformDisplayName: data.displayName ?? data.handle,
      platformAvatarUrl: data.avatar,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokenResponse> {
    const res = await fetch(`${BSKY_API}/com.atproto.server.refreshSession`, {
      method: "POST",
      headers: { Authorization: `Bearer ${refreshToken}` },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Bluesky token refresh failed (${res.status}): ${body}`);
    }

    const data = await res.json();
    return {
      accessToken: data.accessJwt,
      refreshToken: data.refreshJwt,
    };
  }

  async authenticateWithCredentials(
    credentials: BlueskyCredentials,
  ): Promise<OAuthTokenResponse & PlatformUserInfo> {
    const res = await fetch(`${BSKY_API}/com.atproto.server.createSession`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: credentials.handle,
        password: credentials.appPassword,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Bluesky authentication failed (${res.status}): ${body}`);
    }

    const data = await res.json();

    const profileRes = await fetch(
      `${BSKY_API}/app.bsky.actor.getProfile?actor=${encodeURIComponent(data.did)}`,
      { headers: { Authorization: `Bearer ${data.accessJwt}` } },
    );

    let displayName = data.handle;
    let avatarUrl: string | undefined;
    if (profileRes.ok) {
      const profile = await profileRes.json();
      displayName = profile.displayName ?? data.handle;
      avatarUrl = profile.avatar;
    }

    return {
      accessToken: data.accessJwt,
      refreshToken: data.refreshJwt,
      platformUserId: data.did,
      platformUsername: data.handle,
      platformDisplayName: displayName,
      platformAvatarUrl: avatarUrl,
    };
  }
}
