# SocialSpark Functional Specification

**Version**: 1.0
**Date**: February 12, 2026
**Status**: Draft
**Author**: Product & Engineering
**Related Docs**: [MVP Features](./MVP_FEATURES.md) | [Non-Functional Spec](./NON_FUNCTIONAL_SPEC.md) | [Technical Approach](./TECHNICAL_APPROACH.md)

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [User Stories & Workflows](#2-user-stories--workflows)
3. [Data Model](#3-data-model)
4. [API Design](#4-api-design)
5. [Platform Integration Details](#5-platform-integration-details)
6. [Error Handling & Edge Cases](#6-error-handling--edge-cases)

---

## 1. System Overview

### 1.1 System Context

SocialSpark is an AI-native social media management platform that enables creators and small teams to create content once and publish it, optimized by AI, across 10+ social platforms. The system sits between the user and social media platform APIs, handling content creation, AI adaptation, scheduling, publishing, analytics collection, and engagement management.

```
                    ┌─────────────────────────────────────────┐
                    │              EXTERNAL ACTORS             │
                    │                                          │
                    │  ┌──────────┐  ┌──────────┐  ┌───────┐ │
                    │  │ Creators │  │ Team     │  │Viewers│ │
                    │  │ (Solo)   │  │ Members  │  │       │ │
                    │  └────┬─────┘  └────┬─────┘  └───┬───┘ │
                    └───────┼─────────────┼────────────┼──────┘
                            │             │            │
                            ▼             ▼            ▼
┌───────────────────────────────────────────────────────────────────┐
│                        SOCIALSPARK SYSTEM                         │
│                                                                   │
│  ┌─────────────┐ ┌──────────────┐ ┌────────────┐ ┌───────────┐  │
│  │ Auth &      │ │ AI Content   │ │ Scheduling │ │ Analytics │  │
│  │ Onboarding  │ │ Engine       │ │ & Publish  │ │ Engine    │  │
│  └─────────────┘ └──────────────┘ └────────────┘ └───────────┘  │
│  ┌─────────────┐ ┌──────────────┐ ┌────────────┐ ┌───────────┐  │
│  │ Content     │ │ Team &       │ │ Unified    │ │ Media     │  │
│  │ Editor      │ │ Collaboration│ │ Inbox      │ │ Library   │  │
│  └─────────────┘ └──────────────┘ └────────────┘ └───────────┘  │
└────────────────────────────┬──────────────────────────────────────┘
                             │
                             ▼
┌───────────────────────────────────────────────────────────────────┐
│                    EXTERNAL PLATFORM APIS                          │
│                                                                   │
│  Instagram  Facebook  X/Twitter  LinkedIn  TikTok  YouTube        │
│  Threads    Pinterest  Bluesky   Mastodon                         │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ AI/LLM   │  │ Stripe   │  │ Resend   │  │ R2/CDN   │         │
│  │ Providers │  │ Billing  │  │ Email    │  │ Storage  │         │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘         │
└───────────────────────────────────────────────────────────────────┘
```

### 1.2 Actors

| Actor | Description | Key Capabilities |
|-------|-------------|------------------|
| **Solo Creator** | Individual content creator managing their own accounts. Free or Pro tier. | Full content creation, AI generation, scheduling, analytics. No team features. |
| **Team Admin/Owner** | Workspace owner or admin on the Team tier. | All creator capabilities + invite members, manage roles, configure approval workflows, manage billing and platform connections. |
| **Team Editor** | Content creator within a team workspace. | Create/edit content, submit for approval, schedule approved content, view analytics, respond in inbox. Cannot manage billing, platform connections, or team settings. |
| **Team Viewer** | Read-only stakeholder (e.g., client). | View calendar, analytics, inbox. Cannot create, edit, or publish content. |
| **Scheduler Worker** | Automated background process. | Scans for due posts, enqueues publish jobs, handles retries. Runs every 30 seconds. |
| **Analytics Sync Worker** | Automated background process. | Pulls engagement metrics from platform APIs on a periodic schedule (hourly/daily). |
| **Inbox Sync Worker** | Automated background process. | Polls platform APIs for comments, mentions, and replies every 15 minutes. |

### 1.3 System Boundaries

**In Scope (MVP)**:
- User authentication (email/password, Google OAuth, Apple ID, magic link)
- OAuth connections for 10 platforms
- AI content generation and cross-platform adaptation
- Rich text editor with media upload
- Visual calendar with scheduling, queue, and bulk import
- Team collaboration with roles and single-level approval
- Analytics dashboard with per-platform and per-post metrics
- Unified inbox for comments, mentions, and replies
- Evergreen post recycling with AI variation
- Brand voice learning and profiles

**Out of Scope (Post-MVP)**:
- DM inbox integration
- Multi-level approval workflows
- Social commerce (TikTok Shop, Instagram Shop)
- Advanced competitor intelligence
- White-label / agency portal
- Public API
- Native mobile apps (iOS/Android)
- A/B testing
- Video generation (text-to-video)
- Multi-workspace

---

## 2. User Stories & Workflows

### 2.1 Authentication & Onboarding

#### US-AUTH-01: Account Creation

**As a** new user, **I want to** create an account quickly **so that** I can start managing my social media.

**Flow**:
1. User visits signup page.
2. User chooses method: email/password, Google OAuth, or Apple ID.
3. For email/password: user enters email and password (min 10 chars, checked against breached password DB). Verification email sent. Account usable immediately but flagged until verified.
4. For OAuth: redirect to provider, consent, redirect back with account created.
5. A default workspace (team) is created automatically with the user as Owner.
6. User is redirected to the guided setup wizard.

**Edge Cases**:
- Duplicate email: show "Account already exists. Log in or reset password."
- OAuth email matches existing email/password account: prompt to link accounts.
- Rate limit: 5 failed signup attempts per IP per 15 minutes.

#### US-AUTH-02: Guided Setup Wizard

**As a** first-time user, **I want** a guided setup **so that** I experience the core value within 5 minutes.

**Flow**:
1. Step 1: Connect at least one social platform via OAuth (skippable).
2. Step 2: Set timezone (auto-detected from browser, manual override available).
3. Step 3: Optionally upload logo and brand colors.
4. Step 4: Enter a topic; AI generates a sample post.
5. Step 5: Preview the post as it would appear on the connected platform(s).
6. Step 6: Schedule, publish now, or discard.
7. Wizard is skippable at any step and replayable from settings.

#### US-AUTH-03: Platform OAuth Connection

**As a** user, **I want to** connect my social media accounts securely **so that** SocialSpark can publish on my behalf.

**Flow**:
1. User navigates to Settings > Connected Accounts.
2. User clicks "Connect" next to a platform.
3. OAuth flow launches (redirect to platform authorization page).
4. User reviews requested permissions and authorizes.
5. Redirect back to SocialSpark. Tokens stored encrypted (AES-256-GCM).
6. Account appears as "Connected" with avatar, username, follower count.
7. Automatic token refresh runs 10 minutes before expiry. If refresh fails, user is notified and prompted to re-authorize.

**Supported Platforms**: Instagram (via Meta), Facebook Pages, X/Twitter, LinkedIn (personal + company), TikTok, YouTube, Threads, Pinterest, Bluesky (AT Protocol), Mastodon (user specifies instance URL).

---

### 2.2 AI Content Engine

#### US-AI-01: Generate Content from Prompt

**As a** creator, **I want to** generate post content from a brief topic **so that** I never face a blank page.

**Flow**:
1. User opens the post composer.
2. User clicks "Generate with AI" or types in the AI assistant panel.
3. User provides: topic/brief, optional URL for reference, optional pasted content to rework.
4. User selects tone (Professional, Casual, Witty, Inspirational, Educational, or Custom free-text).
5. User selects target length (Short <100 chars, Medium 100-300 chars, Long 300+, or Platform Default).
6. AI generates 3 variants, each including: main copy, suggested hashtags (platform-appropriate count), and a CTA suggestion.
7. Generation completes in <5 seconds (streamed).
8. User can pick a variant, edit it, regenerate, or mix-and-match parts.
9. Generation history saved for the session.

**AI Usage Tracking**: Each generation deducts 1 from the user's monthly AI credit allowance. Free: 20/mo, Pro: 100/mo, Team: 500/mo.

#### US-AI-02: Adapt Content for All Platforms

**As a** creator, **I want to** write content once and have it adapted for each platform **so that** each version is optimized without manual effort.

**Flow**:
1. User has content in the composer (manually written or AI-generated).
2. User clicks "Adapt for All Platforms."
3. AI generates a tailored version for each connected platform in parallel (<8 seconds total).
4. Versions appear in a side-by-side or tabbed preview.
5. Each version respects platform-specific rules (character limits, hashtag counts, tone, format).
6. User can edit any individual version without affecting others.
7. User can exclude specific platforms from a post.
8. User can re-adapt a single platform version after manual edits.

**Platform Adaptation Rules**:

| Platform | Max Length | Hashtags | Tone Default | Special Formats |
|----------|-----------|----------|-------------|-----------------|
| Instagram | 2,200 | 5-15 | Casual/visual | Carousel/Reel suggestions |
| Facebook | 63,206 | 0-3 | Conversational | Link preview optimization |
| X/Twitter | 280 (25K long) | 1-3 | Concise/punchy | Auto-thread if exceeds limit |
| LinkedIn | 3,000 | 2-5 | Professional | Article link suggestions |
| TikTok | 2,200 | 3-5 | Casual/trending | Trending format suggestions |
| YouTube | 5,000 (desc) | 5-15 tags | Informative | Title + description + tags |
| Threads | 500 | 0-3 | Conversational | Thread splitting if needed |
| Pinterest | 500 (desc) | 0 (keywords) | Descriptive/SEO | Pin title + board suggestion |
| Bluesky | 300 | 0-3 | Conversational | Alt text for images |
| Mastodon | 500 | 1-5 | Community-aware | Content warning suggestion |

#### US-AI-03: AI Image Generation

**As a** creator, **I want to** generate images from text prompts **so that** I can create visuals without leaving the editor.

**Flow**:
1. User clicks "Generate Image" in the composer.
2. User provides: prompt, style (photographic, illustration, minimalist, meme, abstract), aspect ratio (1:1, 4:5, 9:16, 16:9), mood (bright, dark, professional, playful).
3. AI generates 4 image variants (<15 seconds).
4. Images auto-sized for selected platform(s).
5. User selects an image; it is added to the post and saved to the media library.
6. User can regenerate, crop, or apply basic edits (brightness, text overlay).

**AI Image Credits**: Free: 5/mo, Pro: 30/mo, Team: 100/mo.

#### US-AI-04: Brand Voice Learning

**As a** creator, **I want** the AI to learn my writing style **so that** generated content sounds like me.

**Flow**:
1. User navigates to Settings > Brand Voice.
2. **Manual setup**: User describes their voice in free text and/or selects attribute pairs (Formal/Casual, Serious/Playful, Technical/Simple).
3. **Automatic learning**: Once user has 50+ published posts, system analyzes: sentence length, vocabulary complexity, emoji frequency, hashtag patterns, CTA style, common phrases.
4. Voice profile displayed as a summary: "Your tone is: casual, concise, emoji-light."
5. User can edit the AI's understanding or reset to start fresh.
6. All subsequent AI generation uses the voice profile by default.
7. Multiple profiles supported per workspace (for freelancers managing clients). Free: 1, Pro: 5, Team: 15.

#### US-AI-05: Best Posting Times

**As a** creator, **I want** AI-recommended posting times **so that** I post when my audience is most active.

**Flow**:
1. For new accounts (no data): system shows platform-wide best-practice defaults, labeled as "general."
2. After 2+ weeks of posting data: recommendations blend general + account-specific engagement patterns.
3. Recommendations refresh weekly.
4. When scheduling, recommended time slots are highlighted in green on the calendar.
5. User can view reasoning: "Your audience is most active Tue/Thu 9-11am EST."

---

### 2.3 Content Creation

#### US-CC-01: Create and Edit a Post

**As a** creator, **I want** a distraction-free editor **so that** I can compose posts efficiently.

**Flow**:
1. User clicks "Create Post" from dashboard or calendar.
2. Rich text editor supports: bold, italic, line breaks, emoji picker, @mention suggestions.
3. Media upload: drag-and-drop, paste from clipboard, or file picker. Supports JPEG, PNG, GIF, WebP, MP4, MOV. Multiple media per post (up to platform limits).
4. Character count shown per selected platform with color coding (green/yellow/red).
5. Real-time platform preview shows exactly how the post will appear on each target platform.
6. Auto-save every 30 seconds. Manual "Save as Draft" always available.
7. Undo/redo support (Ctrl+Z / Ctrl+Shift+Z).

#### US-CC-02: Manage Drafts

**As a** creator, **I want to** organize my drafts **so that** I can build a content backlog.

**Flow**:
1. Drafts list shows: title/preview, status (Idea, In Progress, Ready for Review, Approved), last modified, target platforms.
2. Full-text search across all drafts.
3. Filter by: status, platform, date range, author (for teams).
4. Bulk actions: delete, change status, assign to team member.
5. No limit on number of drafts (all tiers).

#### US-CC-03: Use Templates

**As a** creator, **I want** reusable templates **so that** recurring content types are quick to produce.

**Flow**:
1. User saves any draft or published post as a template (one click).
2. Template includes: text content, media placeholders, platform selections, tone/voice settings.
3. Templates support placeholder variables: `{{product_name}}`, `{{date}}` -- prompted when used.
4. User-defined categories (e.g., "Tips," "Promos").
5. 10+ pre-built starter templates included out of the box.
6. Team-shared templates visible to all workspace members.

#### US-CC-04: Media Library

**As a** creator, **I want** a centralized asset library **so that** I can find and reuse media.

**Flow**:
1. All uploaded and AI-generated media auto-added to the library.
2. Organization: user-created folders, manual + AI-suggested tags.
3. Search by: filename, tag, upload date, file type, dimensions.
4. Drag-and-drop from library into the post editor.
5. Bulk upload up to 50 files at once.
6. Storage limits: Free 500MB, Pro 5GB, Team 25GB.

---

### 2.4 Scheduling & Publishing

#### US-SCHED-01: Schedule via Calendar

**As a** creator, **I want** a visual calendar **so that** I can see my entire content pipeline.

**Flow**:
1. Calendar has Day, Week, Month views.
2. Posts displayed as cards: platform icon(s), text preview (first 80 chars), media thumbnail, status badge.
3. Color coding by platform or status (user toggle).
4. AI-recommended time slots shown as highlighted zones.
5. Gaps highlighted: "No posts scheduled for Wednesday."
6. Click any time slot to create a new post. Click existing post to edit, reschedule, or delete.
7. Filter by: platform, status, content category, team member.

#### US-SCHED-02: Drag-and-Drop Rescheduling

**As a** creator, **I want to** drag posts to new time slots **so that** rescheduling is instant.

**Flow**:
1. Drag any scheduled (not yet published) post to a new slot.
2. Ghost card follows cursor; target slot highlights.
3. Drop confirmation shows old time vs new time.
4. Conflict detection warns if same platform has a post within its minimum spacing.
5. Undo via Ctrl+Z or toast notification with "Undo" button (10 seconds).
6. Keyboard alternative: "Move to" action with date/time picker.

#### US-SCHED-03: Queue System

**As a** creator, **I want** a posting queue **so that** content auto-fills the next available slot.

**Flow**:
1. User defines per-platform recurring time slots (e.g., "Instagram Tue/Thu 10am").
2. AI suggests optimal queue slot times.
3. Adding content to the queue assigns it to the next available slot (FIFO).
4. Queue view shows: next 20 upcoming posts, queue depth per platform, "runs dry" warning.
5. Drag-and-drop reordering within queue.
6. Pause/resume queue per platform.

#### US-SCHED-04: Bulk Scheduling via CSV

**As a** creator, **I want to** upload a CSV to schedule many posts at once **so that** I can batch a month of content.

**Flow**:
1. User downloads CSV template from the app.
2. Columns: `content_text`, `platform(s)`, `date`, `time`, `timezone`, `media_url(s)`, `hashtags`, `first_comment`.
3. Upload accepts CSV/TSV (up to 500 rows).
4. Pre-import validation screen shows errors. User fixes in-app before confirming.
5. Optional "AI Enhance" toggle runs platform adaptation on each imported post.
6. Post-import summary: X scheduled, Y errors, Z duplicates.

#### US-SCHED-05: Auto-Publishing

**As a** creator, **I want** posts to publish automatically on time **so that** I do not need to be online.

**Flow**:
1. Scheduler worker scans for posts due within 60 seconds (runs every 30s).
2. Post enqueued to publisher worker.
3. Publisher resolves OAuth token, calls platform API, updates status.
4. Pre-flight checks run 10 minutes before: token validity, media accessibility, content compliance.
5. On success: post marked "Published" with platform post ID and URL.
6. On failure: retry with exponential backoff (30s, 2m, 10m, 30m, 1h). After 5 retries, mark "Failed" and notify user.
7. Partial success (3 of 5 platforms): successful platforms marked "Published," failed ones retried independently.
8. Idempotency guard (distributed lock) prevents double-publishing.

#### US-SCHED-06: Evergreen Recycling

**As a** creator, **I want** high-performing content to auto-republish **so that** I get ongoing value from timeless posts.

**Flow**:
1. User marks any published/scheduled post as "Evergreen."
2. Configures: recurrence interval (N days/weeks/months), start/end date or indefinite.
3. AI variation toggle: each republish gets minor AI variations (different hashtags, reworded CTA, alternative emoji).
4. Evergreen posts appear on calendar with distinct visual treatment.
5. If engagement drops below threshold over 3+ cycles, system suggests retiring it.
6. Limits: Free 10, Pro/Team unlimited.

---

### 2.5 Team Collaboration

#### US-TEAM-01: Invite Team Members

**As a** workspace owner, **I want to** invite team members with specific roles **so that** everyone has appropriate access.

**Flow**:
1. Owner navigates to Settings > Team.
2. Enters email address and selects role (Admin, Editor, Viewer).
3. Invitation email sent. If recipient has no account, email includes signup link.
4. On accept, member joins the workspace with assigned role.

**Role Permissions**:

| Permission | Owner | Admin | Editor | Viewer |
|-----------|-------|-------|--------|--------|
| Create/edit content | Yes | Yes | Yes | No |
| Publish/schedule | Yes | Yes | Yes | No |
| Approve content | Yes | Yes | If designated | No |
| View calendar & analytics | Yes | Yes | Yes | Yes |
| Manage team members | Yes | Yes | No | No |
| Manage billing | Yes | No | No | No |
| Connect/disconnect platforms | Yes | Yes | No | No |
| Reply from inbox | Yes | Yes | Yes | No |
| Export reports | Yes | Yes | Yes | Yes |

#### US-TEAM-02: Content Approval Workflow

**As a** team admin, **I want** a content approval process **so that** no unapproved content goes live.

**Flow**:
1. Approval workflow toggled on/off at workspace level (off by default).
2. When enabled, status flow: Draft -> In Review -> Approved / Changes Requested -> Scheduled.
3. Editor clicks "Submit for Review." Approver receives in-app + email notification.
4. Approver can: Approve (moves to Approved), Request Changes (back to Draft with comment), or Edit directly.
5. Approved posts can be scheduled by anyone with Editor+ role.
6. Posts cannot bypass approval (hard block on scheduling unapproved content).
7. Bulk approval supported from a review queue.

#### US-TEAM-03: Internal Comments

**As a** team member, **I want to** leave comments on posts **so that** feedback is in context.

**Flow**:
1. Comment thread on every post (any status).
2. Supports text, @mentions (triggers notification), emoji reactions.
3. Threaded replies (one nesting level).
4. Resolve/unresolve comments.
5. Comments preserved across status changes.

#### US-TEAM-04: Activity Log

**As a** team admin, **I want** a full audit trail **so that** I have accountability.

**Flow**:
1. Chronological log: post created/edited/approved/published/failed, member added/removed, platform connected/disconnected, settings changed.
2. Each entry: timestamp, user, action type, affected entity, details.
3. Filterable by user, action type, date range, entity type. Searchable by keyword.
4. Retention: Free 90 days, Paid 1 year. Exportable as CSV.

---

### 2.6 Analytics

#### US-ANALYTICS-01: Per-Platform Metrics

**As a** creator, **I want** metrics for each platform in one dashboard **so that** I do not need to check each platform natively.

**Flow**:
1. Dashboard shows per-platform cards: followers, reach/impressions, engagement (likes, comments, shares, saves), engagement rate, top posts.
2. Data synced at least every 6 hours.
3. Sparkline trends (7-day, 30-day).
4. Cross-platform comparison: side-by-side metrics for selected platforms.
5. Historical data stored from the date of account connection onward.

#### US-ANALYTICS-02: Post Performance

**As a** creator, **I want** per-post performance data **so that** I know what works.

**Flow**:
1. Per-post metrics: impressions, reach, likes, comments, shares, saves, link clicks, engagement rate.
2. Metrics update at: 1h, 6h, 24h, 48h, 72h post-publish.
3. AI-generated insight: "This post performed 3x your average because of the trending hashtag and question CTA."
4. Comparison to 30-day average.
5. Sort by any metric; filter by date range, platform, category.

#### US-ANALYTICS-03: Content Intelligence

**As a** creator, **I want** AI-powered strategy recommendations **so that** I know what to do next.

**Flow**:
1. Content Intelligence panel in analytics generates 3-5 actionable recommendations per month.
2. Each includes: the insight, supporting data, and a specific action.
3. Examples: "Your LinkedIn question posts get 2.3x more comments. Consider asking more questions." / "Posts with 7+ hashtags on Instagram outperform those with 3 by 40%."
4. User marks recommendations: "Will try," "Already doing this," or "Not relevant."
5. Recommendations improve based on feedback and new data.

#### US-ANALYTICS-04: Exportable Reports

**As a** team member, **I want** professional reports **so that** I can share results with clients.

**Flow**:
1. Report builder: select date range, platforms, metrics, chart types.
2. Export as PDF (styled with logo if uploaded) or CSV (raw data).
3. PDF includes: cover page, AI-generated executive summary (3-5 sentences), per-platform metrics, top posts, growth charts.
4. Shareable view-only link (no login needed).
5. Scheduled auto-reports: weekly or monthly via email.
6. White-labeled (user logo replaces SocialSpark branding) on Team tier.

---

### 2.7 Unified Inbox

#### US-INBOX-01: View Aggregated Engagement

**As a** creator, **I want** all comments, mentions, and replies in one inbox **so that** I never miss engagement.

**Flow**:
1. Inbox aggregates: comments on posts published via SocialSpark, @mentions/tags, direct replies.
2. Per-item: platform icon, author name/avatar, content text, timestamp, link to original post.
3. New items appear within 15 minutes of being posted on the platform.
4. Filter by: platform, read/unread, resolved/unresolved, date range.
5. Search by keyword or author name.
6. Unread count badge on inbox navigation icon.

**Platform Inbox Support**:

| Platform | Comments | Mentions | Replies |
|----------|----------|----------|---------|
| Instagram | Yes | Yes | Yes |
| Facebook | Yes | Yes | Yes |
| X/Twitter | Yes | Yes | Yes |
| LinkedIn (Pages) | Yes | Yes | Yes |
| TikTok | Yes | Limited | Yes |
| YouTube | Yes | Yes | Yes |
| Threads | Limited* | Limited* | Limited* |
| Pinterest | Limited | N/A | N/A |
| Bluesky | Yes* | Yes* | Yes* |
| Mastodon | Yes* | Yes* | Yes* |

*Subject to API availability.

#### US-INBOX-02: Reply from Inbox

**As a** creator, **I want to** reply directly from the inbox **so that** I do not context-switch to native apps.

**Flow**:
1. Reply text field on each inbox item.
2. Reply posted to original platform as the connected account.
3. Confirmation: "Reply posted to [platform]" with link.
4. AI-suggested replies: 3 options (friendly, professional, brief).
5. Reply character limit shown per platform.
6. Free tier: view only (no reply). Pro/Team: full reply.

#### US-INBOX-03: Manage Inbox State

**As a** creator, **I want** read/resolved states **so that** I can achieve inbox zero.

**Flow**:
1. Each item: Unread (default), Read, Resolved.
2. Bulk actions: mark selected as read, mark selected as resolved.
3. Resolved items move to "Resolved" tab.
4. If a team member resolves an item, shows who and when.
5. Optional auto-resolve after reply is sent.

---

## 3. Data Model

### 3.1 Entity Relationship Overview

```
┌──────────┐     1:N      ┌──────────────┐     N:1     ┌──────────┐
│  User    │─────────────▶│ TeamMember   │◀────────────│  Team    │
│ (Better  │              │              │              │          │
│  Auth)   │              │ role, joined │              │ plan,    │
└──────────┘              └──────────────┘              │ billing  │
     │                                                   └──────────┘
     │ 1:N                                                    │
     ▼                                                        │ 1:N
┌──────────────┐                                              ▼
│ BrandVoice   │                                   ┌──────────────────┐
│ Profile      │                                   │ PlatformAccount  │
└──────────────┘                                   │                  │
                                                   │ platform, tokens,│
┌──────────┐     1:N     ┌────────────────┐        │ profile info     │
│  Team    │────────────▶│     Post       │        └────────┬─────────┘
└──────────┘             │                │                 │
                         │ content,status,│     1:N         │
                         │ scheduled_at   │◀────────────────┘
                         └───────┬────────┘        (via PostPlatform)
                           │          │
                      1:N  │          │ M:N
                           ▼          ▼
                  ┌────────────┐  ┌───────────┐     ┌────────────────┐
                  │PostPlatform│  │ PostMedia  │────▶│     Media      │
                  │            │  │ (junction) │     │                │
                  │ adapted    │  └───────────┘     │ file, storage, │
                  │ content,   │                     │ alt_text       │
                  │ pub status │                     └────────────────┘
                  └─────┬──────┘
                        │ 1:1
                        ▼
                  ┌────────────────┐
                  │ PostAnalytics  │
                  │                │
                  │ impressions,   │
                  │ engagement,    │
                  │ reach          │
                  └────────────────┘

┌──────────────────────────────────────────────────────┐
│  Supporting Entities                                  │
│                                                       │
│  InboxMessage    AccountAnalyticsDaily                │
│  PostComment     ActivityLog                          │
│  Template        QueueSlot                            │
│  BrandVoiceProfile                                    │
└──────────────────────────────────────────────────────┘
```

### 3.2 Key Entities

#### User (managed by Better Auth)
- `id` (TEXT PK), `name`, `email`, `email_verified`, `image`, `created_at`, `updated_at`
- Extended with: `timezone` (IANA), `onboarding_completed` (BOOLEAN)
- Related Better Auth tables: `session`, `account` (OAuth providers), `verification`

#### Team
- `id` (TEXT PK), `name`, `slug` (UNIQUE), `plan` (free/pro/team)
- `stripe_customer_id`, `stripe_subscription_id`
- `ai_credits_used` (INT), `ai_credits_limit` (INT)
- `settings` (JSONB): approval_workflow_enabled, default_timezone, brand_colors
- `created_at`, `updated_at`

#### TeamMember
- `id` (TEXT PK), `team_id` (FK), `user_id` (FK)
- `role` (owner/admin/editor/viewer), `invited_by` (FK), `joined_at`
- UNIQUE constraint on (team_id, user_id)

#### PlatformAccount
- `id` (TEXT PK), `team_id` (FK), `platform` (TEXT: x, linkedin, instagram, facebook, tiktok, youtube, threads, pinterest, bluesky, mastodon)
- `platform_user_id`, `platform_username`, `platform_name`, `platform_avatar_url`
- `access_token_enc` (AES-256-GCM encrypted), `refresh_token_enc` (nullable)
- `token_expires_at` (TIMESTAMPTZ), `scopes` (TEXT[])
- `metadata` (JSONB): platform-specific fields (e.g., Facebook page_id, Mastodon instance_url)
- `is_active` (BOOLEAN), `last_synced_at`
- UNIQUE on (team_id, platform, platform_user_id)

#### Post
- `id` (TEXT PK), `team_id` (FK), `created_by` (FK to User)
- `content` (TEXT), `content_html` (TEXT for editor state)
- `status`: draft | pending_approval | changes_requested | approved | scheduled | publishing | published | partially_published | failed
- `scheduled_at` (TIMESTAMPTZ, nullable), `published_at` (TIMESTAMPTZ)
- `approved_by` (FK), `approved_at`, `approval_note`
- `ai_generated` (BOOLEAN), `ai_prompt`, `ai_model`
- `is_evergreen` (BOOLEAN), `evergreen_interval`, `evergreen_next_at`
- `tags` (TEXT[]), `metadata` (JSONB)
- Key indexes: (team_id, status), (scheduled_at WHERE status='scheduled'), (created_by)

#### PostPlatform
- `id` (TEXT PK), `post_id` (FK), `platform_account_id` (FK)
- `content` (TEXT -- platform-adapted), `hashtags` (TEXT[])
- `status`: pending | publishing | published | failed | retry_scheduled
- `platform_post_id` (TEXT), `platform_post_url` (TEXT)
- `error_message`, `retry_count` (INT, default 0), `max_retries` (INT, default 5), `last_retry_at`
- `metadata` (JSONB): first_comment, alt_text, board_id (Pinterest), content_warning (Mastodon)
- `published_at`

#### Media
- `id` (TEXT PK), `team_id` (FK), `uploaded_by` (FK)
- `file_name`, `file_size` (INT bytes), `mime_type`, `width`, `height`, `duration` (seconds, video)
- `storage_key` (R2 object key), `storage_url` (CDN URL), `thumbnail_key`, `thumbnail_url`
- `alt_text`, `ai_alt_text`, `tags` (TEXT[])
- `processing_status`: uploaded | processing | ready | failed

#### PostMedia (junction)
- `post_id` (FK), `media_id` (FK), `position` (INT)
- UNIQUE on (post_id, media_id)

#### PostAnalytics
- `id` (TEXT PK), `post_platform_id` (FK to PostPlatform, UNIQUE)
- `impressions`, `reach`, `likes`, `comments`, `shares`, `saves`, `clicks`, `video_views` (all nullable INT)
- `engagement_rate` (DECIMAL(5,2))
- `raw_data` (JSONB), `synced_at`

#### AccountAnalyticsDaily
- `platform_account_id` (FK), `date` (DATE)
- `followers`, `following`, `posts_count`, `total_reach`, `total_impressions`, `total_engagement`
- UNIQUE on (platform_account_id, date)

#### InboxMessage
- `id` (TEXT PK), `team_id` (FK), `platform_account_id` (FK)
- `type`: comment | mention | reply
- `author_name`, `author_avatar_url`, `author_platform_id`
- `content` (TEXT), `platform_message_id`, `platform_post_id`
- `parent_message_id` (FK, self-referential for threads)
- `status`: unread | read | resolved
- `resolved_by` (FK), `resolved_at`, `synced_at`

#### PostComment (internal team collaboration)
- `id` (TEXT PK), `post_id` (FK), `author_id` (FK to User)
- `content` (TEXT), `parent_comment_id` (FK, self-referential)
- `is_resolved` (BOOLEAN), `resolved_by` (FK)
- `created_at`

#### Template
- `id` (TEXT PK), `team_id` (FK), `created_by` (FK)
- `name`, `category`, `content`, `platform_selections` (TEXT[]), `tone`, `variables` (JSONB)
- `use_count` (INT), `created_at`

#### QueueSlot
- `id` (TEXT PK), `team_id` (FK), `platform_account_id` (FK)
- `day_of_week` (INT 0-6), `time` (TIME), `is_active` (BOOLEAN)

#### BrandVoiceProfile
- `id` (TEXT PK), `team_id` (FK)
- `name`, `description` (TEXT)
- `attributes` (JSONB): formality, humor, vocabulary_complexity, emoji_frequency
- `learned_data` (JSONB): sentence_length_avg, common_phrases, cta_patterns
- `is_default` (BOOLEAN)

#### ActivityLog
- `id` (TEXT PK), `team_id` (FK), `user_id` (FK)
- `action` (TEXT), `entity_type` (TEXT), `entity_id` (TEXT)
- `details` (JSONB), `ip_address` (TEXT, redacted in application logs)
- `created_at`

---

## 4. API Design

All endpoints are prefixed with `/api/v1`. Authentication via JWT access token in the `Authorization: Bearer` header. All timestamps in ISO 8601 UTC. Responses follow a consistent envelope:

```json
{
  "data": { },
  "meta": { "page": 1, "per_page": 20, "total": 150 },
  "error": null
}
```

Error responses:

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Content exceeds platform character limit",
    "details": { "platform": "x", "max": 280, "actual": 312 }
  }
}
```

### 4.1 Auth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Create account (email/password) |
| POST | `/auth/login` | Login (email/password) |
| POST | `/auth/magic-link` | Send magic link email |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Revoke session |
| POST | `/auth/forgot-password` | Send password reset email |
| POST | `/auth/reset-password` | Reset password with token |
| GET | `/auth/oauth/{provider}` | Initiate OAuth (google, apple, github) |
| GET | `/auth/oauth/{provider}/callback` | OAuth callback |

### 4.2 Team Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/teams/:teamId` | Get team details |
| PATCH | `/teams/:teamId` | Update team settings |
| GET | `/teams/:teamId/members` | List team members |
| POST | `/teams/:teamId/members/invite` | Invite member by email |
| PATCH | `/teams/:teamId/members/:memberId` | Update member role |
| DELETE | `/teams/:teamId/members/:memberId` | Remove member |

### 4.3 Platform Account Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/teams/:teamId/platforms` | List connected platforms |
| GET | `/teams/:teamId/platforms/:platformId` | Get platform details and health |
| POST | `/teams/:teamId/platforms/connect/:platform` | Initiate OAuth for platform |
| GET | `/teams/:teamId/platforms/callback/:platform` | OAuth callback for platform |
| DELETE | `/teams/:teamId/platforms/:platformId` | Disconnect platform |
| POST | `/teams/:teamId/platforms/:platformId/refresh` | Force token refresh |

### 4.4 Post Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/teams/:teamId/posts` | List posts (filterable by status, platform, date, author) |
| POST | `/teams/:teamId/posts` | Create post (draft) |
| GET | `/teams/:teamId/posts/:postId` | Get post with platform versions |
| PATCH | `/teams/:teamId/posts/:postId` | Update post content/metadata |
| DELETE | `/teams/:teamId/posts/:postId` | Delete post |
| POST | `/teams/:teamId/posts/:postId/schedule` | Schedule post at specified time |
| POST | `/teams/:teamId/posts/:postId/publish-now` | Publish immediately |
| POST | `/teams/:teamId/posts/:postId/submit-review` | Submit for approval |
| POST | `/teams/:teamId/posts/:postId/approve` | Approve post |
| POST | `/teams/:teamId/posts/:postId/request-changes` | Request changes with comment |
| POST | `/teams/:teamId/posts/:postId/retry` | Retry failed post |
| POST | `/teams/:teamId/posts/:postId/adapt` | AI-adapt content for all platforms |
| POST | `/teams/:teamId/posts/:postId/evergreen` | Toggle evergreen with settings |
| GET | `/teams/:teamId/posts/calendar` | Get posts for calendar view (date range param) |

### 4.5 AI Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/teams/:teamId/ai/generate` | Generate content from prompt (streaming) |
| POST | `/teams/:teamId/ai/adapt` | Adapt content for specific platforms (streaming) |
| POST | `/teams/:teamId/ai/image` | Generate images from prompt |
| POST | `/teams/:teamId/ai/suggest-hashtags` | Suggest hashtags for content |
| POST | `/teams/:teamId/ai/suggest-times` | Get best posting time recommendations |
| POST | `/teams/:teamId/ai/suggest-reply` | Generate reply suggestions for inbox item |
| GET | `/teams/:teamId/ai/usage` | Get AI credit usage for current billing period |

### 4.6 Scheduling & Queue Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/teams/:teamId/queue` | Get queue contents per platform |
| POST | `/teams/:teamId/queue/add` | Add post to queue |
| PATCH | `/teams/:teamId/queue/reorder` | Reorder queue items |
| POST | `/teams/:teamId/queue/pause/:platformId` | Pause queue for platform |
| POST | `/teams/:teamId/queue/resume/:platformId` | Resume queue for platform |
| GET | `/teams/:teamId/queue/slots` | Get configured queue slots |
| POST | `/teams/:teamId/queue/slots` | Create/update queue slots |
| DELETE | `/teams/:teamId/queue/slots/:slotId` | Delete queue slot |
| POST | `/teams/:teamId/bulk-schedule` | Upload CSV for bulk scheduling |

### 4.7 Analytics Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/teams/:teamId/analytics/overview` | Dashboard overview (all platforms) |
| GET | `/teams/:teamId/analytics/platforms/:platformId` | Per-platform metrics |
| GET | `/teams/:teamId/analytics/posts/:postId` | Per-post performance |
| GET | `/teams/:teamId/analytics/top-posts` | Top performing posts (configurable period) |
| GET | `/teams/:teamId/analytics/growth` | Follower and engagement growth trends |
| GET | `/teams/:teamId/analytics/intelligence` | AI content recommendations |
| POST | `/teams/:teamId/analytics/reports` | Generate report (returns PDF/CSV) |
| GET | `/teams/:teamId/analytics/reports/:reportId` | Download generated report |
| POST | `/teams/:teamId/analytics/reports/schedule` | Schedule recurring report |

### 4.8 Inbox Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/teams/:teamId/inbox` | List inbox items (filterable) |
| GET | `/teams/:teamId/inbox/:messageId` | Get message with thread context |
| PATCH | `/teams/:teamId/inbox/:messageId` | Update status (read/resolved) |
| POST | `/teams/:teamId/inbox/:messageId/reply` | Reply to message |
| POST | `/teams/:teamId/inbox/bulk` | Bulk mark as read/resolved |
| GET | `/teams/:teamId/inbox/unread-count` | Get unread count (for badge) |

### 4.9 Media Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/teams/:teamId/media` | List media (filterable by type, tags, date) |
| POST | `/teams/:teamId/media/upload-url` | Get presigned upload URL for direct R2 upload |
| POST | `/teams/:teamId/media` | Register uploaded media (after R2 upload completes) |
| PATCH | `/teams/:teamId/media/:mediaId` | Update metadata (alt text, tags, folders) |
| DELETE | `/teams/:teamId/media/:mediaId` | Delete media |
| GET | `/teams/:teamId/media/usage` | Get storage usage |

### 4.10 Template & Brand Voice Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/teams/:teamId/templates` | List templates |
| POST | `/teams/:teamId/templates` | Create template |
| PATCH | `/teams/:teamId/templates/:templateId` | Update template |
| DELETE | `/teams/:teamId/templates/:templateId` | Delete template |
| GET | `/teams/:teamId/brand-voices` | List brand voice profiles |
| POST | `/teams/:teamId/brand-voices` | Create brand voice profile |
| PATCH | `/teams/:teamId/brand-voices/:voiceId` | Update profile |
| DELETE | `/teams/:teamId/brand-voices/:voiceId` | Delete profile |
| POST | `/teams/:teamId/brand-voices/:voiceId/analyze` | Trigger voice learning from published posts |

### 4.11 Activity Log Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/teams/:teamId/activity` | List activity log (filterable by user, action, date) |

---

## 5. Platform Integration Details

### 5.1 Instagram (via Meta Graph API)

| Aspect | Detail |
|--------|--------|
| **Auth** | OAuth 2.0 via Meta Business SDK. Requires Business/Creator account linked to Facebook Page. |
| **API** | Meta Graph API v19+ |
| **Publishing** | Two-step: `POST /{ig-user-id}/media` (create container) then `POST /{ig-user-id}/media_publish`. Supports single image, carousel (up to 10), Reel. |
| **Limits** | Caption: 2,200 chars. Hashtags: 30 max. Media: JPEG/PNG images, MP4 video (60s feed, 90s Reels). |
| **Analytics** | Impressions, reach, engagement, saves, profile visits, follower count/demographics. |
| **Inbox** | Comments, @mentions. DMs require approved app (post-MVP). |
| **Rate Limits** | 200 calls/user/hour. Publishing: 25 posts/day. |
| **Special** | First comment for hashtags via `POST /{media-id}/comments`. Carousel requires child containers. |
| **Token** | Short-lived: 1h. Long-lived: 60 days. Refresh by exchange before expiry. |
| **Risk** | Low. Requires Meta App Review for production. |

### 5.2 Facebook Pages (via Meta Graph API)

| Aspect | Detail |
|--------|--------|
| **Auth** | OAuth 2.0 via Meta. Permissions: `pages_manage_posts`, `pages_read_engagement`. |
| **API** | Meta Graph API v19+ (same infrastructure as Instagram). |
| **Publishing** | `POST /{page-id}/feed` (text/link), `/{page-id}/photos` (images), `/{page-id}/videos`. |
| **Limits** | 63,206 chars. Link posts auto-generate preview cards. |
| **Analytics** | Page impressions, reach, engagement, page likes, post-level metrics. |
| **Inbox** | Page post comments, page @mentions. |
| **Rate Limits** | 200 calls/user/hour (shared with Instagram). 4,800 calls/app/24h per page. |
| **Special** | Page Access Token (distinct from User Access Token). Long-lived page tokens do not expire. |
| **Risk** | Low. Mature API. |

### 5.3 X / Twitter (v2 API)

| Aspect | Detail |
|--------|--------|
| **Auth** | OAuth 2.0 with PKCE. Basic tier ($100/mo) or higher required for write access. |
| **API** | X API v2 (`api.x.com/2/`). |
| **Publishing** | `POST /tweets`. Media uploaded separately via chunked upload. |
| **Limits** | 280 chars (standard), 25K (Premium long posts). Up to 4 images, 1 video, or 1 GIF per tweet. |
| **Analytics** | Impressions, likes, retweets, replies, quotes, bookmarks. No demographics on Basic tier. |
| **Inbox** | Replies, @mentions, quote tweets. DMs not on Basic tier. |
| **Rate Limits** | Basic: 10K reads/mo, 500 writes/mo. 200 tweets/15min per app. |
| **Special** | Auto-threading: split >280 char content via `reply.in_reply_to_tweet_id`. Chunked upload for large media. |
| **Token** | Access: 2 hours. Refresh: 6 months. |
| **Risk** | Medium. API pricing unstable. $100/mo base cost. Monitor for changes. |

### 5.4 LinkedIn (Marketing API)

| Aspect | Detail |
|--------|--------|
| **Auth** | OAuth 2.0. Marketing Developer Platform for company pages. Community Management API for personal. |
| **API** | LinkedIn REST API v2. |
| **Publishing** | `POST /posts`. Images/videos registered first via `POST /images` or `POST /videos`, then referenced by URN. |
| **Limits** | 3,000 chars. Up to 20 images in carousel. Video: 10 min, 5GB. |
| **Analytics** | Impressions, clicks, engagement rate, reaction breakdown, comments, shares, followers. Company page demographics. |
| **Inbox** | Company page comments, mentions. |
| **Rate Limits** | 100 requests/day for posting. 100K/day for reading. |
| **Special** | Separate flows for personal vs company pages. Company page requires `ORGANIZATION_ADMIN` role. Rich media referenced by URN. |
| **Token** | Access: 60 days. Refresh: 365 days. |
| **Risk** | Low. Marketing Developer Platform approval takes 2-4 weeks. |

### 5.5 TikTok (Content Posting API)

| Aspect | Detail |
|--------|--------|
| **Auth** | OAuth 2.0 via TikTok Login Kit. |
| **API** | TikTok Content Posting API v2. |
| **Publishing** | `POST /post/publish/video/init/` then upload. Two modes: `direct_post` (auto-publish) and `upload_to_inbox` (user reviews in TikTok app). |
| **Limits** | Caption: 2,200 chars. Video: MP4/WebM, 3s-10min, up to 4GB. Photos: up to 35 per post. |
| **Analytics** | Views, likes, comments, shares, avg watch time (via Business API). Limited on basic access. |
| **Inbox** | Video comments. Limited mention API. |
| **Rate Limits** | ~10 posts/day per user. Rate headers in response. |
| **Special** | `direct_post` requires extra TikTok review. Falls back to `upload_to_inbox`. Privacy level must be set. |
| **Token** | Access: 24 hours. Refresh: 365 days. |
| **Risk** | Medium. API maturing. `direct_post` approval can be slow. |

### 5.6 YouTube (Data API v3)

| Aspect | Detail |
|--------|--------|
| **Auth** | OAuth 2.0 via Google Cloud. YouTube Data API v3 must be enabled. |
| **API** | YouTube Data API v3. |
| **Publishing** | `POST /videos?uploadType=resumable`. Supports resumable upload for large files. |
| **Limits** | Title: 100 chars. Description: 5,000 chars. Tags: 500 chars total. Video: up to 256GB or 12 hours. |
| **Analytics** | Views, watch time, likes, comments, shares, subscribers, demographics, traffic sources (Analytics API). |
| **Inbox** | Video comments, comment threads. |
| **Rate Limits** | Quota-based: 10K units/day default. Video upload ~1,600 units. Request increase for higher usage. |
| **Special** | Resumable upload (handles interruption). Thumbnail uploaded separately. Videos can be uploaded unlisted then made public at scheduled time via `status.publishAt`. |
| **Token** | Access: 1 hour. Refresh: long-lived (until revoked). |
| **Risk** | Low. Mature API. Quota management required. |

### 5.7 Threads (Meta Threads API)

| Aspect | Detail |
|--------|--------|
| **Auth** | OAuth 2.0 via Meta (shared with Instagram). Requires Instagram Business/Creator account. |
| **API** | Threads API (`graph.threads.net/v1.0/`). |
| **Publishing** | Two-step (same as Instagram): create container then publish. Supports text, image, carousel (up to 10), video. |
| **Limits** | 500 chars. Up to 10 images. Video up to 5 minutes. |
| **Analytics** | Views, likes, replies, reposts, quotes, followers (Threads Insights API). Limited vs Instagram. |
| **Inbox** | Thread replies. Limited mention support. |
| **Rate Limits** | 250 calls/user/hour. 250 posts/24h. |
| **Special** | Thread splitting for >500 chars. Shares auth flow with Instagram. Two-step publish process. |
| **Token** | Same as Instagram (short: 1h, long: 60 days). |
| **Risk** | High. API launched 2024, still evolving. Feature coverage incomplete. |

### 5.8 Pinterest (API v5)

| Aspect | Detail |
|--------|--------|
| **Auth** | OAuth 2.0. Requires Pinterest Business account. |
| **API** | Pinterest API v5. |
| **Publishing** | `POST /pins` with title, description, link, media_source, board_id. Board selection required. |
| **Limits** | Title: 100 chars. Description: 500 chars. No hashtags (use keywords). Image: 1000x1500 recommended. Video: 4s-15min. |
| **Analytics** | Impressions, saves, pin clicks, outbound clicks. Board and account metrics. |
| **Inbox** | Pin comments (limited). No mention system. |
| **Rate Limits** | 1,000 requests/day per user. Pin creation: 50/hour. |
| **Special** | Board required for every pin. Rich pins (product, article, recipe). Alt text important for SEO. |
| **Token** | Access: 1 day. Refresh: 365 days. |
| **Risk** | Low. Stable API. |

### 5.9 Bluesky (AT Protocol)

| Aspect | Detail |
|--------|--------|
| **Auth** | AT Protocol auth via App Password or OAuth (when available). User provides handle + app password. |
| **API** | AT Protocol XRPC (`bsky.social/xrpc/`). |
| **Publishing** | `com.atproto.repo.createRecord` with `app.bsky.feed.post` record. Images via `com.atproto.repo.uploadBlob` first. |
| **Limits** | 300 grapheme chars. Up to 4 images. No native video yet (evolving). |
| **Analytics** | Like/repost/reply count per post. No impressions/reach. Calculated locally. |
| **Inbox** | Replies, mentions via `app.bsky.notification.listNotifications`. |
| **Rate Limits** | 5,000 points/hour. Post creation ~3 points. Blob upload ~5 points. |
| **Special** | Facets (rich text) require byte-offset computation for links, mentions, hashtags. External embeds (link cards) via `app.bsky.embed.external` with manually fetched metadata. Uses grapheme clusters for counting. |
| **Token** | Session: 2 hours. Refresh: 90 days. |
| **Risk** | High. Protocol evolving. OAuth rollout ongoing. App password is transitional. |

### 5.10 Mastodon (Mastodon REST API)

| Aspect | Detail |
|--------|--------|
| **Auth** | OAuth 2.0. Instance-specific: user provides instance URL, app registers with that instance. |
| **API** | Mastodon API v1 (`{instance}/api/v1/`). |
| **Publishing** | `POST /statuses` with text, optional media_ids, visibility (public/unlisted/private/direct), spoiler_text (content warning). Media via `POST /v2/media`. |
| **Limits** | 500 chars (default; varies by instance, up to 5000). Up to 4 images or 1 video (~40MB). |
| **Analytics** | Favourites, boosts, replies per post. Follower/following counts. No impressions (decentralized). |
| **Inbox** | Notifications: mentions, favourites, boosts, follows via `GET /notifications`. |
| **Rate Limits** | 300 requests/5 minutes (varies by instance). |
| **Special** | Instance-dependent character limits and file sizes. Discover via `GET /api/v2/instance`. Content warnings are cultural norm. Visibility levels matter. Polls supported. |
| **Token** | Access token does not expire (until revoked). No refresh needed. |
| **Risk** | Medium. API stable but instance-dependent. Must handle varied configurations. |

---

## 6. Error Handling & Edge Cases

### 6.1 Publishing Failures

| Scenario | Detection | Response |
|----------|-----------|----------|
| Platform API 5xx | HTTP status | Retry with backoff (30s, 2m, 10m, 30m, 1h). Max 5 retries. |
| Platform API 429 (rate limit) | HTTP 429 + Retry-After | Queue retry after Retry-After. Do not count against retry limit. |
| Platform API 401 (token expired) | HTTP 401 | Auto-refresh token. If refresh succeeds, retry immediately. If fails, pause platform, notify user. |
| Platform API 400 (content invalid) | HTTP 400 | Do NOT retry. Mark "Failed" with actionable error (e.g., "Image aspect ratio unsupported"). |
| Network timeout (>30s) | No response | Treat as transient. Retry with backoff. |
| Partial multi-platform publish | Some succeed, some fail | Mark successes as "Published." Retry only failures. Show "Partially Published." |
| Double-publish prevention | Distributed lock on post_platform_id | If lock exists, skip. If platform_post_id already set, skip and log warning. |
| Scheduled time >1 hour in the past | Scheduler detects | Mark as "Missed." Notify user. Do not auto-publish stale content. |
| Platform account disconnected | Pre-flight check 10 min before | Notify user. Hold post. If still disconnected at publish time, mark "Failed." |

### 6.2 OAuth & Token Edge Cases

| Scenario | Response |
|----------|----------|
| Token refresh fails 3 times | Mark connection "Expired." Pause scheduled posts for that platform. Send email + in-app notification with re-auth link. |
| User revokes access on platform | Next API call returns 401. Same as token expiry flow. |
| OAuth callback with error | User-friendly error: "Facebook denied access. Please try again and ensure you grant all requested permissions." Retry button. |
| Duplicate platform connection attempt | UNIQUE constraint on (team_id, platform, platform_user_id). Update existing tokens instead of creating duplicate. |
| Mastodon instance goes offline | Mark "Instance Unavailable." Retry health check every 30 min. |
| Bluesky app password changed | Auth fails. Prompt user to update app password in settings. |

### 6.3 AI Generation Edge Cases

| Scenario | Response |
|----------|----------|
| AI provider down | Return cached results if identical prompt used within 1 hour. Otherwise: "AI temporarily unavailable. Write manually or try again soon." |
| Generation exceeds 30s timeout | Return partial results if streaming. Otherwise: "Generation took too long. Try shorter prompt or retry." |
| AI credits exhausted | Block with: "You've used all 20 AI generations this month. Upgrade to Pro for 100/month." Upgrade CTA. |
| Inappropriate content generated | Safety filter on output. Replace with: "AI generated content that didn't meet safety guidelines. Rephrase your prompt." |
| Adapted content exceeds platform limit | Auto-truncate and warn: "Content trimmed to fit X's 280-character limit. Please review." |
| Prompt injection | User input sanitized. System prompts constrain behavior. User content wrapped in delimiters. |

### 6.4 Content & Editor Edge Cases

| Scenario | Response |
|----------|----------|
| Two tabs editing same post | Last-write-wins with optimistic locking (updated_at check). Conflict: "This post was edited in another tab. Reload?" |
| Media upload fails mid-upload | Resumable upload. Client retries from last chunk. After 3 retries, show error with retry button. |
| Media exceeds platform limit | Auto-compress images. For videos exceeding limits: "This video exceeds TikTok's 4GB limit. Compress or trim." |
| Unsupported media format | MIME type check on upload. Reject: "MP4 and MOV video formats supported. .avi cannot be used." |
| Post references deleted media | Pre-flight check. Mark "Needs Attention" and notify user. |
| Template references disconnected platform | Warn on use: "LinkedIn not connected. Remove from post or reconnect." |

### 6.5 Team & Collaboration Edge Cases

| Scenario | Response |
|----------|----------|
| Last owner leaves | Block: "You are the only owner. Transfer ownership before leaving." |
| Invited user has existing account | Link invite to existing account: "You've been invited to [Team]. Accept?" |
| Editor schedules unapproved post (workflow on) | Hard block: "This post requires approval. Submit for review." |
| Approver edits post directly | Implies approval. Move to "Approved." Log the action. |
| Member removed with pending posts | Posts remain, unassigned. Admin notified: "3 posts by [member] need a new owner." |
| Plan downgrade exceeds limits | Block: "Pro allows 1 member. Remove 2 before downgrading." Or 7-day grace period. |

### 6.6 Analytics & Inbox Edge Cases

| Scenario | Response |
|----------|----------|
| Platform provides no analytics | Show "Not available" for that metric. Show what is available. Bluesky/Mastodon: like/repost/reply only. |
| Analytics sync fails 3x consecutively | Alert: "Instagram analytics haven't updated in 24 hours. May be a temporary platform issue." |
| Inbox message on deleted post | Show message with: "Original post no longer available." Reply still possible if platform supports it. |
| Inbox reply fails | Error inline: "Reply failed: [reason]. Tap to retry." Preserve reply text. |
| 1000+ unread inbox items | Paginate. Newest first. Bulk actions. Auto-archive items older than 30 days. |
| Rate limit during inbox sync | Back off. Prioritize platforms with most recent activity. Show "Some platforms may have delayed messages." |

### 6.7 Billing & Plan Edge Cases

| Scenario | Response |
|----------|----------|
| Payment fails | 3-day grace period. Email day 1 and 3. After grace, downgrade to Free. Scheduled posts paused. Data retained 30 days. |
| User exceeds plan limits | Soft limit: warn at 80% and 100%. Hard limit: block action with upgrade CTA. Never delete data due to overage. |
| Stripe webhook missed | Reconciliation job daily. Compare Stripe state with local plan. Correct drift. |
| Timezone change | Display in new timezone. UTC publish times unchanged. Notice: "Timezone updated. Posts publish at same absolute times." |

---

*This document is a living specification. It evolves as technical feasibility is validated and user feedback is gathered. Review against [MVP Features](./MVP_FEATURES.md) and [Technical Approach](./TECHNICAL_APPROACH.md) for consistency.*

**Last updated**: February 12, 2026
