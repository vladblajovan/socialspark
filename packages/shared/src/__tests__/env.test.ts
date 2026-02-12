import { describe, it, expect } from "vitest";
import { serverEnvSchema, clientEnvSchema, validateServerEnv } from "../env";

const validServerEnv = {
  DATABASE_URL: "postgresql://user:pass@host/db",
  BETTER_AUTH_SECRET: "a".repeat(32),
  BETTER_AUTH_URL: "http://localhost:3000",
  ENCRYPTION_KEY: "b".repeat(32),
};

describe("serverEnvSchema", () => {
  it("accepts valid required fields", () => {
    const result = serverEnvSchema.safeParse(validServerEnv);
    expect(result.success).toBe(true);
  });

  it("rejects missing DATABASE_URL", () => {
    const { DATABASE_URL: _url, ...rest } = validServerEnv;
    const result = serverEnvSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects invalid DATABASE_URL (not a URL)", () => {
    const result = serverEnvSchema.safeParse({
      ...validServerEnv,
      DATABASE_URL: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing BETTER_AUTH_SECRET", () => {
    const { BETTER_AUTH_SECRET: _secret, ...rest } = validServerEnv;
    const result = serverEnvSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects BETTER_AUTH_SECRET shorter than 32 chars", () => {
    const result = serverEnvSchema.safeParse({
      ...validServerEnv,
      BETTER_AUTH_SECRET: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing BETTER_AUTH_URL", () => {
    const { BETTER_AUTH_URL: _authUrl, ...rest } = validServerEnv;
    const result = serverEnvSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("defaults NODE_ENV to development", () => {
    const result = serverEnvSchema.parse(validServerEnv);
    expect(result.NODE_ENV).toBe("development");
  });

  it("accepts valid NODE_ENV values", () => {
    for (const env of ["development", "test", "production"] as const) {
      const result = serverEnvSchema.safeParse({
        ...validServerEnv,
        NODE_ENV: env,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid NODE_ENV", () => {
    const result = serverEnvSchema.safeParse({
      ...validServerEnv,
      NODE_ENV: "staging",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields when omitted", () => {
    const result = serverEnvSchema.parse(validServerEnv);
    expect(result.GOOGLE_CLIENT_ID).toBeUndefined();
    expect(result.REDIS_URL).toBeUndefined();
    expect(result.ANTHROPIC_API_KEY).toBeUndefined();
    expect(result.SENTRY_DSN).toBeUndefined();
  });

  it("accepts optional fields when provided", () => {
    const result = serverEnvSchema.parse({
      ...validServerEnv,
      GOOGLE_CLIENT_ID: "google-id",
      GOOGLE_CLIENT_SECRET: "google-secret",
      REDIS_URL: "redis://localhost:6379",
      ANTHROPIC_API_KEY: "sk-ant-xxx",
    });
    expect(result.GOOGLE_CLIENT_ID).toBe("google-id");
    expect(result.REDIS_URL).toBe("redis://localhost:6379");
  });
});

describe("clientEnvSchema", () => {
  it("defaults NEXT_PUBLIC_APP_URL to localhost", () => {
    const result = clientEnvSchema.parse({});
    expect(result.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
  });

  it("accepts a custom app URL", () => {
    const result = clientEnvSchema.parse({
      NEXT_PUBLIC_APP_URL: "https://socialspark.app",
    });
    expect(result.NEXT_PUBLIC_APP_URL).toBe("https://socialspark.app");
  });

  it("rejects invalid app URL", () => {
    const result = clientEnvSchema.safeParse({
      NEXT_PUBLIC_APP_URL: "not-a-url",
    });
    expect(result.success).toBe(false);
  });
});

describe("validateServerEnv", () => {
  it("throws on invalid env", () => {
    expect(() => validateServerEnv()).toThrow("Invalid environment variables");
  });
});
