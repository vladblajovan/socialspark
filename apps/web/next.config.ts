import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  transpilePackages: ["@socialspark/db", "@socialspark/shared"],
};

export default withSentryConfig(nextConfig, {
  // Source map upload disabled until SENTRY_AUTH_TOKEN is configured
  sourcemaps: {
    disable: true,
  },
  // Suppress build logs unless in CI
  silent: !process.env.CI,
  // Disable telemetry
  telemetry: false,
});
