FROM node:20-alpine AS base

RUN corepack enable

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/worker/package.json ./apps/worker/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY packages/email/package.json ./packages/email/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/db/ ./packages/db/
COPY packages/shared/ ./packages/shared/
COPY packages/email/ ./packages/email/
COPY apps/worker/ ./apps/worker/

CMD ["pnpm", "--filter", "@socialspark/worker", "start"]
