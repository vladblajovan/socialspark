import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@socialspark/db", "@socialspark/shared"],
};

export default nextConfig;
