# SocialSpark

**Write once. Publish everywhere. Optimized by AI.**

SocialSpark is an AI-native social media scheduling platform that lets creators and small teams generate content, auto-adapt it for each platform, and publish everywhere from a single dashboard.

---

## The Problem

Managing social media across 10+ platforms is painful:
- Writing platform-specific content takes 45+ minutes per post
- No affordable tool truly adapts content per platform (tone, length, hashtags, format)
- Enterprise tools (Hootsuite, Sprout Social) cost $99-500+/month
- Budget tools (Buffer, Publer) lack AI and meaningful analytics

## The Solution

SocialSpark combines **AI content generation**, **automatic cross-platform adaptation**, and **reliable scheduling** into one affordable tool:

1. **Write once** - Draft a post or let AI generate it from a brief
2. **AI adapts** - Instantly get 10 platform-optimized versions
3. **Schedule & publish** - One click to schedule across all platforms

What takes 45 minutes manually takes under 5 minutes with SocialSpark.

---

## Key Features (MVP)

### AI Content Engine (Primary Differentiator)
- Generate posts from a topic/prompt using Claude AI
- **"Write Once, Publish Everywhere"** - AI auto-adapts content per platform's best practices
- Smart Composer - inline AI suggestions as you type
- AI image generation from text prompts
- Brand voice learning - AI matches your style over time
- AI-suggested best posting times per platform

### Multi-Platform Support
Instagram, Facebook, X/Twitter, LinkedIn, TikTok, YouTube, Threads, Pinterest, Bluesky, Mastodon

### Content Creation & Scheduling
- Rich text editor with media uploads and platform previews
- Visual calendar (day/week/month) with drag-and-drop
- Queue system, bulk CSV scheduling, evergreen post recycling
- Template system for recurring content types

### Analytics & Intelligence
- Per-platform metrics aggregated into one dashboard
- Content Intelligence - AI-driven strategy recommendations
- Trend Radar - discover trending topics in your niche
- Exportable reports (PDF/CSV)

### Team Collaboration
- Role-based access (Admin, Editor, Viewer)
- Approval workflows (draft → review → approved → scheduled)
- Unified inbox for comments and mentions across all platforms

---

## Pricing

| Tier | Price | Highlights |
|------|-------|------------|
| **Spark** (Free) | $0/mo | 3 accounts, 30 posts/mo, 20 AI generations |
| **Ignite** (Pro) | $19/mo | 10 accounts, unlimited posts, 100 AI generations |
| **Blaze** (Team) | $49/mo | 25 accounts, 3 team members, approvals, 500 AI generations |

AI content adaptation is available on **every tier, including free**.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend + API | Next.js 15 (App Router) |
| Database | PostgreSQL (Neon) |
| ORM | Drizzle |
| Background Jobs | BullMQ + Redis (Railway) |
| AI | Vercel AI SDK (Claude + GPT-4o-mini) |
| Auth | Better Auth |
| File Storage | Cloudflare R2 |
| Hosting | Vercel (web) + Railway (workers) |
| Monitoring | Sentry + Betterstack |

**Architecture**: Monorepo (pnpm + Turborepo) with two deployments - Vercel for the web app, Railway for background workers.

```
apps/
  web/              # Next.js app (frontend + API)
  worker/           # BullMQ workers (scheduler, publisher, analytics, inbox)
packages/
  db/               # Drizzle schema & migrations
  shared/           # Types, validators, platform adapters
  email/            # Email templates
docs/               # Specifications
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [MVP Features](docs/MVP_FEATURES.md) | Product vision, personas, features with acceptance criteria, pricing |
| [Functional Spec](docs/FUNCTIONAL_SPEC.md) | User stories, data model, API endpoints, platform integration details |
| [Non-Functional Spec](docs/NON_FUNCTIONAL_SPEC.md) | Performance, security, scalability, GDPR, accessibility |
| [Technical Approach](docs/TECHNICAL_APPROACH.md) | Stack comparison, architecture, implementation plan, DB schema |

### Market Research
| Document | Description |
|----------|-------------|
| [Market Research Report](MARKET_RESEARCH_REPORT.md) | 21 competitors analyzed in detail |
| [Competitor Quick Reference](COMPETITOR_QUICK_REFERENCE.md) | Comparison matrices by price, features, use case |
| [Strategic Insights](STRATEGIC_INSIGHTS.md) | Market gaps, positioning, financial projections |

---

## Implementation Roadmap

| Phase | Weeks | Focus |
|-------|-------|-------|
| 1: Foundation | 1-3 | Auth, DB schema, UI shell, CI/CD |
| 2: Core Scheduling | 4-7 | Platform OAuth, editor, calendar, publishing pipeline |
| 3: AI Engine | 8-10 | Content generation, adaptation, smart composer |
| 4: Analytics & Inbox | 11-13 | Data sync, dashboards, unified inbox |
| 5: Team & Polish | 14-16 | Collaboration, approvals, onboarding |
| 6: Launch Prep | 17-18 | Load testing, security audit, beta launch |

---

## Competitive Landscape

SocialSpark sits in the **AI-native, affordable** quadrant - a space no current tool owns:

- **vs Buffer/Publer** ($6-12/mo): Similar price, but SocialSpark adds AI content generation + cross-platform adaptation
- **vs SocialBee** ($29/mo): Better AI adaptation (per-platform, not just generation) at lower price
- **vs Hootsuite/Sprout Social** ($99-500+/mo): 80% of the features at 20% of the price
- **vs PostSyncer** ($15-79/mo): Deeper AI integration, progressive disclosure UI, more platform coverage

---

## License

Proprietary. All rights reserved.
