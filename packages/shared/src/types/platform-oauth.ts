import { z } from "zod";
import type { Platform } from "../constants";

export type OAuthFlowType = "oauth2" | "oauth2-pkce" | "credentials";

export interface OAuthConfig {
  platform: Platform;
  flowType: OAuthFlowType;
  authorizeUrl?: string;
  tokenUrl?: string;
  scopes: string[];
  clientIdEnvKey?: string;
  clientSecretEnvKey?: string;
  accessTokenLifetimeSec?: number;
  supportsRefresh: boolean;
}

export interface OAuthTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  scope?: string;
}

export interface PlatformUserInfo {
  platformUserId: string;
  platformUsername: string;
  platformDisplayName: string;
  platformAvatarUrl?: string;
}

export const blueskyCredentialsSchema = z.object({
  handle: z
    .string()
    .min(1, "Handle is required")
    .refine(
      (val) => val.includes(".") || !val.includes("@"),
      "Enter your handle (e.g. user.bsky.social), not your email",
    ),
  appPassword: z
    .string()
    .min(1, "App password is required"),
});

export type BlueskyCredentials = z.infer<typeof blueskyCredentialsSchema>;
