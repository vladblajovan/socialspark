import type { OAuthTokenResponse, PlatformUserInfo, BlueskyCredentials } from "../types/platform-oauth";

export interface PlatformAdapter {
  exchangeCodeForTokens(
    code: string,
    redirectUri: string,
    codeVerifier?: string,
  ): Promise<OAuthTokenResponse>;

  fetchUserInfo(accessToken: string, platformUserId?: string): Promise<PlatformUserInfo>;

  refreshAccessToken(refreshToken: string): Promise<OAuthTokenResponse>;

  authenticateWithCredentials?(
    credentials: BlueskyCredentials,
  ): Promise<OAuthTokenResponse & PlatformUserInfo>;
}
