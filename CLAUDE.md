# SocialSpark

AI-native social media scheduling platform. "Write once. Publish everywhere. Optimized by AI."

## Project Overview

SocialSpark is a multi-platform social media scheduling and content creation tool targeting creators and small teams (2-10 people). The primary differentiator is an AI content engine that generates and auto-adapts content per platform from a single draft.

**Target platforms**: Instagram, Facebook, X/Twitter, LinkedIn, TikTok, YouTube, Threads, Pinterest, Bluesky, Mastodon

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Next.js 15 (App Router) | React Server Components, Server Actions |
| Backend | Next.js API Routes | REST API at `/api/v1/*` |
| Database | PostgreSQL (Neon) | Serverless, branching for previews |
| ORM | Drizzle | Schema-as-code in `packages/db` |
| Background Jobs | BullMQ + Redis | Critical for scheduling reliability. Hosted on Railway |
| AI | Vercel AI SDK | Claude (primary), GPT-4o-mini (secondary) |
| Auth | Better Auth | JWT + refresh tokens, OAuth 2.0, RBAC |
| File Storage | Cloudflare R2 | S3-compatible, zero egress |
| Hosting | Vercel (web) + Railway (workers) | Split deployment |
| Monitoring | Sentry + Betterstack | Errors + uptime/logs |

## Project Structure (Monorepo)

```
apps/
  web/              # Next.js app (frontend + API routes)
  worker/           # BullMQ workers (scheduler, publisher, analytics sync, inbox sync, media processing, AI)
packages/
  db/               # Drizzle schema, migrations, seed
  shared/           # Types, constants, validators (Zod), platform adapters
  email/            # Email templates and sending
docs/               # Specifications (MVP features, functional, non-functional, technical)
```

Uses pnpm workspaces + Turborepo.

## Key Conventions

### TypeScript
- Strict mode enabled (`strict: true`)
- No `any` without explicit justification
- Shared types between frontend/backend live in `packages/shared`
- Zod for all runtime validation (API inputs, environment variables, external data)

### Code Style
- ESLint with strict config, zero warnings on main branch
- Prettier for formatting
- No `eslint-disable` without a comment explaining why

### API Design
- REST endpoints at `/api/v1/{resource}`
- Consistent response envelope: `{ data, meta, error }`
- Zod validation on all request inputs
- JWT auth via `Authorization: Bearer <token>` header

### Database
- All timestamps stored in UTC
- Migrations via Drizzle Kit, forward-only in production
- UUIDs for all primary keys (text type)
- OAuth tokens encrypted with AES-256-GCM at application level
- Partial indexes for performance (e.g., `WHERE status = 'scheduled'`)

### Platform Integrations
- Adapter pattern: each platform implements `PlatformAdapter` interface
- Adapters live in `packages/shared/platforms/`
- Never call platform APIs directly from route handlers; always go through the adapter

### Background Jobs
- BullMQ queues: `publishing`, `scheduling`, `analytics-sync`, `inbox-sync`, `media-processing`, `ai-generation`, `token-refresh`
- All jobs must be idempotent (safe to retry)
- Failed publishes retry up to 5 times with exponential backoff
- Dead letter queue for permanently failed jobs

### Testing
- Unit test coverage target: >80%
- E2E tests for all publishing flows
- Integration tests against real Docker-composed dependencies
- Tests run in CI before merge

## Key Commands

```bash
pnpm dev              # Start all apps in development
pnpm build            # Build all apps
pnpm test             # Run all tests
pnpm lint             # Lint all packages
pnpm db:generate      # Generate Drizzle migrations
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Drizzle Studio
```

## Architecture Rules

1. **Scheduling reliability is the #1 priority.** Posts must publish on time. The scheduler checks every 30 seconds with overlap to ensure nothing is missed.
2. **Monolith-first.** No microservices. Two deployments only: Vercel (web) + Railway (workers).
3. **Progressive disclosure UI.** Simple by default. Advanced features behind intentional interactions (expandable sections, "Advanced" tabs).
4. **AI adaptation is always available** on every tier, including free. Limit generation count, not the adaptation feature.
5. **Never store plaintext OAuth tokens.** Always AES-256-GCM encrypted at rest.
6. **Feature flags for all new features.** Database-backed flags evaluated at runtime.

## Documentation

- `docs/MVP_FEATURES.md` - Product features, personas, pricing strategy
- `docs/FUNCTIONAL_SPEC.md` - User stories, data model, API endpoints, platform integration details
- `docs/NON_FUNCTIONAL_SPEC.md` - Performance, security, scalability, compliance requirements
- `docs/TECHNICAL_APPROACH.md` - Stack comparison, architecture, implementation plan, DB schema

## Implementation Phases

| Phase | Weeks | Focus |
|-------|-------|-------|
| 1: Foundation | 1-3 | Auth, DB schema, UI shell, CI/CD |
| 2: Core Scheduling | 4-7 | Platform OAuth, editor, calendar, publishing pipeline |
| 3: AI Engine | 8-10 | Content generation, adaptation, smart composer |
| 4: Analytics & Inbox | 11-13 | Data sync, dashboards, unified inbox |
| 5: Team & Polish | 14-16 | Collaboration, approvals, onboarding |
| 6: Launch Prep | 17-18 | Load testing, security audit, beta launch |
