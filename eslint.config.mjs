import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import nextConfig from "eslint-config-next";

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/coverage/**",
      "**/.turbo/**",
    ],
  },

  // TypeScript rules for all packages
  ...tseslint.configs.recommended,

  // Next.js rules scoped to the web app
  ...nextConfig.map((config) => ({
    ...config,
    files: ["apps/web/**/*.ts", "apps/web/**/*.tsx", "apps/web/**/*.js"],
  })),

  // Prettier compat (disables formatting rules that conflict)
  eslintConfigPrettier,

  // Shared overrides for all TS files
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },

  // Test file overrides
  {
    files: ["**/__tests__/**/*.ts", "**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);
