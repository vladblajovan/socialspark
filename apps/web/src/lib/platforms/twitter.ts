import type { PlatformAdapter } from "@socialspark/shared";
import type { OAuthTokenResponse, PlatformUserInfo } from "@socialspark/shared";
import { twitterOAuthConfig } from "@socialspark/shared";

export class TwitterAdapter implements PlatformAdapter {
  private clientId = process.env.TWITTER_CLIENT_ID!;
  private clientSecret = process.env.TWITTER_CLIENT_SECRET!;

  async exchangeCodeForTokens(
    code: string,
    redirectUri: string,
    codeVerifier?: string,
  ): Promise<OAuthTokenResponse> {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier ?? "",
    });

    const res = await fetch(twitterOAuthConfig.tokenUrl!, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`,
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Twitter token exchange failed (${res.status}): ${body}`);
    }

    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      scope: data.scope,
    };
  }

  async fetchUserInfo(accessToken: string): Promise<PlatformUserInfo> {
    const res = await fetch(
      "https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,name",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Twitter user info failed (${res.status}): ${body}`);
    }

    const { data } = await res.json();
    return {
      platformUserId: data.id,
      platformUsername: data.username,
      platformDisplayName: data.name,
      platformAvatarUrl: data.profile_image_url,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokenResponse> {
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    const res = await fetch(twitterOAuthConfig.tokenUrl!, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`,
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Twitter token refresh failed (${res.status}): ${body}`);
    }

    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      scope: data.scope,
    };
  }
}
