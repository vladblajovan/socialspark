# SocialSpark - Technical Architecture & Implementation Plan

**Document Version**: 1.0
**Date**: February 2026
**Author**: SocialSpark Engineering
**Status**: Phase 2 - Complete (Week 7 done, landing page shipped)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Framework Candidates Comparison](#2-framework-candidates-comparison)
3. [Recommended Stack](#3-recommended-stack)
4. [Project Structure](#4-project-structure)
5. [Implementation Plan](#5-implementation-plan)
6. [Database Schema](#6-database-schema)
7. [Key Technical Risks & Mitigations](#7-key-technical-risks--mitigations)

---

## 1. Architecture Overview

### 1.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            CLIENTS                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │  Web App      │  │  Mobile Web  │  │  API Clients │                  │
│  │  (Next.js)    │  │  (PWA)       │  │  (Webhooks)  │                  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                  │
└─────────┼──────────────────┼──────────────────┼─────────────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         EDGE / CDN LAYER                                │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Vercel Edge Network - Static Assets, ISR, Edge Middleware       │   │
│  └──────────────────────────────────┬───────────────────────────────┘   │
└─────────────────────────────────────┼───────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       APPLICATION LAYER                                  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐      │
│  │                    Next.js Application                         │      │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐    │      │
│  │  │ React Server │  │ Server       │  │ API Routes       │    │      │
│  │  │ Components   │  │ Actions      │  │ (/api/*)         │    │      │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘    │      │
│  └────────────────────────────────────────────────────────────────┘      │
│                                                                          │
│  ┌────────────────────┐  ┌────────────────────────────────────┐         │
│  │  Auth Layer        │  │  WebSocket Server                  │         │
│  │  (Better Auth)     │  │  (Real-time notifications,         │         │
│  │                    │  │   inbox updates)                   │         │
│  └────────────────────┘  └────────────────────────────────────┘         │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
┌──────────────────────┐ ┌──────────────┐ ┌──────────────────────┐
│   DATA LAYER         │ │  CACHE       │ │  FILE STORAGE        │
│  ┌────────────────┐  │ │  ┌────────┐  │ │  ┌────────────────┐  │
│  │  PostgreSQL    │  │ │  │ Redis  │  │ │  │ Cloudflare R2  │  │
│  │  (Neon)        │  │ │  │ (Upstash│  │ │  │ (Media assets) │  │
│  │                │  │ │  │  )     │  │ │  │                │  │
│  │  via Drizzle   │  │ │  └────────┘  │ │  └────────────────┘  │
│  │  ORM           │  │ │              │ │                      │
│  └────────────────┘  │ └──────────────┘ └──────────────────────┘
└──────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     BACKGROUND PROCESSING LAYER                          │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    BullMQ Workers (Railway)                      │   │
│  │                                                                  │   │
│  │  ┌────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │   │
│  │  │  Scheduler     │  │  Publisher       │  │  Analytics       │  │   │
│  │  │  Worker        │  │  Worker          │  │  Sync Worker     │  │   │
│  │  │                │  │                  │  │                  │  │   │
│  │  │  - Cron checks │  │  - Posts to      │  │  - Pulls stats   │  │   │
│  │  │  - Enqueues    │  │    platforms     │  │  - Aggregates    │  │   │
│  │  │    publish jobs│  │  - Retry logic   │  │  - Stores        │  │   │
│  │  │  - Deduplication│ │  - Media upload  │  │                  │  │   │
│  │  └────────────────┘  └─────────────────┘  └─────────────────┘  │   │
│  │                                                                  │   │
│  │  ┌────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │   │
│  │  │  AI Content    │  │  Inbox Sync      │  │  Media          │  │   │
│  │  │  Worker        │  │  Worker          │  │  Processing     │  │   │
│  │  │                │  │                  │  │  Worker          │  │   │
│  │  │  - Generation  │  │  - Comments/DMs  │  │                  │  │   │
│  │  │  - Adaptation  │  │  - Mentions      │  │  - Resize/crop  │  │   │
│  │  │  - Suggestions │  │  - Notifications │  │  - Optimize     │  │   │
│  │  └────────────────┘  └─────────────────┘  └─────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                                      │
│                                                                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │  Social       │ │  AI / LLM    │ │  Email       │ │  Payments    │   │
│  │  Platform     │ │  Providers   │ │  (Resend)    │ │  (Stripe)    │   │
│  │  APIs         │ │              │ │              │ │              │   │
│  │              │ │  - Claude    │ │              │ │              │   │
│  │  - Meta      │ │  - OpenAI    │ │              │ │              │   │
│  │  - X/Twitter │ │  - Vercel AI │ │              │ │              │   │
│  │  - LinkedIn  │ │    SDK       │ │              │ │              │   │
│  │  - TikTok    │ │              │ │              │ │              │   │
│  │  - Pinterest │ │              │ │              │ │              │   │
│  │  - YouTube   │ │              │ │              │   │              │   │
│  │  - Bluesky   │ └──────────────┘ └──────────────┘ └──────────────┘   │
│  │  - Mastodon  │                                                       │
│  │  - Threads   │  ┌──────────────┐ ┌──────────────┐                   │
│  │  - Reddit    │  │  Monitoring  │ │  Analytics   │                   │
│  │              │  │  (Sentry +   │ │  (PostHog)   │                   │
│  └──────────────┘  │   Betterstack)│ │              │                   │
│                    └──────────────┘ └──────────────┘                   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Key Architectural Decisions & Rationale

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Monolith-first | Single Next.js app + separate worker process | Solo dev cannot maintain microservices. Monolith is simpler to deploy, debug, and reason about. Split only when forced by scale. |
| Separate worker process | BullMQ on Railway alongside the app | Scheduled publishing CANNOT be coupled to a serverless function's cold start or timeout. A dedicated, always-on worker guarantees posts publish on time. |
| Server-first rendering | React Server Components + Server Actions | Reduces client-side JS, improves performance, simplifies data fetching. Less state management boilerplate. |
| TypeScript everywhere | Shared types between frontend, backend, and workers | One language, one type system, one mental model. Eliminates entire categories of bugs. |
| PostgreSQL over NoSQL | Relational data model for social content | Social scheduling data is inherently relational (users -> teams -> posts -> platforms -> analytics). Strong consistency matters for scheduling. |
| Redis for queues + cache | Upstash (serverless Redis) | BullMQ requires Redis. Also serves as session cache, rate limit store, and real-time pub/sub layer. Upstash provides serverless pricing. |
| Edge-first deployment | Vercel for app, Railway for workers | Vercel gives best Next.js DX. Railway gives persistent processes for background workers. Both scale independently. |
| AI provider abstraction | Vercel AI SDK wrapping Claude + OpenAI | Avoids vendor lock-in. Can switch or blend providers. Streaming support built in. |

### 1.3 System Components & Responsibilities

**Web Application (Next.js on Vercel)**
- User-facing dashboard, calendar, composer, analytics views
- Server-side rendering for fast initial page loads
- API routes for webhook receivers (platform callbacks, Stripe events)
- Server Actions for form submissions and mutations
- Edge Middleware for auth checks, rate limiting, feature flags

**Background Workers (BullMQ on Railway)**
- **Scheduler Worker**: Runs every 30 seconds, scans for posts due within the next 60 seconds, enqueues them to the publisher queue. Uses distributed locks to prevent duplicate processing.
- **Publisher Worker**: Takes a post from the queue, resolves the OAuth token, calls the platform API, updates post status. Retries up to 5 times with exponential backoff.
- **Analytics Sync Worker**: Periodically pulls engagement data from platform APIs for published posts. Runs hourly for recent posts, daily for older posts.
- **Inbox Sync Worker**: Polls platform APIs for new comments, DMs, and mentions. Stores in unified inbox table.
- **AI Content Worker**: Handles async AI generation requests (bulk content generation, long-form adaptation).
- **Media Processing Worker**: Resizes images, generates thumbnails, validates video formats before upload to platforms.

**Data Layer**
- PostgreSQL (Neon): Primary data store for all application state
- Redis (Upstash): Job queues, session cache, rate limiting, real-time pub/sub
- Cloudflare R2: Media file storage (images, videos, thumbnails)

**External Integrations**
- 10+ social platform APIs via OAuth 2.0
- Claude API + OpenAI API via Vercel AI SDK
- Stripe for billing
- Resend for transactional email
- Sentry for error tracking
- Betterstack for uptime monitoring and log aggregation

---

## 2. Framework Candidates Comparison

### 2.1 Frontend Framework

| Criteria | Next.js 15 (App Router) | Nuxt 4 | SvelteKit | Remix |
|----------|------------------------|--------|-----------|-------|
| **Developer Productivity** | High - massive ecosystem, co-located server/client code, Server Actions reduce boilerplate | High - Vue's reactivity is intuitive, auto-imports reduce setup | Very High - less boilerplate, true reactivity without virtual DOM | Medium - explicit data loading is clean but more manual work |
| **Ecosystem Size** | Largest (React) - thousands of component libraries, hooks, examples | Large - growing Vue ecosystem, Nuxt modules cover most needs | Small but growing - fewer ready-made components, less community content | Medium - shares React ecosystem but fewer Remix-specific libraries |
| **Component Libraries** | shadcn/ui, Radix, Headless UI, MUI, Mantine, Tremor | PrimeVue, Vuetify, Naive UI, Radix Vue | Skeleton, shadcn-svelte, Melt UI - fewer options but catching up | Same as Next.js (React ecosystem) but some incompatibilities with nested routing |
| **Performance** | Good - RSC reduces bundle size, streaming SSR, partial prerendering | Good - Nitro engine, automatic code splitting, hybrid rendering | Excellent - smallest bundle sizes, fastest runtime, no virtual DOM overhead | Good - progressive enhancement, efficient data loading |
| **Learning Curve** | Medium - App Router has complexity (server vs client components, caching) | Low-Medium - Vue is approachable, Nuxt conventions reduce decisions | Low - Svelte syntax is intuitive, less concepts to learn | Medium - loader/action pattern is clean but different from traditional React |
| **AI-Assisted Dev Support** | Excellent - most training data, best Copilot/Claude suggestions, most StackOverflow answers | Good - Vue/Nuxt well represented in training data | Fair - less training data, AI tools occasionally generate incorrect Svelte syntax | Good - React-based but less Remix-specific training data |
| **SSR/SSG Support** | Excellent - ISR, SSG, SSR, streaming, partial prerendering | Excellent - hybrid rendering, ISR, edge rendering | Good - SSR and prerendering, less mature ISR story | Good - SSR focused, no native ISR |
| **Deployment Options** | Vercel (optimized), self-host, Docker, any Node hosting | Vercel, Netlify, Cloudflare, any Node hosting | Vercel, Netlify, Cloudflare Workers, any Node hosting | Vercel, Fly.io, any Node hosting |

**Verdict: Next.js 15 (App Router)**

Next.js wins for a solo developer building a complex SaaS. The React ecosystem is unmatched for ready-made components (critical for moving fast alone). The App Router with React Server Components and Server Actions dramatically reduces the code needed for data fetching and mutations. Most importantly for AI-assisted development, Next.js has the deepest coverage in LLM training data -- Claude, Copilot, and ChatGPT all produce higher-quality Next.js code than any alternative. The shadcn/ui component library alone saves weeks of UI development. SvelteKit is tempting for raw performance, but the smaller ecosystem means building more from scratch, which is the wrong tradeoff for a solo dev.

---

### 2.2 Backend Framework

| Criteria | Next.js API Routes + Server Actions | NestJS | Fastify | Hono | Django / FastAPI |
|----------|-------------------------------------|--------|---------|------|------------------|
| **TypeScript Support** | Native (same codebase) | Excellent (built for TS, decorators) | Excellent (first-class TS) | Excellent (built in TS) | N/A (Python) / FastAPI has type hints |
| **Unified with Frontend** | Yes - same repo, same deploy, shared types | No - separate service | No - separate service | No - separate service | No - separate language |
| **Background Job Handling** | Limited - serverless timeouts, no persistent processes | Good - can integrate BullMQ, CRON decorators | Good - can integrate BullMQ | Limited - edge-oriented, no native job support | Excellent - Celery (Django), built-in async (FastAPI) |
| **Scalability** | Good for API routes; worker must be separate | Excellent - enterprise patterns, modular architecture | Excellent - fastest Node.js framework, benchmarks prove it | Excellent - edge-ready, ultrafast routing | Good - Django scales well; FastAPI excellent for async |
| **Testing Ergonomics** | Medium - testing Server Actions is improving but not fully mature | Excellent - built-in testing module, dependency injection makes mocking easy | Good - standard Node testing, plugin architecture helps | Good - lightweight, easy to test handlers | Excellent - Django test client, pytest with FastAPI |
| **Deployment Simplicity** | Highest - single Vercel deploy for app + API | Medium - needs Node hosting, Docker recommended | Medium - needs Node hosting | High - runs on edge, workers, containers | Medium - needs Python hosting, Gunicorn/Uvicorn |
| **ORM Integration** | Any JS ORM (Drizzle, Prisma) | TypeORM native, Prisma/Drizzle work | Any JS ORM | Any JS ORM | Django ORM (excellent), SQLAlchemy |
| **WebSocket Support** | Limited on Vercel (use separate service or Pusher) | Excellent - native WebSocket gateway | Excellent - native WebSocket support | Good - WebSocket support available | Django Channels, FastAPI WebSocket |
| **API Documentation** | Manual (or tRPC for type safety) | Swagger/OpenAPI auto-generated | Swagger plugin available | OpenAPI support | FastAPI auto-generates OpenAPI (best in class) |

**Verdict: Next.js API Routes + Server Actions (primary) + Separate BullMQ Worker (critical paths)**

For a solo dev, maintaining a separate backend service is a significant overhead. Next.js Server Actions and API Routes handle 90% of the backend needs (CRUD operations, auth flows, Stripe webhooks, AI streaming responses) with zero additional deployment complexity. The critical insight is that scheduled posting and background processing CANNOT run on serverless -- these get a dedicated BullMQ worker process deployed on Railway. This worker shares the same TypeScript codebase and database models (monorepo), but runs as a persistent Node.js process. This hybrid approach gives the simplicity of a unified codebase with the reliability of dedicated workers for critical paths.

If the backend needs outgrow API Routes (e.g., complex real-time features, heavy API for mobile clients), NestJS would be the next step -- but that is a bridge to cross later.

---

### 2.3 Database

| Criteria | PostgreSQL (self-managed) | MySQL | PlanetScale (MySQL) | Supabase (PostgreSQL) | Neon (PostgreSQL) |
|----------|--------------------------|-------|--------------------|-----------------------|-------------------|
| **Versatility** | Excellent - JSONB, full-text search, array types, CTEs, window functions | Good - reliable but fewer advanced types | Good - MySQL with serverless scaling | Excellent - PostgreSQL with built-in extras | Excellent - full PostgreSQL |
| **Managed Hosting** | Manual (or AWS RDS, which adds complexity) | Manual or managed | Fully managed, serverless | Fully managed, generous free tier | Fully managed, serverless |
| **Serverless Compatibility** | Requires connection pooling (PgBouncer) | Requires connection pooling | Native serverless, HTTP connections | Built-in connection pooling, HTTP API | Native serverless, connection pooling built-in |
| **Branching / Preview DBs** | Manual | Manual | Excellent - database branching for PRs | Limited - can clone but not native branching | Excellent - database branching, instant |
| **Scaling** | Manual (replication, sharding) | Manual | Auto-scaling reads, manual writes | Auto-scaling on Pro plan | Auto-scaling, scale-to-zero on free tier |
| **Free Tier** | N/A (self-host) | N/A (self-host) | Generous free tier (now read-only replicas in Vitess) | 500MB, 2 projects | 0.5 GiB storage, autoscaling compute |
| **Built-in Features** | Database only | Database only | Database only | Auth, Storage, Realtime, Edge Functions, Vector DB | Database + branching |
| **Cost at Scale** | Cheapest (self-managed) | Cheapest (self-managed) | Moderate - per-row pricing can surprise | Moderate - Pro plan $25/month + usage | Moderate - compute + storage pricing |
| **ORM Support** | All ORMs | All ORMs | Prisma, Drizzle, Kysely | Prisma, Drizzle, Kysely (PostgreSQL) | Prisma, Drizzle, Kysely (PostgreSQL) |
| **Extensions** | All (pg_trgm, PostGIS, pgvector, etc.) | Limited | Limited (MySQL) | Most PostgreSQL extensions | Most PostgreSQL extensions, pgvector |

**Verdict: Neon (PostgreSQL)**

Neon provides the best balance for a solo developer. Its serverless architecture means zero database administration -- the database scales to zero when idle (cost-efficient during development) and auto-scales under load. Database branching is a game-changer for development: every preview deployment can get its own isolated database branch, making it safe to test schema migrations without touching production. Full PostgreSQL compatibility means access to JSONB (flexible metadata storage for platform-specific post data), full-text search (for inbox search), and pgvector (for future AI-powered content similarity features). The connection pooling is built-in, eliminating the common serverless + PostgreSQL headache.

Supabase was a close second. Its built-in auth, storage, and realtime features are appealing. However, we are recommending Better Auth (more control, better Next.js integration), Cloudflare R2 (cheaper storage), and a dedicated WebSocket approach. Using Supabase just for the database underutilizes its value proposition and creates unnecessary coupling.

---

### 2.4 ORM / Data Layer

| Criteria | Prisma | Drizzle | TypeORM | Kysely |
|----------|--------|---------|---------|--------|
| **Type Safety** | Excellent - generated types from schema | Excellent - inferred from schema definition | Moderate - decorator-based, some runtime type issues | Excellent - type-safe query builder |
| **DX / Ergonomics** | Excellent - intuitive API, Prisma Studio for visual DB browsing | Good - SQL-like syntax is familiar for those who know SQL | Moderate - verbose decorators, configuration-heavy | Good - powerful but lower-level |
| **Schema Definition** | Own DSL (`schema.prisma`) | TypeScript code (schema-as-code) | TypeScript decorators on entities | No schema - types from DB or manual |
| **Migration Strategy** | Auto-generated migrations, Prisma Migrate | Auto-generated migrations via `drizzle-kit` | Auto-generated, less reliable | Manual or third-party |
| **Performance** | Moderate - Rust query engine adds overhead, connection pooling issues in serverless | Excellent - thin SQL layer, minimal overhead, no query engine | Moderate - Active Record pattern adds overhead | Excellent - compiles to raw SQL |
| **Serverless Compatibility** | Improved with Prisma Accelerate, but historically problematic (cold starts, connection limits) | Excellent - lightweight, fast cold starts, native `fetch`-based drivers | Poor - heavy, slow cold starts | Excellent - lightweight |
| **Raw SQL Escape Hatch** | `$queryRaw` / `$executeRaw` | `sql` template tag (natural) | `query()` method | Core concept (it IS a query builder) |
| **Relations / Joins** | Excellent - declarative relations, nested includes | Good - explicit joins, relational query API | Good - decorator-based relations | Good - type-safe joins |
| **Community / Ecosystem** | Largest - most guides, tutorials, Stack Overflow answers | Growing rapidly - strong momentum in 2025-2026 | Declining - less active development | Small but dedicated |
| **Bundle Size** | Large (~10MB+ with engine) | Tiny (~50KB) | Large | Tiny |

**Verdict: Drizzle**

Drizzle is the right choice for this project. It strikes the ideal balance between type safety and performance, which matters in a serverless environment where cold start time and connection efficiency are critical. The schema-as-code approach (pure TypeScript) means the schema definition is just TypeScript -- no separate DSL to learn, and the types flow naturally through the application. Drizzle's SQL-like API means what you write closely mirrors the SQL that executes, making it easy to reason about query performance and optimize when needed.

Prisma has better DX for simple CRUD and a more intuitive API for developers who do not think in SQL. However, its Rust query engine adds cold start latency in serverless, and its generated client is large. For a scheduling platform that will run many concurrent database operations (checking scheduled posts, updating statuses, syncing analytics), Drizzle's lightweight architecture and direct SQL mapping provide a meaningful performance advantage.

The `drizzle-kit` migration tool handles schema changes well, and Drizzle Studio provides a visual database browser similar to Prisma Studio.

---

### 2.5 Background Jobs / Queue

| Criteria | BullMQ (Redis) | Trigger.dev | Inngest | Quirrel | pg-boss (PostgreSQL) |
|----------|----------------|-------------|---------|---------|---------------------|
| **Reliability** | Excellent - battle-tested, used in production by thousands of companies, Redis persistence | Good - managed infrastructure, retries built-in | Good - managed, event replay, idempotency built-in | Moderate - less battle-tested, smaller community | Good - PostgreSQL ACID guarantees, SKIP LOCKED |
| **Scheduling Precision** | Excellent - delayed jobs with ms precision, repeatable jobs, cron expressions | Good - scheduled triggers, cron support | Good - scheduled functions, cron support | Good - designed for cron jobs | Good - cron and delayed jobs, but polling-based (configurable interval) |
| **Retry Logic** | Excellent - exponential backoff, custom strategies, dead letter queue | Excellent - built-in retries, configurable | Excellent - built-in retries, step functions allow partial retries | Basic - configurable retries | Good - exponential backoff, retry configuration |
| **Monitoring / Dashboard** | Good - BullBoard or Bull Monitor (self-hosted), or paid Arena | Excellent - managed dashboard, run history, logs | Excellent - managed dashboard, event timeline, debugging | Basic - minimal built-in monitoring | Basic - query PostgreSQL directly |
| **Scaling** | Excellent - add workers horizontally, Redis handles distribution | Excellent - serverless scaling, no infrastructure to manage | Excellent - serverless, auto-scales | Limited - single process | Moderate - limited by PostgreSQL connection pool |
| **Cost** | Low - Redis hosting ($0-10/month on Upstash for moderate load) + worker hosting | Free tier + $0.02/run after | Free tier + usage-based pricing | Open source, self-host | Free (uses existing PostgreSQL) |
| **Self-Hosted** | Yes (full control) | Yes (open source) | Yes (open source) | Yes | Yes |
| **Rate Limiting** | Built-in per-queue rate limiting | Available | Available | No | No |
| **Priority Queues** | Yes - multiple priority levels | Yes | Yes | No | Yes |
| **Concurrency Control** | Excellent - per-queue and global concurrency limits | Good | Good | Basic | Good |
| **Delayed / Scheduled Jobs** | Native - `delay` option, exact timestamp scheduling | Native | Native - `sleep`, `waitForEvent` | Native - designed for this | Native |
| **Dependencies on External Services** | Redis required | Trigger.dev cloud or self-hosted server | Inngest cloud or self-hosted server | Own server | None (uses PostgreSQL) |

**Verdict: BullMQ (Redis)**

For a platform where **scheduled posts MUST publish on time**, BullMQ is the only choice that provides sufficient control and battle-tested reliability. Here is why:

1. **Scheduling precision**: BullMQ supports exact-timestamp delayed jobs. When a user schedules a post for 2:30 PM, we can enqueue a job with a precise delay. The Redis-backed scheduler fires the job within milliseconds of the target time.

2. **Retry guarantees**: If a platform API call fails (Instagram returns 500), BullMQ automatically retries with exponential backoff. Dead letter queues catch permanently failed jobs for manual review. No post silently disappears.

3. **Concurrency control**: Platform APIs have rate limits. BullMQ's per-queue rate limiting and concurrency controls prevent us from exceeding API limits while still processing jobs as fast as allowed.

4. **Observability**: Combined with BullBoard (open-source dashboard), we get full visibility into queue depth, processing times, failed jobs, and retry counts. For a solo dev, this visibility is essential for debugging production issues.

5. **Battle-tested**: BullMQ processes millions of jobs per day at companies far larger than SocialSpark. The failure modes are well-documented and the recovery patterns are proven.

Trigger.dev and Inngest are compelling alternatives (especially for a solo dev who wants managed infrastructure), but they introduce a dependency on a third-party service for the most critical path in the application. If Trigger.dev has an outage, posts do not publish. With BullMQ, we own the entire pipeline. The Redis instance on Upstash costs $0-10/month and the worker process on Railway costs ~$5/month -- far less than the risk of depending on a third-party for the core business function.

pg-boss is a reasonable alternative that eliminates the Redis dependency. However, its polling-based approach has inherently lower scheduling precision than BullMQ's event-driven model, and PostgreSQL is not designed to be a high-throughput job queue under heavy load.

---

### 2.6 AI Integration

| Criteria | Anthropic Claude API | OpenAI API | Vercel AI SDK | LangChain |
|----------|---------------------|------------|---------------|-----------|
| **Content Quality** | Excellent - best reasoning, nuanced writing, brand voice adaptation | Excellent - GPT-4o is fast and capable, wide model range | N/A (wrapper, not a model) | N/A (wrapper, not a model) |
| **Streaming Support** | Yes - native SSE streaming | Yes - native SSE streaming | Yes - unified streaming interface for all providers | Yes - streaming chains |
| **Cost per Token** | Moderate - Claude Sonnet is cost-effective for content generation | Moderate - GPT-4o-mini is cheapest for simple tasks | N/A | N/A |
| **Structured Output** | Good - tool use, JSON mode | Excellent - JSON mode, function calling, structured outputs | Built-in helpers for structured output | Structured output parsers |
| **Multi-Provider Support** | Claude only | OpenAI only | All major providers (Claude, OpenAI, Google, Mistral, etc.) | All major providers |
| **Edge Compatibility** | Yes | Yes | Yes (designed for edge) | Heavy - not edge-friendly |
| **Bundle Size / Overhead** | Light SDK | Light SDK | Light (~50KB) | Heavy (~500KB+), many dependencies |
| **React Integration** | Manual | Manual | Excellent - `useChat`, `useCompletion`, `useObject` hooks | React hooks available but heavier |

**Verdict: Vercel AI SDK + Claude (primary) + OpenAI (secondary)**

The Vercel AI SDK is the clear integration layer. It provides a unified interface that abstracts provider differences, offers React hooks for streaming responses directly into the UI (`useChat`, `useCompletion`), and supports structured output parsing. Most importantly, it lets us switch between or combine providers without rewriting application code.

For the actual AI models:
- **Claude (Anthropic)** as the primary model for content generation and adaptation. Claude excels at understanding brand voice, adapting content across platforms, and generating natural-sounding social media copy. Claude Sonnet provides the best quality-to-cost ratio for content generation.
- **OpenAI GPT-4o-mini** as a secondary model for simpler tasks (hashtag suggestions, sentiment classification, content categorization) where speed and cost matter more than nuanced reasoning.

LangChain is explicitly avoided. Its abstraction overhead, dependency bloat, and rapid API changes make it a poor fit for a production application maintained by a solo developer. The Vercel AI SDK handles everything we need with a fraction of the complexity.

---

### 2.7 File Storage

| Criteria | AWS S3 | Cloudflare R2 | Supabase Storage | Uploadthing |
|----------|--------|---------------|------------------|-------------|
| **S3 Compatibility** | Native | Full S3 API compatibility | S3 compatibility layer | Not S3 compatible |
| **Egress Costs** | $0.09/GB (significant at scale) | $0 (zero egress fees) | Included in plan (limits apply) | Included in plan |
| **Storage Cost** | $0.023/GB/month | $0.015/GB/month | 1GB free, then plan-based | 2GB free, then $10/month per 10GB |
| **CDN Integration** | CloudFront (additional cost + setup) | Built-in Cloudflare CDN (global, free) | Supabase CDN | Built-in CDN |
| **Image Transformations** | Requires Lambda@Edge or external service | Cloudflare Images ($5/100k transformations) | Built-in transformations | Basic transformations |
| **Access Control** | IAM policies, presigned URLs | Presigned URLs, Workers for auth | Row-level security policies | Server-side upload, signed URLs |
| **DX / Setup Complexity** | High - IAM, bucket policies, CORS | Low - simple dashboard, S3 SDK works | Low - integrated with Supabase client | Lowest - designed for Next.js, file routes |
| **Multipart Upload** | Native | Native | Via TUS protocol | Built-in |

**Verdict: Cloudflare R2**

Cloudflare R2 is the best choice for media-heavy social media content. The zero egress fees are the deciding factor: when users upload images and videos that get served to dashboards, previews, and potentially public-facing pages, egress costs on S3 can grow unpredictably. R2 eliminates this entirely.

R2 is fully S3-compatible, so the existing AWS SDK (`@aws-sdk/client-s3`) works without modification -- no vendor lock-in. The built-in Cloudflare CDN means media is served globally with low latency at no additional cost. For image transformations (generating thumbnails, resizing for different platform requirements), Cloudflare Images can be added later, or we can handle it in the media processing worker using Sharp.

Uploadthing is excellent for developer experience and would be a reasonable choice for a simpler application, but its per-GB pricing becomes less competitive at scale, and R2 gives more control over the storage layer.

---

### 2.8 Authentication

| Criteria | NextAuth.js (Auth.js) | Clerk | Supabase Auth | Lucia | Better Auth |
|----------|----------------------|-------|---------------|-------|-------------|
| **Provider Support** | 80+ OAuth providers | 30+ OAuth + social providers | 20+ OAuth providers | Manual - bring your own providers | 30+ OAuth providers, growing |
| **Team / Org Support** | Manual (DIY) | Built-in organizations, roles, invites | Manual (DIY with RLS) | Manual (DIY) | Plugin-based organizations |
| **Pricing** | Free (open source) | Free tier (10k MAU), then $0.02/MAU | Free tier (50k MAU), then plan-based | Free (open source) | Free (open source) |
| **Session Strategy** | JWT or database sessions | Managed (Clerk handles everything) | JWT with refresh tokens | Database sessions (flexible) | Database sessions, JWT, or both |
| **Self-Hosted** | Yes | No (managed only) | Yes (Supabase is open source) | Yes | Yes |
| **Next.js Integration** | Good - official Next.js adapter, but App Router migration has been bumpy | Excellent - `<ClerkProvider>`, middleware, hooks, ready-made UI components | Good - `@supabase/ssr` package | Good - Next.js guide available | Excellent - native Next.js plugin, middleware, server actions |
| **UI Components** | None (DIY sign-in/up forms) | Full UI kit (sign-in, sign-up, user profile, org switcher) | Pre-built but basic (customizable) | None (DIY) | None (DIY, but auth-ui community package) |
| **MFA / 2FA** | Limited | Built-in | Built-in | Manual | Plugin-based |
| **Customization** | Medium - callbacks, events, custom pages | Medium - theming, custom flows | High - full control with hooks | Highest - you build everything | High - plugin architecture, full source access |
| **Data Ownership** | Full (your database) | Clerk owns user data (sync to your DB possible) | Full (your database) | Full (your database) | Full (your database) |
| **Maturity** | High - years of production use, large community | High - well-funded, growing rapidly | High - part of Supabase ecosystem | Declining - Lucia v3 announced as "use Better Auth" migration | Growing rapidly - v1.0 released 2025, active development |

**Verdict: Better Auth**

Better Auth is the recommended choice, and here is the reasoning:

1. **Data ownership**: Auth data lives in our PostgreSQL database (via Drizzle, which Better Auth natively supports). No external dependency for the most critical user data.

2. **Plugin architecture**: Better Auth's plugin system provides team/organization support, two-factor authentication, magic links, and social OAuth -- all as opt-in plugins rather than a monolithic package. This aligns with the incremental development approach.

3. **Lucia's own recommendation**: Lucia (previously the go-to lightweight auth library) officially recommends Better Auth as its successor. The Lucia team acknowledged that Better Auth solves the same problems with better DX and more features.

4. **Native Drizzle + Next.js integration**: Better Auth has first-party adapters for both Drizzle ORM and Next.js App Router, including middleware and Server Action helpers. No compatibility layer needed.

5. **Cost**: Completely free and open source. Clerk's pricing ($0.02/MAU after 10K) would cost $1,800/month at 100K users. Better Auth costs nothing.

Clerk was a strong contender -- its pre-built UI components and managed infrastructure save significant development time. For a solo dev who wants to ship auth in an afternoon, Clerk is genuinely faster to implement. However, the vendor lock-in (Clerk owns user data), the cost at scale, and the dependency on an external service for a core function tip the balance toward Better Auth. The extra day or two of implementing custom auth forms (using shadcn/ui components) is worth the long-term benefits.

---

### 2.9 Deployment / Hosting

| Criteria | Vercel | Railway | Fly.io | AWS (ECS/Lambda) | Render |
|----------|--------|---------|--------|-------------------|--------|
| **Next.js Support** | Best (they build Next.js) | Good - Docker-based, works well | Good - Docker, needs config | Good - Lambda adapter or Docker on ECS | Good - native Node.js support |
| **Background Workers** | No persistent processes (serverless only, 60s-300s timeout) | Excellent - persistent processes, always-on | Excellent - persistent VMs, multi-region | Excellent - ECS for workers, SQS for queues | Good - background workers available |
| **Pricing (Solo Dev)** | $20/month Pro (generous limits) | $5/month base + usage (~$10-20/month for workers) | $0 + usage (Machines pricing) | Complex - many services to price | $7/month per service |
| **DX / Simplicity** | Highest - git push, preview deploys, instant rollback | High - git push, simple dashboard | Medium - requires Dockerfile, flyctl CLI | Low - IAM, VPC, CloudFormation/CDK | High - git push, simple dashboard |
| **Preview Environments** | Excellent - every PR gets a deploy | Good - PR environments available | Manual | Manual | Good - PR previews available |
| **Scaling** | Automatic (serverless) | Manual + auto-scale | Automatic (scale to zero) | Highly configurable | Automatic |
| **Edge Functions** | Yes (global) | No | Yes (multi-region VMs) | Yes (Lambda@Edge / CloudFront Functions) | No |
| **Custom Domains + SSL** | Included | Included | Included | Manual (ACM + Route53) | Included |
| **Database Add-ons** | Vercel Postgres (Neon), KV (Upstash) | PostgreSQL, Redis, MySQL add-ons | Postgres (Fly Postgres), Redis (managed) | RDS, ElastiCache | PostgreSQL, Redis add-ons |
| **Logs / Monitoring** | Basic (log drain to external services) | Good - built-in logs, metrics | Good - built-in metrics | CloudWatch (powerful but complex) | Good - built-in logs |

**Verdict: Vercel (app) + Railway (workers)**

This is a split deployment strategy that plays to each platform's strengths:

**Vercel** for the Next.js application:
- Vercel builds Next.js. The integration is unmatched -- ISR, streaming SSR, edge middleware, image optimization, and preview deploys all work perfectly.
- $20/month Pro plan provides generous bandwidth, serverless function execution, and preview environments for every PR.
- Edge network delivers the dashboard globally with low latency.

**Railway** for background workers:
- Background workers need persistent, always-on processes. Vercel's serverless functions have a 300-second maximum execution time and no guarantee of staying warm. This is fundamentally incompatible with a job processing architecture.
- Railway provides simple Node.js process hosting at ~$5-10/month for a small worker. Push code, it runs. No Docker configuration needed (though Docker is supported).
- Railway also hosts our Redis instance (or we use Upstash for serverless Redis).

This combination costs approximately $30-40/month total for a production setup, provides excellent DX, and cleanly separates concerns: the web application is globally distributed and serverless, while the background workers are persistent and reliable.

**Why not all-in-one on Railway or Fly.io?** Because no platform matches Vercel's Next.js DX -- preview deploys, ISR caching, image optimization, and edge middleware all work better on Vercel. The marginal complexity of deploying workers separately to Railway is worth the DX gains on the primary application.

---

### 2.10 Monitoring & Observability

| Criteria | Sentry | Axiom | Betterstack | Datadog |
|----------|--------|-------|-------------|---------|
| **Primary Strength** | Error tracking, performance monitoring, session replay | Log aggregation, analytics, dashboards | Uptime monitoring, incident management, logs | Full APM, traces, logs, metrics, dashboards |
| **Error Tracking** | Best-in-class - source maps, breadcrumbs, user context, issue grouping | Logs-based (can derive errors) | Logs-based | Good - but not primary focus |
| **Log Aggregation** | Limited (errors only, not general logs) | Excellent - ingest from anywhere, powerful query language | Good - structured logging, search | Excellent - powerful log management |
| **Uptime Monitoring** | No | No | Excellent - HTTP checks, heartbeats, status pages | Available |
| **APM / Traces** | Good - transaction tracing, web vitals | Limited | No | Best-in-class |
| **Pricing** | Free tier (5K errors/month), $26/month Developer | Free tier (0.5GB/month), $25/month for 50GB | Free tier (5 monitors), $24/month Team | Expensive - $15/host/month minimum, grows fast |
| **Next.js Integration** | Excellent - `@sentry/nextjs` SDK | Good - Vercel integration, API | Good - Vercel log drain | Good - official Node.js SDK |
| **Alerting** | Issue-based alerts (Slack, email, PagerDuty) | Log-based alerts | Uptime + log alerts, on-call scheduling | Comprehensive alerting |
| **Solo Dev Fit** | Excellent - focus on errors that matter | Good - powerful but may be overkill initially | Excellent - "is it up?" is the first question | Overkill - enterprise pricing and complexity |

**Verdict: Sentry (errors) + Betterstack (uptime + logs)**

For a solo developer, the monitoring stack needs to answer two questions: "Is anything broken?" and "Is it still running?"

**Sentry** answers the first question definitively. Its Next.js SDK captures frontend and backend errors with full stack traces, source maps, breadcrumbs (what the user did before the error), and session replay (video of the user's session). The issue grouping and alerting mean you get one notification per new bug, not one per occurrence. The free tier (5K errors/month) is sufficient for early stages.

**Betterstack** answers the second question. Its uptime monitoring pings the application endpoints and alerts immediately on downtime. The heartbeat feature is critical for background workers: the scheduler worker sends a heartbeat every minute, and if Betterstack does not receive it, we know the worker has crashed. Betterstack also provides log aggregation and a public status page. The free tier (5 monitors) covers the essentials.

**Datadog** is excluded despite being the most powerful option. Its pricing is designed for enterprise teams and would cost $100+/month for a solo project. Sentry + Betterstack covers 95% of monitoring needs at $0-50/month.

---

## 3. Recommended Stack

### Summary Table

| Layer | Choice | Why |
|-------|--------|-----|
| **Frontend Framework** | Next.js 15 (App Router) | Largest React ecosystem, best AI-assisted dev support, RSC reduces boilerplate, shadcn/ui components |
| **Backend** | Next.js API Routes + Server Actions | Unified codebase, zero deployment overhead, shared types, Server Actions eliminate API boilerplate |
| **Background Jobs** | BullMQ (Redis) | Battle-tested scheduling precision, retry guarantees, rate limiting, full control over critical publishing pipeline |
| **Database** | Neon (PostgreSQL) | Serverless scaling, database branching for previews, full PostgreSQL features, built-in connection pooling |
| **ORM** | Drizzle | Type-safe, SQL-like, fast cold starts, lightweight, schema-as-code in TypeScript |
| **Cache / Queue Store** | Upstash Redis | Serverless Redis for BullMQ queues, session cache, rate limiting; pay-per-request pricing |
| **Authentication** | Better Auth | Open source, data ownership, Drizzle + Next.js native, plugin-based orgs/teams, free at any scale |
| **AI Integration** | Vercel AI SDK + Claude + OpenAI | Provider abstraction, React streaming hooks, Claude for content quality, GPT-4o-mini for simple tasks |
| **File Storage** | Cloudflare R2 | Zero egress fees, S3-compatible, built-in CDN, cheapest at scale for media-heavy app |
| **Deployment (App)** | Vercel | Best Next.js DX, preview deploys, edge network, ISR, $20/month |
| **Deployment (Workers)** | Railway | Persistent processes, simple setup, ~$10/month for workers + Redis |
| **Email** | Resend | Modern API, React email templates, good free tier (3K emails/month) |
| **Payments** | Stripe | Industry standard, Stripe Billing for subscriptions, excellent docs |
| **Monitoring (Errors)** | Sentry | Best error tracking, Next.js SDK, session replay, free tier sufficient |
| **Monitoring (Uptime)** | Betterstack | Uptime checks, worker heartbeats, status page, log aggregation |
| **Analytics (Product)** | PostHog | Open source, event tracking, feature flags, session recording, generous free tier |
| **UI Components** | shadcn/ui + Radix + Tailwind CSS | Copy-paste components (no dependency), accessible, highly customizable, beautiful defaults |
| **Validation** | Zod | Runtime + static type validation, integrates with Drizzle, React Hook Form, Server Actions |
| **State Management** | Zustand (minimal client state) + React Server Components | RSC eliminates most client state; Zustand for remaining UI state (modals, drafts) |
| **Testing** | Vitest + Playwright | Vitest for unit/integration (fast, Vite-native), Playwright for E2E (reliable, multi-browser) |

### Estimated Monthly Cost (Early Stage)

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Pro | $20 |
| Railway | Usage-based (worker + Redis) | $10-15 |
| Neon | Free tier (scales to Pro at $19) | $0-19 |
| Upstash Redis | Free tier (10K commands/day) | $0-10 |
| Cloudflare R2 | Free tier (10GB storage, 10M reads) | $0-5 |
| Sentry | Free tier | $0 |
| Betterstack | Free tier | $0 |
| Resend | Free tier (3K emails/month) | $0 |
| PostHog | Free tier (1M events/month) | $0 |
| Claude API | Usage-based | $10-50 |
| OpenAI API | Usage-based | $5-20 |
| Stripe | 2.9% + $0.30 per transaction | Variable |
| Domain + DNS | Cloudflare | $10/year |
| **TOTAL** | | **$45-140/month** |

This stack runs a production SaaS for under $150/month at early stage, with clear scaling paths for each service as traffic grows.

---

## 4. Project Structure

```
socialspark/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # Lint, type-check, test on every PR
│   │   ├── e2e.yml                   # Playwright E2E tests (nightly + pre-deploy)
│   │   └── deploy-workers.yml        # Deploy worker to Railway on main push
│   └── PULL_REQUEST_TEMPLATE.md
│
├── apps/
│   ├── web/                          # Next.js application (deployed to Vercel)
│   │   ├── app/                      # App Router pages and layouts
│   │   │   ├── (auth)/               # Auth route group (sign-in, sign-up, forgot-password)
│   │   │   │   ├── sign-in/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── sign-up/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── layout.tsx        # Minimal layout for auth pages
│   │   │   │
│   │   │   ├── (dashboard)/          # Dashboard route group (requires auth)
│   │   │   │   ├── layout.tsx        # Sidebar + header layout
│   │   │   │   ├── page.tsx          # Dashboard home / overview
│   │   │   │   ├── calendar/
│   │   │   │   │   └── page.tsx      # Calendar view of scheduled posts
│   │   │   │   ├── compose/
│   │   │   │   │   └── page.tsx      # Post composer with AI assistance
│   │   │   │   ├── posts/
│   │   │   │   │   ├── page.tsx      # All posts list (drafts, scheduled, published)
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx  # Single post detail / edit
│   │   │   │   ├── inbox/
│   │   │   │   │   └── page.tsx      # Unified inbox (comments, DMs, mentions)
│   │   │   │   ├── analytics/
│   │   │   │   │   └── page.tsx      # Analytics dashboard
│   │   │   │   ├── platforms/
│   │   │   │   │   └── page.tsx      # Connected platform accounts management
│   │   │   │   ├── team/
│   │   │   │   │   └── page.tsx      # Team members, invites, roles
│   │   │   │   └── settings/
│   │   │   │       ├── page.tsx      # General settings
│   │   │   │       ├── billing/
│   │   │   │       │   └── page.tsx  # Stripe billing portal
│   │   │   │       └── notifications/
│   │   │   │           └── page.tsx  # Notification preferences
│   │   │   │
│   │   │   ├── api/                  # API routes (webhook receivers, tRPC)
│   │   │   │   ├── webhooks/
│   │   │   │   │   ├── stripe/
│   │   │   │   │   │   └── route.ts  # Stripe webhook handler
│   │   │   │   │   └── platforms/
│   │   │   │   │       └── [platform]/
│   │   │   │   │           └── route.ts  # Platform OAuth callbacks, webhooks
│   │   │   │   ├── ai/
│   │   │   │   │   └── chat/
│   │   │   │   │       └── route.ts  # AI streaming endpoint for composer
│   │   │   │   ├── upload/
│   │   │   │   │   └── route.ts      # Presigned URL generation for R2 uploads
│   │   │   │   └── cron/
│   │   │   │       └── health/
│   │   │   │           └── route.ts  # Health check for Betterstack
│   │   │   │
│   │   │   ├── layout.tsx            # Root layout (providers, fonts, metadata)
│   │   │   ├── not-found.tsx         # 404 page
│   │   │   └── error.tsx             # Global error boundary
│   │   │
│   │   ├── components/               # React components
│   │   │   ├── ui/                   # shadcn/ui base components (button, dialog, etc.)
│   │   │   ├── layout/               # Layout components (sidebar, header, nav)
│   │   │   ├── composer/             # Post composer components
│   │   │   │   ├── composer-editor.tsx
│   │   │   │   ├── platform-preview.tsx
│   │   │   │   ├── media-uploader.tsx
│   │   │   │   ├── ai-assistant.tsx
│   │   │   │   └── schedule-picker.tsx
│   │   │   ├── calendar/             # Calendar view components
│   │   │   ├── analytics/            # Analytics chart components
│   │   │   ├── inbox/                # Inbox components
│   │   │   └── shared/               # Shared components (avatar, badge, etc.)
│   │   │
│   │   ├── lib/                      # Utility functions and configs
│   │   │   ├── auth.ts               # Better Auth client initialization
│   │   │   ├── auth-client.ts        # Better Auth React client hooks
│   │   │   └── utils.ts              # General utilities (cn, formatDate, etc.)
│   │   │
│   │   ├── hooks/                    # Custom React hooks
│   │   │   ├── use-posts.ts
│   │   │   ├── use-platforms.ts
│   │   │   └── use-realtime.ts
│   │   │
│   │   ├── styles/
│   │   │   └── globals.css           # Tailwind CSS base + custom properties
│   │   │
│   │   ├── public/                   # Static assets
│   │   ├── middleware.ts             # Auth middleware, rate limiting
│   │   ├── next.config.ts            # Next.js configuration
│   │   ├── tailwind.config.ts        # Tailwind configuration
│   │   └── tsconfig.json
│   │
│   └── worker/                       # Background worker process (deployed to Railway)
│       ├── src/
│       │   ├── index.ts              # Worker entry point - starts all queue processors
│       │   ├── queues/               # Queue definitions
│       │   │   ├── publish.queue.ts  # Post publishing queue
│       │   │   ├── schedule.queue.ts # Scheduler (cron-based, checks for due posts)
│       │   │   ├── analytics.queue.ts# Analytics data sync queue
│       │   │   ├── inbox.queue.ts    # Inbox sync queue
│       │   │   ├── ai.queue.ts       # AI content generation queue
│       │   │   └── media.queue.ts    # Media processing queue
│       │   │
│       │   ├── processors/           # Job processors (business logic)
│       │   │   ├── publish.processor.ts
│       │   │   ├── schedule.processor.ts
│       │   │   ├── analytics.processor.ts
│       │   │   ├── inbox.processor.ts
│       │   │   ├── ai.processor.ts
│       │   │   └── media.processor.ts
│       │   │
│       │   ├── platforms/            # Platform-specific API clients
│       │   │   ├── base.platform.ts  # Abstract base class for all platforms
│       │   │   ├── meta.platform.ts  # Facebook + Instagram
│       │   │   ├── x.platform.ts     # X (Twitter)
│       │   │   ├── linkedin.platform.ts
│       │   │   ├── tiktok.platform.ts
│       │   │   ├── pinterest.platform.ts
│       │   │   ├── youtube.platform.ts
│       │   │   ├── bluesky.platform.ts
│       │   │   ├── mastodon.platform.ts
│       │   │   ├── threads.platform.ts
│       │   │   └── reddit.platform.ts
│       │   │
│       │   └── lib/
│       │       ├── redis.ts          # Redis connection (shared with BullMQ)
│       │       ├── heartbeat.ts      # Betterstack heartbeat ping
│       │       └── logger.ts         # Structured logging
│       │
│       ├── package.json
│       └── tsconfig.json
│
├── packages/                         # Shared packages (monorepo)
│   ├── db/                           # Database schema and client
│   │   ├── src/
│   │   │   ├── index.ts              # Drizzle client export
│   │   │   ├── schema/               # Drizzle schema definitions
│   │   │   │   ├── users.ts
│   │   │   │   ├── teams.ts
│   │   │   │   ├── platforms.ts
│   │   │   │   ├── posts.ts
│   │   │   │   ├── media.ts
│   │   │   │   ├── analytics.ts
│   │   │   │   ├── inbox.ts
│   │   │   │   ├── auth.ts           # Better Auth tables
│   │   │   │   └── index.ts          # Re-exports all schemas
│   │   │   ├── migrations/           # Generated SQL migrations
│   │   │   └── seed.ts               # Development seed data
│   │   ├── drizzle.config.ts         # Drizzle Kit configuration
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── shared/                       # Shared types, constants, utilities
│   │   ├── src/
│   │   │   ├── types/                # Shared TypeScript types
│   │   │   │   ├── post.types.ts     # Post, ScheduledPost, PublishResult
│   │   │   │   ├── platform.types.ts # Platform, PlatformAccount, OAuthToken
│   │   │   │   ├── analytics.types.ts
│   │   │   │   └── inbox.types.ts
│   │   │   ├── constants/            # Shared constants
│   │   │   │   ├── platforms.ts      # Platform names, limits, media specs
│   │   │   │   └── plans.ts          # Pricing plan definitions
│   │   │   ├── validators/           # Zod schemas (shared validation)
│   │   │   │   ├── post.validators.ts
│   │   │   │   ├── platform.validators.ts
│   │   │   │   └── user.validators.ts
│   │   │   └── utils/                # Shared utility functions
│   │   │       ├── dates.ts          # Timezone handling, scheduling helpers
│   │   │       ├── platform-limits.ts# Character limits, media constraints
│   │   │       └── crypto.ts         # Token encryption/decryption
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── email/                        # Email templates (React Email)
│       ├── src/
│       │   ├── templates/
│       │   │   ├── welcome.tsx
│       │   │   ├── team-invite.tsx
│       │   │   ├── post-failed.tsx
│       │   │   └── weekly-report.tsx
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── tests/
│   ├── e2e/                          # Playwright E2E tests
│   │   ├── auth.spec.ts
│   │   ├── compose.spec.ts
│   │   ├── calendar.spec.ts
│   │   └── playwright.config.ts
│   └── integration/                  # Integration tests (API, workers)
│       ├── publish.test.ts
│       ├── schedule.test.ts
│       └── setup.ts                  # Test database setup/teardown
│
├── .env.example                      # Environment variable template
├── .eslintrc.js                      # ESLint configuration
├── .prettierrc                       # Prettier configuration
├── turbo.json                        # Turborepo pipeline configuration
├── package.json                      # Root package.json (workspaces)
├── pnpm-workspace.yaml               # pnpm workspace configuration
└── tsconfig.base.json                # Base TypeScript configuration
```

### Monorepo Tooling

- **pnpm** for package management (workspaces, fast installs, strict dependency isolation)
- **Turborepo** for build orchestration (parallel builds, remote caching, task dependencies)
- **TypeScript project references** for cross-package type checking

---

## 5. Implementation Plan

### Phase 1: Foundation (Weeks 1-3)

**Goal**: Working application shell with authentication, database, CI/CD, and basic UI framework.

#### Key Deliverables
- Monorepo initialized with all packages
- CI/CD pipeline running on every PR
- User can sign up, sign in, and see an empty dashboard
- Database schema for core tables deployed
- Preview deployments working for every PR

#### Technical Tasks

**Week 1: Project Scaffolding** ✅
- [x] Initialize pnpm monorepo with Turborepo
- [x] Create Next.js app (`apps/web`) with App Router, Tailwind CSS, shadcn/ui
- [x] Set up `packages/db` with Drizzle schema for users, teams, sessions (Better Auth tables)
- [x] Set up `packages/shared` with Zod validators and TypeScript types
- [x] Configure Prettier, TypeScript strict mode across all packages
- [x] Create `.env.example` with all required environment variables
- [ ] Set up Neon database (production + development branches)

**Week 2: Auth & Layout** ✅
- [x] Integrate Better Auth with Drizzle adapter and Next.js plugin
- [x] Implement sign-up, sign-in, forgot-password pages
- [x] Add Google and GitHub OAuth providers (most common for dev tools)
- [x] Build dashboard layout: sidebar navigation, header with user menu, responsive mobile nav
- [x] Implement auth middleware (protect dashboard routes)
- [x] Create team model with owner role (single-user team on signup)
- [ ] Set up Stripe customer creation on user signup

**Week 3: CI/CD & Infrastructure**
- [x] GitHub Actions: lint, type-check, build, unit test on every PR
- [x] Configure Vercel project with environment variables
- [ ] Configure Railway project for worker (placeholder process)
- [ ] Set up Neon branching for Vercel preview deploys
- [x] Integrate Sentry for error tracking (`@sentry/nextjs`)
- [x] Set up Betterstack uptime monitor for production URL
- [x] Write first unit tests for auth flow and shared validators
- [x] Deploy to production (empty dashboard, auth working)

#### Dependencies
- Neon database provisioned
- Vercel and Railway accounts created
- Stripe account created (test mode)
- Domain registered and DNS configured

#### Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Better Auth integration issues with Drizzle | Medium | Better Auth has official Drizzle adapter; fall back to NextAuth.js if blocking issues |
| Neon branching complexity with preview deploys | Low | Neon has Vercel integration; well-documented setup |
| Monorepo build complexity | Low | Turborepo handles this well; follow official examples |

---

### Phase 2: Core Scheduling (Weeks 4-7)

**Goal**: Users can connect social accounts, create posts, schedule them, and posts publish automatically on time.

#### Key Deliverables
- OAuth connection flow for 3 initial platforms (X, LinkedIn, Bluesky)
- Post composer with rich text editing and media upload
- Calendar view showing scheduled posts
- Working publishing pipeline (posts publish on time)
- Publishing failure retry and notification

#### Technical Tasks

**Week 4: Platform OAuth & Account Management** ✅
- [ ] Set up Neon development branch (separate from production)
- [ ] Configure Neon branching for Vercel preview deploys
- [x] Design and implement `platform_accounts` table (OAuth tokens, refresh tokens, profile data)
- [x] Implement token encryption at rest (AES-256-GCM via `packages/shared/utils/crypto.ts`)
- [x] Build OAuth connection flow for X (Twitter) API v2
- [x] Build OAuth connection flow for LinkedIn API
- [x] Build AT Protocol auth flow for Bluesky
- [x] Create platform accounts management page (connect, disconnect, status indicators)
- [x] Implement automatic token refresh logic (refresh before expiry)

**Week 5: Post Composer & Media Upload** ✅
- [x] Design and implement `posts` and `post_platforms` tables (schema push to Neon)
- [x] Build post composer page with rich text editor (Tiptap)
- [x] Implement platform-specific character count validation (grapheme-aware for Bluesky)
- [x] Build media uploader (drag-and-drop, paste from clipboard)
- [ ] Implement R2 presigned URL generation for direct browser uploads (using local storage adapter for now)
- [ ] Build platform preview panel (shows how post will look on each platform)
- [x] Implement draft saving (auto-save every 30 seconds)
- [x] Build post CRUD API (REST at /api/v1/posts, /api/v1/media)
- [x] Build posts list page with status filter, search, pagination
- [x] Build post edit page
- [x] Fix OAuth client baseURL for Vercel deployment

**Week 6: Scheduling Engine** ✅
- [x] Set up BullMQ with Upstash Redis in `apps/worker`
- [x] Implement scheduler worker (cron job every 30 seconds, scans for due posts)
- [x] Implement publisher worker with platform-specific publishing logic
- [x] Build platform API clients for X, LinkedIn, Bluesky (publishing adapters in `packages/shared`)
- [x] Implement retry logic with exponential backoff (30s, 2m, 10m, 30m, 1h)
- [x] Implement dead letter queue for permanently failed posts
- [x] Add scheduling UI: date picker, time picker, timezone selector
- [x] Implement "publish now" and "add to queue" options
- [ ] Deploy worker to Railway with Betterstack heartbeat monitoring

**Week 7: Calendar & Polish** ✅
- [x] Build calendar view (month, week, day views) using a headless calendar library
- [x] Implement drag-and-drop rescheduling on calendar
- [x] Build post list view with filters (draft, scheduled, published, failed)
- [x] Implement post editing for scheduled posts (updates the queued job)
- [x] Add email notification for failed posts (via Resend) — Implemented with graceful skip; needs `RESEND_API_KEY` configured in production. Set up Resend account + verified domain before launch.
- [x] Write integration tests for publishing pipeline (160 tests across 4 packages: shared 66, web 57, worker 26, email 11)
- [x] Load test the scheduler with 1000 concurrent scheduled posts (6 load tests: scheduler 3000 jobs in <5s, publisher 1000 jobs throughput, 10% failure handling, memory stability — 32 worker tests total)
- [x] BullMQ token refresh worker (every 2h, replaces Vercel cron)
- [x] Bluesky token expiry tracking (tokenExpiresAt set on auth + refresh)
- [x] Landing page with features grid, auth redirect, and /get-started page
- [x] UI polish: auth branding, dashboard stat cards, sidebar transitions

#### Dependencies
- Phase 1 complete (auth, database, CI/CD)
- X (Twitter) developer account approved
- LinkedIn developer app created
- Upstash Redis provisioned

#### Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| X (Twitter) API access restrictions or instability | High | Start with X, LinkedIn, and Bluesky; X has the most volatile API. Implement graceful degradation. |
| OAuth token refresh race conditions | Medium | Use distributed locks (Redis) when refreshing tokens. Implement token refresh queue. |
| Scheduler missing posts due to worker crash | Critical | Betterstack heartbeat alerts within 2 minutes. Railway auto-restarts crashed processes. Scheduler is idempotent (re-scans on restart). |
| Media upload failures to R2 | Medium | Client-side retry with resumable uploads. Server-side validation before publishing. |

---

### Phase 3: AI Engine (Weeks 8-10)

**Goal**: AI-powered content generation, platform adaptation, and smart suggestions integrated into the composer.

#### Key Deliverables
- AI content generation from prompts and topics
- Automatic platform adaptation (write once, AI optimizes for each platform)
- Smart hashtag suggestions
- AI tone/style adjustment
- Content improvement suggestions

#### Technical Tasks

**Week 8: AI Foundation**
- [ ] Integrate Vercel AI SDK with Claude and OpenAI providers
- [ ] Build AI streaming endpoint (`/api/ai/chat/route.ts`)
- [ ] Implement AI context system (brand voice profile, platform rules, post history)
- [ ] Create prompt templates for content generation scenarios
- [ ] Build AI assistant panel in composer (chat-style interface)
- [ ] Implement "Generate from topic" - user provides topic, AI generates post
- [ ] Implement "Improve this post" - AI suggests edits to existing draft
- [ ] Add usage tracking and per-user AI rate limiting

**Week 9: Platform Adaptation**
- [ ] Build platform adaptation engine: takes one post and generates platform-optimized variants
  - X: concise, hashtag-light, thread-ready
  - LinkedIn: professional tone, longer form, engagement hooks
  - Bluesky: conversational, community-oriented
  - Instagram: emoji-friendly, hashtag-rich, CTA in bio reference
  - TikTok: trend-aware, casual, hook-first
- [ ] Implement "Write once, adapt everywhere" workflow in composer
- [ ] Build side-by-side preview of adapted versions
- [ ] Allow manual editing of AI-adapted versions before scheduling
- [ ] Store brand voice preferences per team (tone, vocabulary, topics to avoid)

**Week 10: Smart Suggestions**
- [ ] Implement smart hashtag suggestions (AI-generated based on content + trending data)
- [ ] Build best-time-to-post suggestions (based on published post performance data)
- [ ] Implement content calendar gap analysis ("You haven't posted on LinkedIn in 5 days")
- [ ] Add AI-powered caption generation from uploaded images (vision model)
- [ ] Build A/B variant generation (AI creates 2-3 versions, user picks)
- [ ] Implement AI cost tracking dashboard (tokens used, cost per team)
- [ ] Write tests for AI prompt templates (deterministic output validation)

#### Dependencies
- Phase 2 complete (composer, publishing pipeline)
- Anthropic API key provisioned
- OpenAI API key provisioned

#### Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| AI costs exceeding budget | High | Implement per-user rate limits, use GPT-4o-mini for simple tasks (hashtags, classification), cache common prompts, track costs per request |
| AI generating inappropriate content | High | Implement content safety filtering, allow users to set brand guidelines that constrain generation, add "review before posting" default |
| Slow AI response times | Medium | Stream responses (Vercel AI SDK handles this), show progressive loading, cache frequent patterns |
| Prompt injection via user content | Medium | Sanitize user inputs before including in prompts, use system prompts to constrain behavior |

---

### Phase 4: Analytics & Inbox (Weeks 11-13)

**Goal**: Users can see post performance metrics and manage all social interactions from one inbox.

#### Key Deliverables
- Analytics dashboard with engagement metrics per platform
- Post-level performance tracking
- Unified inbox for comments, DMs, and mentions
- Reply to messages directly from inbox

#### Technical Tasks

**Week 11: Analytics Data Pipeline**
- [ ] Design `post_analytics` and `account_analytics` tables
- [ ] Build analytics sync worker for each platform (pulls engagement data via API)
- [ ] Implement sync schedule: hourly for posts < 7 days old, daily for older posts
- [ ] Handle API rate limits with per-platform request budgets
- [ ] Build analytics aggregation queries (daily, weekly, monthly rollups)
- [ ] Implement incremental sync (only fetch new data since last sync)

**Week 12: Analytics Dashboard**
- [ ] Build overview dashboard: total reach, engagement, followers across all platforms
- [ ] Build post-level analytics: likes, comments, shares, impressions per post
- [ ] Implement platform comparison charts (which platform performs best)
- [ ] Build best-performing content analysis (top posts by engagement)
- [ ] Add date range picker and platform filters
- [ ] Use Recharts or Tremor for charts (React-based, accessible)
- [ ] Implement data export (CSV download)

**Week 13: Unified Inbox**
- [ ] Design `inbox_messages` table (polymorphic: comment, DM, mention, reply)
- [ ] Build inbox sync worker for each platform
- [ ] Implement unified inbox UI: list view with platform icons, message preview, read/unread state
- [ ] Build conversation thread view (see full context of a comment thread)
- [ ] Implement reply-from-inbox (compose reply, send via platform API)
- [ ] Add inbox filters: platform, message type, read/unread, assigned team member
- [ ] Implement real-time notifications for new messages (WebSocket or polling)
- [ ] Add keyboard shortcuts for inbox navigation (j/k to navigate, r to reply, e to archive)

#### Dependencies
- Phase 2 complete (platform connections, OAuth tokens)
- Platform APIs support reading engagement data and messages
- WebSocket or SSE infrastructure for real-time inbox updates

#### Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Platform API rate limits restrict analytics sync | High | Implement aggressive caching, batch requests, respect rate limit headers, prioritize recent posts |
| DM/message access requires elevated platform permissions | High | Some platforms restrict inbox access. Start with comments/mentions (universally available), add DMs where APIs allow. |
| Analytics data inconsistency across platforms | Medium | Normalize metrics to common definitions. Show platform-native terms in tooltips. |
| Real-time inbox at scale | Medium | Start with polling (30-second intervals), migrate to WebSocket/SSE when user count justifies the infrastructure |

---

### Phase 5: Team & Polish (Weeks 14-16)

**Goal**: Team collaboration features, approval workflows, onboarding, and UI polish for launch readiness.

#### Key Deliverables
- Team invites via email
- Role-based access control (owner, admin, editor, viewer)
- Post approval workflow
- Onboarding wizard for new users
- UI polish and accessibility audit

#### Technical Tasks

**Week 14: Team Collaboration**
- [ ] Implement Better Auth organization plugin (teams, roles, invites)
- [ ] Build team invite flow: owner sends email invite, recipient joins team
- [ ] Implement role-based permissions:
  - **Owner**: full access, billing, delete team
  - **Admin**: manage members, manage platforms, publish
  - **Editor**: create/edit posts, submit for approval, cannot publish directly
  - **Viewer**: read-only access to posts, analytics, inbox
- [ ] Add permission checks to all Server Actions and API routes
- [ ] Build team management page (members list, role assignment, remove member)
- [ ] Implement per-team platform account isolation

**Week 15: Approval Workflow**
- [ ] Build approval workflow: Editor creates post -> submitted for review -> Admin/Owner approves or requests changes -> post is scheduled
- [ ] Implement approval states: draft, pending_approval, changes_requested, approved, scheduled
- [ ] Build approval UI: approval queue for admins, inline comments on posts, approve/reject buttons
- [ ] Add notification on approval status changes (email + in-app)
- [ ] Implement approval bypass for admins/owners (direct publish)
- [ ] Build activity log: who created, edited, approved, published each post

**Week 16: Onboarding & Polish**
- [ ] Build onboarding wizard for new users:
  1. Welcome + choose use case (solo creator, small team, agency)
  2. Connect first platform account
  3. Create first post (with AI assistance)
  4. Schedule or publish
- [ ] Implement empty states for all pages (helpful illustrations + CTAs)
- [ ] Accessibility audit: keyboard navigation, screen reader labels, color contrast
- [ ] Responsive design review: test all pages on mobile, tablet, desktop
- [ ] Performance optimization: lazy load heavy components, optimize images, reduce bundle size
- [ ] Add loading skeletons for all data-dependent views
- [ ] Implement global command palette (Cmd+K) for quick navigation
- [ ] Add toast notifications for all actions (post scheduled, published, failed)

#### Dependencies
- Phase 1-4 complete
- Email sending (Resend) configured for team invites

#### Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Role-based access complexity | Medium | Start with 4 simple roles. Avoid custom permission matrices until users request them. |
| Approval workflow edge cases | Medium | Keep first version simple: one approval level, one approver. Multi-level approvals in v2. |
| Accessibility compliance | Medium | Use shadcn/ui (built on Radix, which is accessible by default). Run axe-core in CI. |

---

### Phase 6: Launch Prep (Weeks 17-18)

**Goal**: Production hardening, security, monitoring, landing page, and beta launch.

#### Key Deliverables
- Load testing results demonstrating system handles 10K concurrent users
- Security audit completed and findings remediated
- Public landing page with waitlist or sign-up
- Monitoring and alerting fully configured
- Beta launched to first 100 users

#### Technical Tasks

**Week 17: Hardening**
- [ ] Load test publishing pipeline: 10K scheduled posts within a 5-minute window
- [ ] Load test API routes: 1000 concurrent requests
- [ ] Stress test database: identify slow queries, add missing indexes
- [ ] Security audit:
  - [ ] SQL injection: verify all queries use parameterized statements (Drizzle handles this)
  - [ ] XSS: verify all user input is sanitized in React (default behavior) and API responses
  - [ ] CSRF: verify Server Actions have CSRF protection (Next.js default)
  - [ ] OAuth token storage: verify encryption at rest
  - [ ] Rate limiting: verify all public endpoints have rate limits
  - [ ] CORS: verify only allowed origins
  - [ ] Dependency audit: `pnpm audit` and fix critical vulnerabilities
- [ ] Set up Stripe billing with subscription plans (free, pro, team)
- [ ] Implement usage limits by plan (posts per month, AI generations, team members)
- [ ] Configure Sentry alerts for error rate spikes
- [ ] Configure Betterstack alerts for downtime and worker heartbeat failures
- [ ] Set up log drain from Vercel to Betterstack

**Week 18: Launch**
- [x] Build landing page (marketing site): hero, features, pricing, FAQ
  - `/` landing page with hero + features, `/get-started` detailed product page,
    `/pricing` with 3 tiers (Spark/Ignite/Blaze) + FAQ section
- [ ] Set up PostHog for product analytics (sign-up funnel, feature usage)
- [ ] Write user documentation: getting started guide, platform connection guides
- [ ] Create feedback mechanism (in-app feedback widget or Canny board)
- [ ] Set up customer support channel (Discord community or email)
- [ ] Announce beta: social media, relevant communities, Product Hunt upcoming
- [ ] Monitor first 100 users closely: watch Sentry, Betterstack, PostHog dashboards
- [ ] Prepare incident response playbook (what to do if publishing fails, database goes down, etc.)

#### Dependencies
- All previous phases complete
- Stripe pricing plans finalized
- Landing page copy and design ready
- Beta user list or waitlist collected

#### Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Load testing reveals bottlenecks | High | Budget 2 days for optimization. Most likely bottleneck is database queries (add indexes) or worker throughput (add concurrency). |
| Security vulnerability discovered | High | Address critical issues immediately. Delay launch if necessary. |
| Stripe integration edge cases | Medium | Test all subscription scenarios: upgrade, downgrade, cancel, failed payment, reactivation. |
| Low initial signup rate | Medium | Not a technical risk. Ensure landing page is clear, pricing is visible, and sign-up friction is minimal. |

---

## 6. Database Schema (Key Tables)

### Core Schema

```sql
-- ============================================
-- USERS & TEAMS
-- ============================================

-- Managed by Better Auth (auto-created tables)
-- user, session, account, verification tables
-- We extend with additional profile fields

CREATE TABLE teams (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name            TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,
    plan            TEXT NOT NULL DEFAULT 'free',  -- 'free', 'pro', 'team'
    stripe_customer_id    TEXT,
    stripe_subscription_id TEXT,
    ai_credits_used       INTEGER NOT NULL DEFAULT 0,
    ai_credits_limit      INTEGER NOT NULL DEFAULT 100,  -- per billing period
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_teams_slug ON teams(slug);
CREATE INDEX idx_teams_stripe_customer_id ON teams(stripe_customer_id);

CREATE TABLE team_members (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    team_id         TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id         TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    role            TEXT NOT NULL DEFAULT 'editor',  -- 'owner', 'admin', 'editor', 'viewer'
    invited_by      TEXT REFERENCES "user"(id),
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(team_id, user_id)
);

CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);

-- ============================================
-- PLATFORM CONNECTIONS
-- ============================================

CREATE TABLE platform_accounts (
    id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    team_id             TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    platform            TEXT NOT NULL,  -- 'x', 'linkedin', 'instagram', 'facebook', 'tiktok', etc.
    platform_user_id    TEXT NOT NULL,  -- Platform-specific user/page ID
    platform_username   TEXT,           -- Display username (@handle)
    platform_name       TEXT,           -- Display name
    platform_avatar_url TEXT,
    access_token_enc    TEXT NOT NULL,  -- AES-256-GCM encrypted
    refresh_token_enc   TEXT,           -- AES-256-GCM encrypted (nullable for platforms without refresh)
    token_expires_at    TIMESTAMPTZ,
    scopes              TEXT[],         -- Granted OAuth scopes
    metadata            JSONB DEFAULT '{}',  -- Platform-specific metadata (page ID, etc.)
    is_active           BOOLEAN NOT NULL DEFAULT true,
    last_synced_at      TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(team_id, platform, platform_user_id)
);

CREATE INDEX idx_platform_accounts_team_id ON platform_accounts(team_id);
CREATE INDEX idx_platform_accounts_platform ON platform_accounts(platform);
CREATE INDEX idx_platform_accounts_token_expires ON platform_accounts(token_expires_at)
    WHERE is_active = true;

-- ============================================
-- POSTS & SCHEDULING
-- ============================================

CREATE TABLE posts (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    team_id         TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    created_by      TEXT NOT NULL REFERENCES "user"(id),

    -- Content
    content         TEXT,              -- Primary text content
    content_html    TEXT,              -- Rich text HTML (for editor state)

    -- Status workflow
    status          TEXT NOT NULL DEFAULT 'draft',
    -- 'draft', 'pending_approval', 'changes_requested', 'approved',
    -- 'scheduled', 'publishing', 'published', 'partially_published', 'failed'

    -- Scheduling
    scheduled_at    TIMESTAMPTZ,       -- When to publish (null = draft/immediate)
    published_at    TIMESTAMPTZ,       -- When actually published

    -- Approval
    approved_by     TEXT REFERENCES "user"(id),
    approved_at     TIMESTAMPTZ,
    approval_note   TEXT,

    -- AI metadata
    ai_generated    BOOLEAN NOT NULL DEFAULT false,
    ai_prompt       TEXT,              -- Original prompt used to generate
    ai_model        TEXT,              -- Model used (claude-sonnet, gpt-4o-mini, etc.)

    -- Metadata
    tags            TEXT[] DEFAULT '{}',
    metadata        JSONB DEFAULT '{}',

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_posts_team_id ON posts(team_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_scheduled_at ON posts(scheduled_at)
    WHERE status = 'scheduled' AND scheduled_at IS NOT NULL;
CREATE INDEX idx_posts_team_status ON posts(team_id, status);
CREATE INDEX idx_posts_created_by ON posts(created_by);

-- Per-platform version of a post (adapted content for each platform)
CREATE TABLE post_platforms (
    id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    post_id             TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    platform_account_id TEXT NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,

    -- Platform-specific content (may differ from parent post due to AI adaptation)
    content             TEXT,           -- Platform-adapted text
    hashtags            TEXT[],         -- Platform-specific hashtags

    -- Publishing state
    status              TEXT NOT NULL DEFAULT 'pending',
    -- 'pending', 'publishing', 'published', 'failed', 'retry_scheduled'

    -- Platform response
    platform_post_id    TEXT,           -- ID of the post on the platform (for analytics/linking)
    platform_post_url   TEXT,           -- Direct URL to the published post

    -- Error tracking
    error_message       TEXT,
    retry_count         INTEGER NOT NULL DEFAULT 0,
    max_retries         INTEGER NOT NULL DEFAULT 5,
    last_retry_at       TIMESTAMPTZ,

    -- Metadata
    metadata            JSONB DEFAULT '{}',  -- Platform-specific options (first comment, alt text, etc.)

    published_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_post_platforms_post_id ON post_platforms(post_id);
CREATE INDEX idx_post_platforms_platform_account ON post_platforms(platform_account_id);
CREATE INDEX idx_post_platforms_status ON post_platforms(status);
CREATE INDEX idx_post_platforms_retry ON post_platforms(status, retry_count, max_retries)
    WHERE status = 'failed' AND retry_count < max_retries;

-- ============================================
-- MEDIA
-- ============================================

CREATE TABLE media (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    team_id         TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    uploaded_by     TEXT NOT NULL REFERENCES "user"(id),

    -- File info
    file_name       TEXT NOT NULL,
    file_size       INTEGER NOT NULL,  -- bytes
    mime_type       TEXT NOT NULL,      -- 'image/jpeg', 'video/mp4', etc.
    width           INTEGER,
    height          INTEGER,
    duration        INTEGER,           -- seconds, for video/audio

    -- Storage
    storage_key     TEXT NOT NULL,      -- R2 object key
    storage_url     TEXT NOT NULL,      -- Public CDN URL
    thumbnail_key   TEXT,              -- R2 key for thumbnail
    thumbnail_url   TEXT,

    -- Alt text for accessibility
    alt_text        TEXT,
    ai_alt_text     TEXT,              -- AI-generated alt text

    -- Processing
    processing_status TEXT NOT NULL DEFAULT 'uploaded',  -- 'uploaded', 'processing', 'ready', 'failed'

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_media_team_id ON media(team_id);

-- Junction table: posts can have multiple media, media can be reused
CREATE TABLE post_media (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    post_id     TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    media_id    TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    position    INTEGER NOT NULL DEFAULT 0,  -- Order of media in post

    UNIQUE(post_id, media_id)
);

CREATE INDEX idx_post_media_post_id ON post_media(post_id);

-- ============================================
-- ANALYTICS
-- ============================================

CREATE TABLE post_analytics (
    id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    post_platform_id    TEXT NOT NULL REFERENCES post_platforms(id) ON DELETE CASCADE,

    -- Engagement metrics (nullable because not all platforms provide all metrics)
    impressions         INTEGER,
    reach               INTEGER,
    likes               INTEGER,
    comments            INTEGER,
    shares              INTEGER,        -- retweets, reposts, etc.
    saves               INTEGER,
    clicks              INTEGER,
    video_views         INTEGER,

    -- Follower impact
    profile_visits      INTEGER,
    follows             INTEGER,

    -- Engagement rate (calculated: (likes+comments+shares) / impressions * 100)
    engagement_rate     DECIMAL(5,2),

    -- Raw platform response for fields we don't normalize
    raw_data            JSONB DEFAULT '{}',

    -- Sync metadata
    synced_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(post_platform_id)  -- One analytics row per platform post (updated in place)
);

CREATE INDEX idx_post_analytics_post_platform ON post_analytics(post_platform_id);

-- Daily aggregate analytics per platform account (for trend charts)
CREATE TABLE account_analytics_daily (
    id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    platform_account_id TEXT NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
    date                DATE NOT NULL,

    followers           INTEGER,
    following           INTEGER,
    posts_count         INTEGER,
    impressions         INTEGER,
    engagement          INTEGER,

    raw_data            JSONB DEFAULT '{}',
    synced_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(platform_account_id, date)
);

CREATE INDEX idx_account_analytics_daily_account_date
    ON account_analytics_daily(platform_account_id, date DESC);

-- ============================================
-- UNIFIED INBOX
-- ============================================

CREATE TABLE inbox_messages (
    id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    team_id             TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    platform_account_id TEXT NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,

    -- Message metadata
    message_type        TEXT NOT NULL,  -- 'comment', 'reply', 'dm', 'mention', 'review'
    platform_message_id TEXT NOT NULL,  -- Platform's unique ID for this message

    -- Sender info
    sender_platform_id  TEXT,
    sender_username     TEXT,
    sender_name         TEXT,
    sender_avatar_url   TEXT,

    -- Content
    content             TEXT,
    media_urls          TEXT[],

    -- Context: which post was this about (if applicable)
    post_platform_id    TEXT REFERENCES post_platforms(id),

    -- Thread/conversation grouping
    thread_id           TEXT,          -- Group related messages
    parent_message_id   TEXT REFERENCES inbox_messages(id),

    -- State
    is_read             BOOLEAN NOT NULL DEFAULT false,
    is_archived         BOOLEAN NOT NULL DEFAULT false,
    assigned_to         TEXT REFERENCES "user"(id),

    -- Sentiment (AI-analyzed)
    sentiment           TEXT,          -- 'positive', 'neutral', 'negative', 'urgent'

    -- Timestamps
    platform_created_at TIMESTAMPTZ,   -- When message was created on platform
    synced_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inbox_messages_team_id ON inbox_messages(team_id);
CREATE INDEX idx_inbox_messages_team_unread ON inbox_messages(team_id, is_read)
    WHERE is_read = false AND is_archived = false;
CREATE INDEX idx_inbox_messages_platform_account ON inbox_messages(platform_account_id);
CREATE INDEX idx_inbox_messages_thread ON inbox_messages(thread_id);
CREATE INDEX idx_inbox_messages_platform_id
    ON inbox_messages(platform_account_id, platform_message_id);
CREATE INDEX idx_inbox_messages_assigned ON inbox_messages(assigned_to)
    WHERE assigned_to IS NOT NULL;

-- ============================================
-- ACTIVITY LOG (AUDIT TRAIL)
-- ============================================

CREATE TABLE activity_log (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    team_id     TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id     TEXT REFERENCES "user"(id),  -- nullable for system actions

    action      TEXT NOT NULL,  -- 'post.created', 'post.approved', 'post.published', etc.
    entity_type TEXT NOT NULL,  -- 'post', 'platform_account', 'team_member', etc.
    entity_id   TEXT NOT NULL,

    metadata    JSONB DEFAULT '{}',  -- Action-specific details

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_log_team ON activity_log(team_id, created_at DESC);
CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);

-- ============================================
-- SCHEDULING LOCKS (Prevents duplicate publishes)
-- ============================================

CREATE TABLE scheduling_locks (
    post_id     TEXT PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
    worker_id   TEXT NOT NULL,          -- Identifier of the worker that acquired the lock
    locked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ NOT NULL    -- Lock auto-expires for crash recovery
);

CREATE INDEX idx_scheduling_locks_expires ON scheduling_locks(expires_at);
```

### Schema Design Principles

1. **Text IDs**: Using `gen_random_uuid()::text` instead of auto-increment integers. UUIDs prevent enumeration attacks and simplify distributed systems if we ever need to shard.

2. **Encrypted tokens**: OAuth tokens are encrypted at rest using AES-256-GCM. The encryption key is stored in environment variables, never in the database. The `_enc` suffix signals this to developers.

3. **Soft status tracking**: Posts use a status state machine (`draft` -> `pending_approval` -> `approved` -> `scheduled` -> `publishing` -> `published`). Each state transition is logged in `activity_log`.

4. **Platform separation**: `post_platforms` separates per-platform content from the parent post. This allows AI-adapted versions per platform, independent publishing status, and platform-specific error tracking.

5. **Scheduling locks**: The `scheduling_locks` table prevents race conditions where two workers might try to publish the same post. Uses PostgreSQL's `INSERT ... ON CONFLICT` for atomic lock acquisition.

6. **JSONB for flexibility**: Platform-specific metadata that varies between platforms is stored as JSONB. This avoids endless nullable columns while still allowing queries on the data.

7. **Partial indexes**: Indexes like `WHERE status = 'scheduled'` only index the rows that matter, keeping the index small and fast as the total row count grows.

---

## 7. Key Technical Risks & Mitigations

### Risk 1: Platform API Changes / Deprecation

**Severity**: High
**Likelihood**: High (happens regularly, especially with X/Twitter)

**Description**: Social media platforms frequently change, deprecate, or restrict their APIs. X (Twitter) has been particularly volatile post-acquisition, with pricing changes, rate limit restrictions, and breaking changes. Meta periodically deprecates Instagram/Facebook Graph API versions. TikTok's API is still maturing.

**Mitigations**:
1. **Adapter pattern**: Each platform implements a common `PlatformAdapter` interface. When an API changes, only that adapter needs updating. The rest of the application is unaffected.
   ```typescript
   interface PlatformAdapter {
     publishPost(post: PostContent, account: PlatformAccount): Promise<PublishResult>;
     deletePost(platformPostId: string, account: PlatformAccount): Promise<void>;
     getAnalytics(platformPostId: string, account: PlatformAccount): Promise<AnalyticsData>;
     getInboxMessages(account: PlatformAccount, since: Date): Promise<InboxMessage[]>;
     refreshToken(account: PlatformAccount): Promise<TokenPair>;
   }
   ```
2. **Version pinning**: Pin to specific API versions where platforms support it (Meta Graph API v19.0, not "latest").
3. **Automated API health checks**: Monitor platform API status pages and run daily integration tests against sandbox environments.
4. **Graceful degradation**: If a platform API is down, queue the post for retry rather than failing. Show clear status indicators to users ("X publishing delayed - platform issue").
5. **Changelog monitoring**: Subscribe to platform developer newsletters and API changelog RSS feeds.

---

### Risk 2: AI Cost Management

**Severity**: High
**Likelihood**: Medium

**Description**: AI content generation costs can grow unpredictably. A viral feature or a power user generating hundreds of posts could spike API costs. Claude Sonnet costs ~$3 per million input tokens and ~$15 per million output tokens. At scale, AI costs could exceed hosting costs.

**Mitigations**:
1. **Per-team rate limits**: Each plan has an AI generation limit (e.g., Free: 10/month, Pro: 100/month, Team: 500/month). Hard cap prevents runaway costs.
2. **Model tiering**: Use the cheapest model that works for each task:
   - Claude Sonnet for content generation (quality matters)
   - GPT-4o-mini for hashtag suggestions, sentiment analysis (speed/cost matters)
   - Cache results for common operations (e.g., hashtag suggestions for similar content)
3. **Token budget per request**: Cap input context length. Do not send entire post history as context -- use summarization and retrieval.
4. **Prompt caching**: Anthropic's prompt caching feature reduces costs for repeated system prompts by up to 90%.
5. **Usage dashboard**: Visible AI credit usage in settings so users self-regulate and teams can track which members consume the most.
6. **Async generation for bulk**: Batch AI operations through the worker queue to control concurrency and prevent API rate limiting.

---

### Risk 3: Scheduling Reliability

**Severity**: Critical
**Likelihood**: Medium

**Description**: The core value proposition of a scheduling platform is that posts publish on time. A missed or delayed post erodes user trust immediately. Failure modes include: worker crash, Redis failure, database lock contention, platform API timeout during publish window.

**Mitigations**:
1. **Heartbeat monitoring**: Worker sends a heartbeat to Betterstack every 60 seconds. If missed, PagerDuty alert triggers within 2 minutes.
2. **Redundant scheduling check**: The scheduler worker scans every 30 seconds for posts due within the next 60 seconds. This overlap ensures a post is never missed even if one scan cycle fails.
3. **Idempotent publishing**: Each publish job checks if the post was already published before calling the platform API. Uses the `scheduling_locks` table and `post_platforms.platform_post_id` to prevent duplicates.
4. **Railway auto-restart**: Railway automatically restarts crashed processes. Combined with BullMQ's job persistence (jobs survive worker restarts because they are stored in Redis), no scheduled posts are lost.
5. **Dead letter queue + alerts**: After 5 retries, failed posts move to a dead letter queue and trigger an email notification to the user + Slack alert to the developer.
6. **Scheduled post buffer**: Encourage users to schedule posts at least 5 minutes in advance. Show a warning for posts scheduled less than 2 minutes out.
7. **Health dashboard**: Internal dashboard showing queue depth, processing latency, and failure rates. If queue depth grows unexpectedly, alert fires.

---

### Risk 4: OAuth Token Management at Scale

**Severity**: High
**Likelihood**: Medium

**Description**: Each connected platform account has OAuth tokens that expire. At scale (1000+ connected accounts), token refresh becomes a significant operational concern. Race conditions during refresh, expired tokens during publishing, and platform-specific token lifetimes all create failure modes.

**Mitigations**:
1. **Proactive refresh**: A daily cron job scans for tokens expiring within the next 24 hours and refreshes them preemptively. This avoids the "token expired during publish" failure mode.
2. **Refresh lock**: When refreshing a token, acquire a Redis lock keyed by `platform_account_id`. This prevents two workers from refreshing the same token simultaneously (which would invalidate the first refresh).
3. **Token refresh queue**: Token refreshes go through a dedicated BullMQ queue with rate limiting per platform (e.g., max 10 refresh requests per second to Meta API).
4. **Graceful token failure**: If a token cannot be refreshed (user revoked access, platform changed OAuth flow), mark the platform account as `inactive`, notify the user via email, and pause all scheduled posts for that account.
5. **Encryption rotation**: Store the encryption key version alongside the encrypted token. When rotating encryption keys, a background job re-encrypts all tokens with the new key.

---

### Risk 5: Media Processing Bottlenecks

**Severity**: Medium
**Likelihood**: Medium

**Description**: Social media platforms have strict media requirements (dimensions, file sizes, formats, duration limits). Processing media (resizing images, generating thumbnails, validating videos) is CPU-intensive and can bottleneck the publishing pipeline if done synchronously.

**Mitigations**:
1. **Async processing**: Media is processed immediately after upload (via the media processing queue), not at publish time. By the time a post is scheduled to publish, all media is already processed and ready.
2. **Sharp for images**: Use the Sharp library (libvips-based) for image processing. It is significantly faster and more memory-efficient than ImageMagick or Jimp.
3. **Platform-specific variants**: Pre-generate media variants for each target platform at upload time:
   - Instagram: 1080x1080 (square), 1080x1350 (portrait), 1080x608 (landscape)
   - X: 1200x675
   - LinkedIn: 1200x627
   - TikTok: 1080x1920 (vertical video thumbnail)
4. **Client-side validation**: Validate file type, size, and dimensions in the browser before uploading to R2. Reject clearly invalid files without wasting bandwidth or processing time.
5. **Video processing deferral**: For video content, validate format and duration client-side. Actual transcoding (if needed) can be deferred to a specialized service (e.g., Mux or Cloudflare Stream) rather than processing in-house.
6. **Storage limits by plan**: Free: 500MB, Pro: 5GB, Team: 25GB. Prevents storage abuse and keeps R2 costs predictable.

---

### Risk 6: Single Point of Failure (Solo Developer)

**Severity**: High
**Likelihood**: High

**Description**: A solo developer is the single point of failure for the entire system. Burnout, illness, or context-switching can halt development. Complex debugging sessions can consume entire days.

**Mitigations**:
1. **Automated everything**: CI/CD, database migrations, preview deploys, error tracking, uptime monitoring -- all automated. Minimize manual operational tasks.
2. **Comprehensive logging**: Structured logging at every critical path (scheduling, publishing, token refresh). When something breaks at 2 AM, logs should tell the full story without needing to reproduce the issue.
3. **Simple architecture**: Monolith-first with minimal services. Two deployments (Vercel + Railway), not ten. Every added service increases operational burden.
4. **AI-assisted development**: Use Claude Code, GitHub Copilot, and cursor for development acceleration. The chosen stack (Next.js, React, TypeScript) has the deepest AI assistance support.
5. **Documentation in code**: TypeScript types, Zod validators, and meaningful variable names serve as living documentation. Avoid external wikis that go stale.
6. **Incident runbook**: A simple playbook in the repo: "If X happens, do Y." Covers the most likely failures (worker down, database connection exhausted, platform API outage).

---

### Risk 7: Data Privacy & Compliance

**Severity**: High
**Likelihood**: Low (but high impact if violated)

**Description**: Handling OAuth tokens, social media content, and user data requires careful attention to privacy regulations (GDPR, CCPA) and platform terms of service.

**Mitigations**:
1. **Minimal data retention**: Only store data needed for the product to function. Do not store platform content that users have not explicitly imported.
2. **Encryption at rest**: OAuth tokens encrypted with AES-256-GCM. Database hosted on Neon (encrypted at rest by default).
3. **Data deletion**: Implement hard delete for user accounts (GDPR right to erasure). When a user deletes their account, all associated data (posts, media, analytics, inbox messages) is permanently deleted.
4. **Platform ToS compliance**: Each platform has specific rules about data storage and usage. Document these requirements and implement accordingly (e.g., Meta requires deleting user data within 30 days of token revocation).
5. **Privacy policy and ToS**: Have legal documents reviewed before launch. Use a template service (e.g., Termly) as a starting point.

---

## Appendix: Decision Log

| Date | Decision | Context | Alternatives Considered | Outcome |
|------|----------|---------|------------------------|---------|
| 2026-02 | Next.js 15 for frontend + backend | Need unified stack for solo dev | Nuxt, SvelteKit, Remix | Largest ecosystem, best AI support |
| 2026-02 | Drizzle over Prisma for ORM | Serverless performance matters, schema-as-code | Prisma, TypeORM, Kysely | Better cold starts, SQL-like API |
| 2026-02 | BullMQ over Trigger.dev for jobs | Cannot depend on third-party for core publishing | Trigger.dev, Inngest, pg-boss | Full control, battle-tested reliability |
| 2026-02 | Better Auth over Clerk | Data ownership, cost at scale, Lucia recommendation | Clerk, NextAuth, Supabase Auth | Free, owns data, native Drizzle support |
| 2026-02 | Neon over Supabase for database | Need branching, serverless scaling, pure PostgreSQL | Supabase, PlanetScale | Branching for previews, no unnecessary extras |
| 2026-02 | Vercel + Railway split deploy | Vercel cannot run persistent workers | All-on-Railway, Fly.io, AWS | Best DX for each concern |
| 2026-02 | Cloudflare R2 over S3 | Zero egress for media-heavy app | S3, Supabase Storage, Uploadthing | S3-compatible, cheapest at scale |
| 2026-02 | Vercel AI SDK over LangChain | Need lightweight, multi-provider abstraction | LangChain, direct API calls | Less bloat, React hooks, streaming |

---

**End of Technical Architecture & Implementation Plan**

*This is a living document. Decisions should be revisited as the product evolves, user feedback comes in, and the technology landscape changes.*
