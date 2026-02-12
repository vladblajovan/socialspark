import type { Platform } from "../constants";
import type { OAuthConfig } from "../types/platform-oauth";

export const twitterOAuthConfig: OAuthConfig = {
  platform: "twitter",
  flowType: "oauth2-pkce",
  authorizeUrl: "https://x.com/i/oauth2/authorize",
  tokenUrl: "https://api.twitter.com/2/oauth2/token",
  scopes: ["tweet.read", "tweet.write", "users.read"],
  clientIdEnvKey: "TWITTER_CLIENT_ID",
  clientSecretEnvKey: "TWITTER_CLIENT_SECRET",
  accessTokenLifetimeSec: 7200, // 2 hours
  supportsRefresh: false,
};

export const linkedinOAuthConfig: OAuthConfig = {
  platform: "linkedin",
  flowType: "oauth2",
  authorizeUrl: "https://www.linkedin.com/oauth/v2/authorization",
  tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
  scopes: ["openid", "profile", "w_member_social"],
  clientIdEnvKey: "LINKEDIN_CLIENT_ID",
  clientSecretEnvKey: "LINKEDIN_CLIENT_SECRET",
  accessTokenLifetimeSec: 5184000, // 60 days
  supportsRefresh: true,
};

export const blueskyOAuthConfig: OAuthConfig = {
  platform: "bluesky",
  flowType: "credentials",
  scopes: [],
  supportsRefresh: true,
};

const oauthConfigMap: Partial<Record<Platform, OAuthConfig>> = {
  twitter: twitterOAuthConfig,
  linkedin: linkedinOAuthConfig,
  bluesky: blueskyOAuthConfig,
};

export function getPlatformOAuthConfig(platform: Platform): OAuthConfig | undefined {
  return oauthConfigMap[platform];
}
