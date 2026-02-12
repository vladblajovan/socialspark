import { z } from "zod";

/**
 * Server-side environment variables schema.
 * Validates at startup - fail fast if misconfigured.
 */
export const serverEnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().describe("Neon PostgreSQL connection string"),

  // Auth
  BETTER_AUTH_SECRET: z.string().min(32).describe("Secret for signing auth tokens (min 32 chars)"),
  BETTER_AUTH_URL: z.string().url().describe("Base URL of the app (e.g. http://localhost:3000)"),

  // OAuth Providers
  GOOGLE_CLIENT_ID: z.string().optional().describe("Google OAuth client ID"),
  GOOGLE_CLIENT_SECRET: z.string().optional().describe("Google OAuth client secret"),
  GITHUB_CLIENT_ID: z.string().optional().describe("GitHub OAuth client ID"),
  GITHUB_CLIENT_SECRET: z.string().optional().describe("GitHub OAuth client secret"),

  // Redis (for BullMQ)
  REDIS_URL: z.string().url().optional().describe("Upstash Redis connection URL"),

  // AI Providers
  ANTHROPIC_API_KEY: z.string().optional().describe("Anthropic API key for Claude"),
  OPENAI_API_KEY: z.string().optional().describe("OpenAI API key for GPT models"),

  // File Storage (Cloudflare R2)
  R2_ACCOUNT_ID: z.string().optional().describe("Cloudflare account ID"),
  R2_ACCESS_KEY_ID: z.string().optional().describe("R2 access key ID"),
  R2_SECRET_ACCESS_KEY: z.string().optional().describe("R2 secret access key"),
  R2_BUCKET_NAME: z.string().optional().describe("R2 bucket name"),
  R2_PUBLIC_URL: z.string().url().optional().describe("R2 public bucket URL (via custom domain or r2.dev)"),

  // Email (Resend)
  RESEND_API_KEY: z.string().optional().describe("Resend API key for transactional email"),
  EMAIL_FROM: z.string().email().optional().describe("Default sender email address"),

  // Monitoring
  SENTRY_DSN: z.string().url().optional().describe("Sentry DSN for error tracking"),
  BETTERSTACK_API_KEY: z.string().optional().describe("Betterstack API key for uptime monitoring"),

  // Stripe
  STRIPE_SECRET_KEY: z.string().optional().describe("Stripe secret key (sk_test_... or sk_live_...)"),
  STRIPE_WEBHOOK_SECRET: z.string().optional().describe("Stripe webhook signing secret"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional().describe("Stripe publishable key"),

  // Platform OAuth - Social Media
  TWITTER_CLIENT_ID: z.string().optional().describe("X/Twitter OAuth 2.0 client ID"),
  TWITTER_CLIENT_SECRET: z.string().optional().describe("X/Twitter OAuth 2.0 client secret"),
  LINKEDIN_CLIENT_ID: z.string().optional().describe("LinkedIn OAuth client ID"),
  LINKEDIN_CLIENT_SECRET: z.string().optional().describe("LinkedIn OAuth client secret"),
  META_APP_ID: z.string().optional().describe("Meta (Facebook/Instagram) App ID"),
  META_APP_SECRET: z.string().optional().describe("Meta (Facebook/Instagram) App Secret"),
  TIKTOK_CLIENT_KEY: z.string().optional().describe("TikTok client key"),
  TIKTOK_CLIENT_SECRET: z.string().optional().describe("TikTok client secret"),
  YOUTUBE_CLIENT_ID: z.string().optional().describe("YouTube/Google OAuth client ID"),
  YOUTUBE_CLIENT_SECRET: z.string().optional().describe("YouTube/Google OAuth client secret"),
  PINTEREST_APP_ID: z.string().optional().describe("Pinterest app ID"),
  PINTEREST_APP_SECRET: z.string().optional().describe("Pinterest app secret"),

  // Encryption
  ENCRYPTION_KEY: z.string().min(32).optional().describe("AES-256 key for encrypting OAuth tokens at rest"),

  // App
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

/**
 * Client-side environment variables schema (NEXT_PUBLIC_ prefix).
 */
export const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

/**
 * Parse and validate server environment variables.
 * Call this at app startup to fail fast on missing config.
 */
export function validateServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables. Check server logs.");
  }
  return parsed.data;
}
