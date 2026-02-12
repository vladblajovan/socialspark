# SocialSpark MVP Feature Specification

**Version**: 1.0
**Date**: February 12, 2026
**Status**: Draft
**Author**: Product & Engineering
**Based on**: Market research of 21+ competitors, 136+ sources (see `/MARKET_RESEARCH_REPORT.md`, `/STRATEGIC_INSIGHTS.md`)

---

## Table of Contents

1. [Product Vision & Positioning](#1-product-vision--positioning)
2. [Core Features (Must-Have for MVP)](#2-core-features-must-have-for-mvp)
3. [Differentiating Features](#3-differentiating-features-what-makes-socialspark-unique)
4. [Features Deferred to Post-MVP](#4-features-deferred-to-post-mvp-v2)
5. [Pricing Strategy](#5-pricing-strategy)
6. [Appendix: Technical Constraints & Dev Approach](#appendix-technical-constraints--dev-approach)

---

## 1. Product Vision & Positioning

### Tagline

> **"Write once. Publish everywhere. Optimized by AI."**

### Mission Statement

SocialSpark exists to give creators and small teams a single place to create, adapt, schedule, and analyze social content across every major platform -- powered by AI that learns their voice and handles the tedious platform-by-platform optimization so they can focus on ideas, not logistics.

### Positioning Statement

**For** content creators and small teams (2-10 people) **who** manage multiple social media accounts and are frustrated by the manual work of adapting content for each platform, **SocialSpark** is an AI-native social media platform **that** generates, auto-adapts, schedules, and analyzes content across 10+ platforms from a single draft. **Unlike** Buffer (simple but no AI adaptation or unified inbox), Hootsuite (powerful but $99-15k/year and overwhelming), and PostSyncer (broad platform support but surface-level AI), **SocialSpark** makes AI the default engine -- not an add-on -- so every post is platform-optimized out of the box, while keeping the interface simple enough for a solo creator yet deep enough for a growing team.

### Competitive Positioning Map

```
                        SIMPLE UI
                           |
                     Buffer |  SocialSpark
                           |     ★
              BASIC AI ----+---- AI-NATIVE
                           |
                  Hootsuite | SocialBee
                           |
                       COMPLEX UI
```

SocialSpark occupies the **top-right quadrant**: AI-native capabilities delivered through a simple, progressive-disclosure interface. No competitor currently holds this position.

### Target Personas

#### Persona 1: "Solo Sam" -- The Content Creator

| Attribute | Detail |
|-----------|--------|
| **Role** | Full-time content creator / solopreneur |
| **Platforms** | Instagram, TikTok, YouTube, X/Twitter, Threads |
| **Team size** | 1 (themselves) |
| **Current tools** | Buffer free tier + Canva + ChatGPT in separate tabs |
| **Monthly budget** | $0-25/month |
| **Key pain** | Spends 3+ hours/day manually adapting the same content idea for 5 different platforms. Copy-pastes between ChatGPT and Buffer. Hashtag research is manual and inconsistent. |
| **Goal** | Post consistently across all platforms without it becoming a full-time job |
| **Success metric** | Cut content production time by 60%+, maintain or grow engagement |
| **SocialSpark value** | Write one post, AI adapts it for every platform. AI suggests hashtags, best times, and image variations. One tool replaces three. |

#### Persona 2: "Team Tara" -- The Small Business Marketing Lead

| Attribute | Detail |
|-----------|--------|
| **Role** | Marketing manager at a 15-person startup or local business |
| **Platforms** | Instagram, Facebook, LinkedIn, X/Twitter, Pinterest |
| **Team size** | 3 (herself + 1 content writer + 1 intern) |
| **Current tools** | Hootsuite Professional ($99/month) or cobbled-together free tools |
| **Monthly budget** | $30-80/month |
| **Key pain** | Approval process is email-based and chaotic. Intern posts without approval sometimes. No visibility into what is working across platforms. Comments and mentions pile up unanswered. |
| **Goal** | Streamlined content workflow with approval gates, plus a single dashboard for engagement and performance |
| **Success metric** | Zero unapproved posts going live, response time to comments under 2 hours, monthly reporting in 5 minutes instead of 2 hours |
| **SocialSpark value** | Draft-review-approve workflow prevents mistakes. Unified inbox catches every comment. AI handles first-draft generation so the writer focuses on editing. Analytics dashboard replaces manual spreadsheet tracking. |

#### Persona 3: "Agency Alex" -- The Freelance Social Media Manager

| Attribute | Detail |
|-----------|--------|
| **Role** | Freelance social media manager handling 3-5 client accounts |
| **Platforms** | All major platforms (varies by client) |
| **Team size** | 1-2 (themselves + occasional VA) |
| **Current tools** | Publer ($12/month) + Later ($25/month) + native platform analytics |
| **Monthly budget** | $15-50/month (eats into margins) |
| **Key pain** | Switching between multiple tools and platform-native dashboards. Can't show clients a unified report. Spends Sunday evenings batch-creating content for the week. Brand voice inconsistent across clients. |
| **Goal** | Manage all client accounts from one dashboard with per-client brand voice and reporting |
| **Success metric** | Consolidate to one tool, reduce Sunday batch session from 6 hours to 2 hours, deliver client reports in one click |
| **SocialSpark value** | One dashboard for all clients. Brand voice profiles per client ensure AI-generated content stays on-brand. Bulk scheduling and queue system eliminate Sunday marathons. One-click exportable reports impress clients. |

---

## 2. Core Features (Must-Have for MVP)

### 2.1 Authentication & Onboarding

#### 2.1.1 Social Login & Account Creation

**Description**: Users can sign up and log in using email/password or social OAuth providers (Google, Apple, GitHub). Passwordless magic link option for frictionless access.

**User Value**: Removes signup friction. Users are active within 30 seconds, not 3 minutes.

**Competitive Edge**: Matches Buffer and Hootsuite baseline; magic link adds modern feel that enterprise-era tools lack.

**Acceptance Criteria**:
- [ ] User can create account via email + password
- [ ] User can sign up / log in with Google OAuth
- [ ] User can sign up / log in with Apple ID
- [ ] Magic link login via email works within 60 seconds
- [ ] Email verification sent on signup; account usable immediately but flagged until verified
- [ ] Password reset flow functional
- [ ] Session persists across browser tabs; refresh does not log out
- [ ] Rate limiting on login attempts (5 failed attempts triggers 15-minute cooldown)

#### 2.1.2 Platform OAuth Connections

**Description**: After account creation, users connect their social media accounts via each platform's official OAuth flow. SocialSpark requests only the minimum permissions needed for publishing, reading analytics, and managing comments.

**User Value**: Secure, standard connection method. Users never share their social media passwords with SocialSpark.

**Competitive Edge**: Supporting 10 platforms from day one matches Vista Social (12+) and exceeds Buffer (10) and Hootsuite (8+) on breadth.

**Acceptance Criteria**:
- [ ] OAuth flows functional for: Instagram (via Meta), Facebook Pages, X/Twitter, LinkedIn (personal + company pages), TikTok, YouTube, Threads, Pinterest, Bluesky, Mastodon
- [ ] Each connection shows a clear permissions summary before user authorizes
- [ ] Failed connections display actionable error messages (not generic errors)
- [ ] Users can disconnect and reconnect any platform without data loss
- [ ] Connection status is visible at all times (connected, expired, error)
- [ ] Token refresh handled automatically; user only re-authorizes if platform revokes access
- [ ] Support for multiple accounts per platform (e.g., 2 Instagram accounts)

#### 2.1.3 Guided Setup Wizard

**Description**: First-run experience that walks users through: connecting their first platform, setting their timezone, optionally importing brand assets (logo, colors), and creating + scheduling their first AI-generated post -- all within 5 minutes.

**User Value**: Time-to-first-value under 5 minutes. User experiences the core "AI generates + adapts + schedules" loop before they can churn.

**Competitive Edge**: Most competitors drop users into an empty dashboard. SocialSpark's wizard demonstrates the AI differentiator immediately.

**Acceptance Criteria**:
- [ ] Wizard launches automatically on first login
- [ ] Step 1: Connect at least one social platform (can skip, but encouraged)
- [ ] Step 2: Set timezone (auto-detected from browser with manual override)
- [ ] Step 3: Optionally upload logo and set brand colors
- [ ] Step 4: AI generates a sample post based on user's connected platform and a brief topic prompt
- [ ] Step 5: User previews the post as it would appear on their connected platform(s)
- [ ] Step 6: User can schedule or discard the sample post
- [ ] Wizard is skippable at any step
- [ ] Wizard can be replayed from settings
- [ ] Completion rate tracked via analytics event

---

### 2.2 AI Content Engine (Primary Differentiator)

This is the feature set that defines SocialSpark. Every sub-feature here must feel integrated, not bolted-on. AI is the default mode of content creation, not an optional sidebar.

#### 2.2.1 AI Content Generation

**Description**: Users provide a topic, brief, URL, or rough idea, and the AI generates complete post content: text copy, captions, relevant hashtags, and suggested CTAs. Supports multiple tones (professional, casual, witty, inspirational, educational) and lengths. Generates multiple variants for the user to choose from or edit.

**User Value**: Eliminates the blank-page problem. Even experienced writers save 15-30 minutes per post by starting from an AI draft rather than from zero.

**Competitive Edge**: SocialBee's AI Copilot generates strategies but produces generic output. Buffer's AI is limited to basic captions. SocialSpark generates platform-aware content from the start -- the AI already knows it is writing for LinkedIn vs TikTok.

**Acceptance Criteria**:
- [ ] User can input: free-text topic, URL to reference, or paste existing content to rework
- [ ] AI generates at least 3 content variants per request
- [ ] Each variant includes: main copy, suggested hashtags (platform-appropriate count), and a CTA suggestion
- [ ] User can select tone from: Professional, Casual, Witty, Inspirational, Educational, Custom (free-text tone description)
- [ ] User can set target length: Short (< 100 chars), Medium (100-300 chars), Long (300+ chars), or Platform Default (auto)
- [ ] Generated content respects platform character limits (280 for X, 2200 for Instagram, etc.)
- [ ] Generation completes in under 5 seconds for text content
- [ ] User can regenerate, edit, or mix-and-match parts from different variants
- [ ] Generation history saved for the session (user can go back to a previous variant)
- [ ] Content passes basic quality checks: no placeholder text, no hallucinated hashtags, grammatically correct

#### 2.2.2 Platform-Specific Content Adaptation

**Description**: The signature feature. User writes or generates content once, then clicks "Adapt for all platforms." The AI produces a tailored version for each connected platform, adjusting: tone (casual for TikTok, professional for LinkedIn), length (280 chars for X, long-form for LinkedIn), hashtag strategy (5-10 for Instagram, 2-3 for LinkedIn, none for Facebook), format (thread for X if content is long, carousel suggestion for Instagram), and CTA style.

**User Value**: Transforms a 45-minute multi-platform content session into a 5-minute review-and-approve flow. This is the "Write Once, Publish Everywhere Optimally" promise.

**Competitive Edge**: No competitor does this as a first-class, default workflow. Buffer requires manual per-platform editing. Hootsuite allows per-platform customization but offers no AI adaptation. PostSyncer has broad platform support but no intelligent adaptation. This is the gap identified in market research as "True Cross-Platform Content Adaptation."

**Acceptance Criteria**:
- [ ] "Adapt for all platforms" button available on any draft or generated content
- [ ] Adaptation runs for all connected platforms simultaneously
- [ ] Each adapted version visible in a side-by-side preview (or tabbed view)
- [ ] Adaptations respect per-platform rules:

| Platform | Max Length | Hashtag Strategy | Tone Default | Format Notes |
|----------|-----------|-----------------|-------------|-------------|
| Instagram | 2,200 chars | 5-15 hashtags (in caption or first comment) | Casual/visual | Carousel and Reel suggestions |
| Facebook | 63,206 chars | 1-3 hashtags or none | Conversational | Link preview optimization |
| X/Twitter | 280 chars (or 25,000 for long posts) | 1-3 hashtags | Concise/punchy | Auto-thread if content exceeds limit |
| LinkedIn | 3,000 chars | 2-5 hashtags | Professional/thoughtful | Article link suggestions |
| TikTok | 2,200 chars (caption) | 3-5 hashtags | Casual/trending | Trending sound/format suggestions |
| YouTube | 5,000 chars (description) | 5-15 tags | Informative | Title + description + tags generated |
| Threads | 500 chars | 0-3 hashtags | Conversational | Thread splitting if needed |
| Pinterest | 500 chars (description) | 0 hashtags (use keywords) | Descriptive/SEO | Pin title + description + board suggestion |
| Bluesky | 300 chars | 0-3 hashtags | Conversational | Alt text suggestions for images |
| Mastodon | 500 chars | 1-5 hashtags | Community-aware | Content warning field suggestions if relevant |

- [ ] User can edit any individual platform version without affecting others
- [ ] User can exclude specific platforms from a post
- [ ] Adaptation completes in under 8 seconds for all platforms
- [ ] User can re-adapt a single platform version after manual edits to another

#### 2.2.3 AI Image Generation

**Description**: Users can generate images from text prompts directly within the post editor. The AI produces images sized correctly for the target platform(s). Users can specify style (photographic, illustration, flat design, meme, minimalist) and mood.

**User Value**: Eliminates the need to switch to Canva, Midjourney, or stock photo sites. Content creation stays in one tool.

**Competitive Edge**: No major scheduling platform offers integrated AI image generation. Tailwind has Tailwind Create but it is template-based, not generative. This closes the creation-to-scheduling gap.

**Acceptance Criteria**:
- [ ] Text-to-image generation accessible from within the post editor
- [ ] User can specify: prompt, style (photographic, illustration, minimalist, meme, abstract), aspect ratio (1:1, 4:5, 9:16, 16:9), and mood (bright, dark, professional, playful)
- [ ] AI generates 4 image variants per prompt
- [ ] Generated images automatically sized for selected platform(s):
  - Instagram Feed: 1080x1080 or 1080x1350
  - Instagram/TikTok Story/Reel: 1080x1920
  - Facebook: 1200x630
  - X/Twitter: 1600x900
  - LinkedIn: 1200x627
  - Pinterest: 1000x1500
  - YouTube Thumbnail: 1280x720
- [ ] User can regenerate with modified prompt
- [ ] Generated images saved to user's media library automatically
- [ ] Image generation completes in under 15 seconds
- [ ] User can upscale or make minor edits (crop, brightness, text overlay) without leaving the editor
- [ ] Generated images are commercially usable (no licensing restrictions)

#### 2.2.4 AI-Suggested Best Posting Times

**Description**: For each connected platform, the AI analyzes the user's historical engagement data (when available) and platform-wide best-practice data to recommend optimal posting times. Suggestions update as more data is collected.

**User Value**: Removes guesswork from scheduling. Users no longer need to Google "best time to post on Instagram 2026" -- the system tells them, personalized to their audience.

**Competitive Edge**: Buffer and Later offer generic best-time suggestions. SocialSpark combines platform-wide data with per-account historical engagement, improving over time. SocialBee offers similar but only for a subset of platforms.

**Acceptance Criteria**:
- [ ] For each connected platform, display recommended posting times (day of week + time) ranked by predicted engagement
- [ ] New accounts (no historical data) receive platform-wide best-practice defaults, clearly labeled as "general" recommendations
- [ ] After 2+ weeks of posting data, recommendations blend general data with account-specific engagement patterns
- [ ] Recommendations refresh weekly as new data comes in
- [ ] When scheduling a post, the scheduler highlights recommended time slots in green
- [ ] User can view the reasoning behind each suggestion ("Your audience is most active Tue/Thu 9-11am EST")
- [ ] Best times differ per platform (e.g., LinkedIn weekday mornings, TikTok evenings)
- [ ] User can override recommendations at any time (suggestions, not mandates)

#### 2.2.5 Brand Voice Learning

**Description**: The AI learns each user's (or client's) unique writing style by analyzing their past content. Over time, AI-generated content increasingly matches their natural tone, vocabulary, sentence structure, and emoji usage patterns. Users can also manually define brand voice attributes.

**User Value**: AI-generated drafts feel like the user wrote them, not a robot. This is the difference between "useful AI" and "AI I actually want to publish."

**Competitive Edge**: No competitor offers true voice learning. SocialBee's AI Copilot uses tone presets but does not learn from the user's own content. This is the moat: the longer a user stays, the better the AI gets at sounding like them.

**Acceptance Criteria**:
- [ ] Brand Voice profile created per workspace or per connected account
- [ ] Manual brand voice setup: user can describe their voice in free text ("professional but approachable, uses occasional humor, never uses exclamation marks") and/or select from attributes (Formal/Casual, Serious/Playful, Technical/Simple, etc.)
- [ ] Automatic voice learning: system analyzes the user's last 50+ published posts to build a style profile
- [ ] Voice profile includes: average sentence length, vocabulary complexity, emoji frequency, hashtag style, CTA patterns, commonly used phrases
- [ ] AI-generated content uses the learned voice profile by default
- [ ] User can switch between voice profiles (useful for freelancers managing multiple clients)
- [ ] Voice accuracy improves measurably over the first 30 days of use (internal metric)
- [ ] User can view and edit the AI's understanding of their voice ("The AI thinks your tone is: casual, concise, emoji-light. Adjust?")
- [ ] Reset option to clear learned voice and start fresh

---

### 2.3 Multi-Platform Management

#### 2.3.1 Connect 10+ Platforms via OAuth

**Description**: Support OAuth connection flows for Instagram (personal + business), Facebook Pages, X/Twitter, LinkedIn (personal + company), TikTok, YouTube, Threads, Pinterest, Bluesky (via AT Protocol), and Mastodon (via ActivityPub -- user specifies instance URL).

**User Value**: One dashboard for every platform. No more opening 10 browser tabs to manage 10 accounts.

**Competitive Edge**: Matches Vista Social's breadth (12+ platforms). Exceeds Buffer and Hootsuite on day one. Bluesky + Mastodon support from launch positions SocialSpark as forward-looking where enterprise tools lag.

**Acceptance Criteria**:
- [ ] All 10 platforms connectable via their respective OAuth/API methods
- [ ] Bluesky connection via AT Protocol (app password or OAuth when available)
- [ ] Mastodon connection supports any instance (user enters instance URL, then OAuth)
- [ ] Each platform connection shows: account name, avatar, follower count, connection status
- [ ] Multiple accounts per platform supported (limit based on pricing tier)
- [ ] Connection errors are descriptive and actionable
- [ ] All connections encrypted at rest and in transit

#### 2.3.2 Unified Dashboard

**Description**: A single-screen overview showing all connected accounts, their status, recent post performance at a glance, and any items requiring attention (failed posts, expired connections, pending approvals).

**User Value**: Morning check-in takes 30 seconds instead of 10 minutes across multiple apps.

**Competitive Edge**: While most competitors have dashboards, they are typically post-centric (show scheduled posts) rather than account-centric. SocialSpark's dashboard is a command center showing health, performance, and action items.

**Acceptance Criteria**:
- [ ] Dashboard loads in under 2 seconds
- [ ] Shows all connected accounts with: avatar, platform icon, connection status (green/yellow/red), and a 7-day engagement sparkline
- [ ] "Attention needed" section surfaces: expired connections, failed posts, pending approval items, unread inbox items
- [ ] Quick-action buttons: "Create Post," "View Calendar," "Open Inbox"
- [ ] Customizable layout (user can hide/show sections, reorder accounts)
- [ ] Responsive design: fully functional on desktop (1024px+), usable on tablet (768px+), and read-only summary on mobile (< 768px)
- [ ] Data refreshes automatically every 5 minutes or on manual pull-to-refresh

#### 2.3.3 Platform Health & Connection Management

**Description**: Dedicated settings page showing detailed status of every platform connection, including token expiry dates, API rate limit usage, last successful sync time, and one-click reconnection.

**User Value**: Prevents the silent failure problem where tokens expire and posts fail without the user knowing until after the fact.

**Competitive Edge**: Most competitors show a simple connected/disconnected toggle. SocialSpark proactively warns before tokens expire and shows API health -- valuable for power users managing many accounts.

**Acceptance Criteria**:
- [ ] Per-platform status card showing: connection health, last sync, token expiry estimate, API rate limit usage percentage
- [ ] Proactive email/in-app notification 7 days and 1 day before token expiry
- [ ] One-click re-authentication for expired connections
- [ ] Connection audit log (when connected, disconnected, refreshed)
- [ ] Bulk reconnection option (re-auth all expired connections in sequence)
- [ ] Platform API status indicators (if the platform itself is experiencing issues, show it)

---

### 2.4 Content Creation & Editor

#### 2.4.1 Rich Text Editor with Media Upload

**Description**: A modern, distraction-free editor for composing posts. Supports rich text formatting (bold, italic, line breaks, lists for platforms that support them), emoji picker, and media uploads (images, videos up to platform limits, GIFs). Drag-and-drop and paste-from-clipboard supported.

**User Value**: Professional editing experience without needing an external tool. Media upload directly in the editor eliminates the workflow break of uploading to a platform first.

**Competitive Edge**: Matches the best editors in market (Typefully for clean writing, Later for visual media). Exceeds Buffer's basic text field.

**Acceptance Criteria**:
- [ ] Rich text editor with: bold, italic, line breaks, emoji picker, mention suggestions (@)
- [ ] Media upload supports: JPEG, PNG, GIF, WebP, MP4, MOV
- [ ] Drag-and-drop upload from desktop
- [ ] Paste image from clipboard
- [ ] File size limits clearly communicated before upload (per platform limits)
- [ ] Image compression/optimization applied automatically to reduce upload time
- [ ] Video thumbnail preview shown after upload
- [ ] Multiple media items per post (up to platform limits, e.g., 10 images for Instagram carousel)
- [ ] Undo/redo support (Ctrl+Z / Ctrl+Shift+Z)
- [ ] Character count shown with color coding (green/yellow/red) per selected platform
- [ ] Auto-save drafts every 30 seconds

#### 2.4.2 Platform Preview

**Description**: Real-time preview showing exactly how the post will appear on each target platform, including profile picture, username, media layout, hashtag rendering, and truncation behavior.

**User Value**: "What you see is what gets posted." No more surprises where a post looks different than expected because of character truncation or image cropping.

**Competitive Edge**: Planable and Later have good previews but only for select platforms. SocialSpark previews all 10 platforms with pixel-accurate rendering.

**Acceptance Criteria**:
- [ ] Preview available for all 10 supported platforms
- [ ] Preview updates in real-time as user types
- [ ] Shows: platform-specific profile picture, username, post timestamp (relative), media rendering (grid layout for carousels, video player for videos), hashtag rendering, link preview cards
- [ ] Shows truncation behavior (e.g., Instagram "...more" after 125 chars, X thread break points)
- [ ] Mobile and desktop preview modes (toggle between phone and desktop views)
- [ ] Preview accessible via a split-pane view (editor left, preview right) or full-screen preview modal
- [ ] Accurate character count per platform shown alongside preview

#### 2.4.3 Draft Management

**Description**: Posts can be saved as drafts at any stage. Drafts are organized by date, status (idea, in progress, ready for review), and associated platforms. Full-text search across drafts.

**User Value**: Capture ideas instantly without committing to publish. Build up a content backlog for batch scheduling later.

**Competitive Edge**: Standard feature, but SocialSpark adds status stages and search that Buffer's basic drafts lack.

**Acceptance Criteria**:
- [ ] Drafts auto-saved every 30 seconds
- [ ] Manual save-as-draft button always accessible
- [ ] Draft statuses: Idea, In Progress, Ready for Review, Approved (ties into approval workflow)
- [ ] Drafts list view with: title/preview, status, last modified, target platforms
- [ ] Full-text search across all drafts
- [ ] Filter drafts by: status, platform, date range, author (for teams)
- [ ] Bulk actions: delete, move to status, assign to team member
- [ ] No limit on number of drafts (all tiers)

#### 2.4.4 Media Library

**Description**: Centralized asset library where all uploaded images, videos, GIFs, and AI-generated images are stored and organized. Supports folders, tags, and search. Assets can be reused across multiple posts.

**User Value**: No more hunting through Downloads folders or Google Drive for that logo. All social media assets in one searchable, organized place.

**Competitive Edge**: Later has a strong media library; most others (Buffer, Publer) treat media as post-level attachments. SocialSpark's library is a first-class feature with AI-powered tagging.

**Acceptance Criteria**:
- [ ] All uploaded and AI-generated media automatically added to library
- [ ] Folder/collection organization (user-created folders)
- [ ] Tag system (manual tags + AI-suggested tags based on image content)
- [ ] Search by: filename, tag, upload date, file type, dimensions
- [ ] Thumbnail grid view and list view
- [ ] Storage limits per pricing tier (clearly communicated)
- [ ] Drag-and-drop from library into post editor
- [ ] Bulk upload support (up to 50 files at once)
- [ ] Image metadata shown: dimensions, file size, format, color profile
- [ ] Delete confirmation with warning if asset is used in scheduled posts

#### 2.4.5 Template System

**Description**: Users can save any post (text + media layout + platform selections + AI settings) as a reusable template. Templates are categorized (e.g., "Weekly Tips," "Product Launch," "Testimonial") and can include placeholder variables (e.g., `{{product_name}}`, `{{date}}`).

**User Value**: Recurring content types (weekly tips, monthly roundups, promo posts) no longer start from scratch. Templates encode best practices.

**Competitive Edge**: MeetEdgar has content categories; RecurPost has content recycling. Neither offers true templates with variables. SocialSpark templates combine structure with flexibility.

**Acceptance Criteria**:
- [ ] Save any draft or published post as a template (one click)
- [ ] Template includes: text content, media placeholders, platform selections, tone/voice settings
- [ ] Placeholder variable system: `{{variable_name}}` syntax, prompted on use
- [ ] Template categories (user-defined, e.g., "Tips," "Promos," "Engagement")
- [ ] Template library with search and filter
- [ ] Pre-built starter templates included for common post types (10+ templates out of the box)
- [ ] Team-shared templates (visible to all workspace members)
- [ ] Template analytics: how many times used, average engagement of posts created from template

---

### 2.5 Scheduling & Publishing

#### 2.5.1 Visual Calendar

**Description**: A full-featured content calendar with day, week, and month views. Shows all scheduled, published, and failed posts across all platforms. Color-coded by platform and status. Shows recommended posting time slots.

**User Value**: Complete visibility into the content pipeline. No more "did we already post about that this week?" or "is there a gap on Thursday?"

**Competitive Edge**: Calendar is table stakes, but SocialSpark's calendar integrates AI-recommended time slots (highlighted) and shows cross-platform density (too many posts on one day, too few on another). CoSchedule pioneered the calendar view but lacks AI integration.

**Acceptance Criteria**:
- [ ] Three views: Day, Week, Month
- [ ] Posts displayed as cards with: platform icon(s), text preview (first 80 chars), media thumbnail, status badge (draft/scheduled/published/failed)
- [ ] Color coding by: platform, status, or content category (user toggle)
- [ ] AI-recommended time slots shown as highlighted zones on the calendar
- [ ] Gaps in scheduling highlighted ("No posts scheduled for Wednesday")
- [ ] Click to create post at any time slot
- [ ] Click on existing post to edit, reschedule, or delete
- [ ] Filter by: platform, status, content category, team member
- [ ] Calendar loads in under 3 seconds for a month view with 100+ posts
- [ ] Print-friendly / export to image for sharing with stakeholders

#### 2.5.2 Drag-and-Drop Rescheduling

**Description**: Posts on the calendar can be dragged to a new time slot to reschedule. Works across days and weeks. Visual feedback during drag shows the target time and any scheduling conflicts.

**User Value**: Rescheduling is a 2-second drag instead of an open-edit-change-time-save flow.

**Competitive Edge**: Available in Later and Planable; missing or clunky in Buffer and Publer. SocialSpark's implementation includes conflict detection (warns if moving a post creates a platform-specific posting limit issue).

**Acceptance Criteria**:
- [ ] Drag any scheduled (not yet published) post to a new time slot
- [ ] Works within day view, week view, and month view
- [ ] Visual feedback during drag: ghost card follows cursor, target slot highlights
- [ ] Drop confirmation shows old time vs new time
- [ ] Conflict detection: warns if target time is within the same platform's minimum post spacing (e.g., "You already have an Instagram post at 2:15 PM")
- [ ] Undo after drop (Ctrl+Z or toast notification with "Undo" button, visible for 10 seconds)
- [ ] Batch drag: select multiple posts and move them together (shift-click to multi-select)

#### 2.5.3 Queue System

**Description**: Users define recurring time slots (e.g., "Post to Instagram every Tue/Thu at 10am, LinkedIn every weekday at 9am"). Content added to the queue auto-fills the next available slot. Queue is a first-in-first-out content pipeline.

**User Value**: "Set it and forget it" scheduling. Users batch-create content when inspired, and the queue ensures a consistent posting cadence without manual scheduling of each post.

**Competitive Edge**: Buffer pioneered the queue concept. MeetEdgar added evergreen recycling. SocialSpark combines Buffer's simplicity with AI-recommended slot times and queue health indicators ("Your Instagram queue runs dry in 3 days").

**Acceptance Criteria**:
- [ ] User can define per-platform queue slots (day of week + time)
- [ ] AI suggests optimal queue slot times based on best-time analysis
- [ ] Adding content to queue auto-assigns it to the next available slot
- [ ] Queue view shows: next 20 upcoming posts, queue depth per platform, "runs dry" warning
- [ ] Drag-and-drop reordering within the queue
- [ ] Pause/resume queue per platform (e.g., pause Instagram queue during a holiday)
- [ ] Queue "shuffle" option to randomize order
- [ ] Queue health dashboard: posts remaining, days until empty, posting frequency

#### 2.5.4 Bulk Scheduling

**Description**: Upload a CSV file with columns for content, platform, date/time, and media URLs to schedule many posts at once. CSV template downloadable from the app. Validation and error reporting before import is finalized.

**User Value**: Schedule a month of content in minutes instead of hours. Essential for content batch workflows and migrations from other tools.

**Competitive Edge**: Publer and Hootsuite offer CSV upload. Buffer does not. SocialSpark adds AI enhancement: after CSV upload, optionally run AI adaptation on all posts to optimize per platform.

**Acceptance Criteria**:
- [ ] Downloadable CSV template with clear column headers and example rows
- [ ] Upload accepts: CSV, TSV (up to 500 rows per upload)
- [ ] Columns supported: content_text, platform(s), date, time, timezone, media_url(s), hashtags, first_comment
- [ ] Pre-import validation: shows rows with errors (invalid dates, missing required fields, character limit exceeded) in a review screen
- [ ] User can fix errors in-app before confirming import
- [ ] Optional: "AI Enhance" toggle that runs platform adaptation on each imported post
- [ ] Import progress indicator for large batches
- [ ] Post-import summary: X posts scheduled, Y errors, Z duplicates detected
- [ ] Import history log (when, how many, by whom)

#### 2.5.5 Auto-Publishing

**Description**: At the scheduled time, posts are automatically published to the target platform(s). Retry logic for transient failures (network, API rate limits). Notification on success and failure.

**User Value**: The core promise of a scheduler: posts go out on time, every time, without the user needing to be online.

**Competitive Edge**: Table stakes. SocialSpark's edge is reliability: automatic retries, clear failure notifications, and a fallback queue for failed posts.

**Acceptance Criteria**:
- [ ] Posts publish within 60 seconds of scheduled time
- [ ] Retry logic: 3 automatic retries with exponential backoff (1 min, 5 min, 15 min)
- [ ] On final failure: post marked as "Failed" with actionable error message, user notified via email and in-app
- [ ] Failed posts remain editable and re-schedulable
- [ ] Publishing log: timestamp of publish attempt(s), platform response, success/failure
- [ ] Support for platform-specific publishing requirements (e.g., Instagram first comment for hashtags, YouTube tags, Pinterest board selection)
- [ ] No double-posting: idempotency safeguards prevent duplicate publishes on retry
- [ ] Publishing queue processes posts in chronological order, respecting per-platform rate limits

#### 2.5.6 Timezone Support

**Description**: Users set their workspace timezone. All scheduling UI displays times in the workspace timezone. Per-post timezone override available for teams operating across time zones. Audience timezone awareness: schedule posts in the audience's timezone rather than the creator's.

**User Value**: No more mental timezone math. A team member in London and another in New York see the same calendar in their respective local times.

**Competitive Edge**: Most tools support setting a timezone. SocialSpark adds audience-timezone scheduling ("publish at 9am in your audience's primary timezone") which only Hootsuite Enterprise offers.

**Acceptance Criteria**:
- [ ] Workspace-level timezone setting (IANA timezone database, 400+ timezones)
- [ ] All calendar and scheduling UI shows times in workspace timezone by default
- [ ] Per-user timezone display option (each team member sees their local time)
- [ ] Per-post timezone override ("publish at 9am EST regardless of workspace timezone")
- [ ] Audience timezone feature: if analytics show audience location data, offer "post at 9am in your audience's primary timezone"
- [ ] Daylight saving time transitions handled correctly (no posts skipped or doubled)
- [ ] Timezone clearly displayed next to every timestamp in the UI

#### 2.5.7 Recurring & Evergreen Post Recycling

**Description**: Mark any post as "evergreen." Evergreen posts can be set to automatically re-publish on a recurring schedule (e.g., every 30 days, every quarter). The system optionally varies the content slightly on each republish (different hashtags, minor wording changes via AI) to avoid staleness and platform penalties.

**User Value**: High-performing content keeps working without manual re-scheduling. "Set and forget" for timeless content.

**Competitive Edge**: MeetEdgar and RecurPost are built around this concept but are single-purpose tools. SocialSpark integrates recycling into the full platform, and adds AI-powered variation on each recycle to keep content fresh -- something neither competitor offers.

**Acceptance Criteria**:
- [ ] Any published or scheduled post can be marked "Evergreen"
- [ ] Evergreen settings: recurrence interval (every N days/weeks/months), start date, end date (or indefinite)
- [ ] AI variation toggle: when enabled, each republish gets minor AI-generated variations (different hashtags, slightly reworded CTA, alternative emoji) while keeping the core message
- [ ] Evergreen queue visible in calendar (distinct visual treatment from one-time posts)
- [ ] Performance tracking: show engagement trend across republishes (is this evergreen post declining?)
- [ ] Auto-pause suggestion: if an evergreen post's engagement drops below a threshold over 3+ cycles, suggest retiring it
- [ ] Maximum 50 evergreen posts on free tier, unlimited on paid tiers

---

### 2.6 Team Collaboration

#### 2.6.1 Team Member Invites with Roles

**Description**: Workspace owner can invite team members via email. Three roles: Admin (full access including billing and settings), Editor (create, edit, schedule content; no billing access), Viewer (read-only access to calendar, analytics, and inbox).

**User Value**: The intern can write drafts but not publish. The client can view the calendar but not change anything. Clear roles prevent accidents.

**Competitive Edge**: Hootsuite and Sprout Social have granular roles but at $99-199+/user/month. Planable has good roles at $33/month. SocialSpark offers meaningful roles at a lower price point, specifically designed for small teams rather than enterprise hierarchies.

**Acceptance Criteria**:
- [ ] Invite via email address (sends signup link if not already a user)
- [ ] Three roles: Admin, Editor, Viewer
- [ ] Role permissions matrix:

| Permission | Admin | Editor | Viewer |
|-----------|-------|--------|--------|
| Create/edit content | Yes | Yes | No |
| Publish/schedule posts | Yes | Yes | No |
| Approve content | Yes | Yes (if designated approver) | No |
| View calendar | Yes | Yes | Yes |
| View analytics | Yes | Yes | Yes |
| Manage team members | Yes | No | No |
| Manage billing | Yes | No | No |
| Connect/disconnect platforms | Yes | No | No |
| Manage workspace settings | Yes | No | No |
| View inbox | Yes | Yes | Yes |
| Reply from inbox | Yes | Yes | No |
| Export reports | Yes | Yes | Yes |

- [ ] Owner can change any member's role
- [ ] Member can leave workspace voluntarily
- [ ] Removed members lose access immediately
- [ ] Activity attributed to individual team members (audit trail)

#### 2.6.2 Content Approval Workflow

**Description**: A simple, linear approval workflow: Draft -> In Review -> Approved -> Scheduled. Editors submit posts for review; designated approvers (Admins or assigned Editors) approve or request changes with comments. Posts cannot be scheduled until approved (when workflow is enabled).

**User Value**: No more unapproved content going live. Clear accountability for every published post.

**Competitive Edge**: Planable's multi-level approvals are best-in-class but complex and start at $33/month. SocialSpark's workflow is intentionally simpler (one approval level) and included at a lower price point. Sufficient for small teams; multi-level approvals deferred to v2.

**Acceptance Criteria**:
- [ ] Approval workflow toggle: workspace-level on/off (off by default for solo users)
- [ ] When enabled, post status flow: Draft -> In Review -> Approved / Changes Requested -> Scheduled
- [ ] Editor clicks "Submit for Review" to move draft to In Review
- [ ] Approver receives in-app notification and email
- [ ] Approver can: Approve (moves to Approved), Request Changes (moves back to Draft with comment), or Edit directly
- [ ] Approved posts can be scheduled by anyone with Editor+ role
- [ ] Changes Requested: original author notified with approver's comment
- [ ] Approval history visible on each post (who approved, when, any comments)
- [ ] Posts cannot bypass approval when workflow is enabled (hard block on scheduling unapproved content)
- [ ] Bulk approval: approver can approve multiple posts at once from a review queue

#### 2.6.3 Comments on Posts

**Description**: Team members can leave comments on any draft, scheduled, or published post. Comments are threaded and support @mentions to notify specific team members. This is internal collaboration, not public social media comments.

**User Value**: Feedback and discussion happens in context, right on the post, instead of in a separate Slack thread or email chain.

**Competitive Edge**: Planable pioneered in-context commenting. Buffer has no commenting. SocialSpark brings this capability to a lower price tier with @mention notifications.

**Acceptance Criteria**:
- [ ] Comment thread available on every post (any status)
- [ ] Comments support: text, @mentions (triggers notification to mentioned user), and emoji reactions
- [ ] Threaded replies (one level of nesting)
- [ ] @mention autocomplete from workspace members
- [ ] Comment notifications: in-app and email (configurable)
- [ ] Comment count visible on post cards in calendar and list views
- [ ] Comments preserved in post history (not deleted when post status changes)
- [ ] Resolve/unresolve comments (like Google Docs)

#### 2.6.4 Activity Log

**Description**: Chronological log of all actions taken in the workspace: post created, edited, approved, published, failed, team member added/removed, platform connected/disconnected, settings changed.

**User Value**: "Who changed the post that went out wrong?" Full accountability and auditability for teams.

**Competitive Edge**: Available in enterprise tools (Sprout Social, Hootsuite). Rare in the $15-50/month tier. SocialSpark brings enterprise-grade auditability to small team pricing.

**Acceptance Criteria**:
- [ ] Log entries include: timestamp, user, action type, affected entity (post, platform, team member), details
- [ ] Filterable by: user, action type, date range, entity type
- [ ] Searchable by keyword
- [ ] Retained for 90 days on free tier, 1 year on paid tiers
- [ ] Exportable as CSV
- [ ] Accessible to Admin and Editor roles (not Viewer, to prevent information overload)
- [ ] Real-time updates (new entries appear without page refresh)

---

### 2.7 Analytics Dashboard

#### 2.7.1 Per-Platform Metrics

**Description**: For each connected platform, display key metrics: followers/subscribers count and growth, total reach/impressions, total engagement (likes, comments, shares, saves), engagement rate, and top posts. Data pulled from platform APIs on a regular sync schedule.

**User Value**: No more logging into each platform's native analytics. One dashboard, all metrics, side-by-side comparison.

**Competitive Edge**: Sprout Social and Agorapulse have the deepest analytics but at $99-199+/month. Buffer's analytics are basic. SocialSpark provides mid-tier analytics depth (more than Buffer, less than Sprout) at an accessible price, with AI-powered insights layered on top.

**Acceptance Criteria**:
- [ ] Metrics displayed per platform:

| Metric | Instagram | Facebook | X/Twitter | LinkedIn | TikTok | YouTube | Threads | Pinterest | Bluesky | Mastodon |
|--------|-----------|----------|-----------|----------|--------|---------|---------|-----------|---------|----------|
| Followers/Subscribers | Yes | Yes | Yes | Yes | Yes | Yes | Yes* | Yes | Yes | Yes |
| Reach/Impressions | Yes | Yes | Yes | Yes | Yes | Yes | Limited | Yes | Limited | Limited |
| Engagement (likes, comments, shares) | Yes | Yes | Yes | Yes | Yes | Yes | Yes* | Yes | Yes | Yes |
| Engagement Rate | Yes | Yes | Yes | Yes | Yes | Yes | Calc'd | Yes | Calc'd | Calc'd |
| Top Posts | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Video Views | Yes | Yes | Yes | N/A | Yes | Yes | N/A | Yes | N/A | N/A |

*Subject to API availability (Threads, Bluesky, Mastodon APIs may provide limited data)

- [ ] Data synced at least every 6 hours
- [ ] Historical data stored from the date of account connection onward
- [ ] Metrics displayed with sparkline trends (7-day, 30-day)
- [ ] Cross-platform comparison view: side-by-side metrics for selected platforms

#### 2.7.2 Post Performance Tracking

**Description**: Every post published through SocialSpark is tracked individually: impressions, reach, engagement actions (likes, comments, shares, saves, clicks), and engagement rate. Performance data updates over 72 hours post-publish (when most engagement occurs).

**User Value**: Know which specific posts worked and which did not. Data-driven decisions replace gut feelings.

**Competitive Edge**: Standard feature, but SocialSpark adds AI-generated performance summaries ("This post performed 3x your average because of the trending hashtag and the question CTA").

**Acceptance Criteria**:
- [ ] Per-post metrics: impressions, reach, likes, comments, shares, saves, link clicks, engagement rate
- [ ] Metrics update at: 1 hour, 6 hours, 24 hours, 48 hours, and 72 hours post-publish
- [ ] Post performance card accessible from calendar (click on any published post)
- [ ] AI-generated performance insight (one sentence explaining why a post over/under-performed)
- [ ] Comparison to user's average performance ("+147% above your 30-day average engagement")
- [ ] Sort published posts by any metric (most engaging, most reach, etc.)
- [ ] Filter by: date range, platform, content category

#### 2.7.3 Best Performing Content Identification

**Description**: Automatically surfaces the user's top-performing posts over a configurable period (7, 30, 90 days). Highlights patterns: which content types, topics, formats, posting times, and platforms drive the most engagement.

**User Value**: "Do more of what works." Instead of manually reviewing dozens of posts, the system tells the user their winning formula.

**Competitive Edge**: Basic "top posts" lists exist in most tools. SocialSpark goes further by identifying patterns across top performers and translating them into actionable recommendations ("Your audience engages 2.5x more with question-based posts on LinkedIn during Tuesday mornings").

**Acceptance Criteria**:
- [ ] "Top Performers" section in analytics showing top 10 posts by engagement rate (configurable metric)
- [ ] Pattern detection across top posts: common content types (question, tip, story, promotion), common posting times, common formats (image, video, text-only, carousel), common hashtags
- [ ] AI-generated content strategy summary: "Based on your top performers this month, your audience responds best to [X] content posted at [Y] time on [Z] platform"
- [ ] Exportable as a one-page content strategy brief
- [ ] "Create similar" button on top posts: uses the post as input for AI content generation

#### 2.7.4 Growth Trends Over Time

**Description**: Line and bar charts showing follower growth, engagement trends, reach trends, and posting frequency over time. Per-platform and aggregate views. Benchmark against previous periods.

**User Value**: "Am I growing?" answered at a glance. Trend visualization reveals whether strategy changes are working.

**Competitive Edge**: Standard in mid-tier and above. SocialSpark adds period-over-period comparison and AI-generated growth narratives ("Your Instagram engagement increased 23% this month, likely driven by your switch to carousel posts").

**Acceptance Criteria**:
- [ ] Charts for: follower count, engagement (total and rate), reach/impressions, posting frequency
- [ ] Time ranges: 7 days, 30 days, 90 days, 12 months, custom range
- [ ] Per-platform and cross-platform aggregate views
- [ ] Period-over-period comparison (this month vs last month, this quarter vs last quarter)
- [ ] Trend annotations: mark events on the chart (e.g., "Went viral," "Changed strategy," "Ran ad campaign") for correlation
- [ ] AI-generated trend summary per period (one paragraph)
- [ ] Export charts as PNG or PDF

#### 2.7.5 Exportable Reports

**Description**: Generate professional PDF or CSV reports containing selected metrics, charts, and AI insights. Customizable date range, platform selection, and which metrics to include. Branded with user's logo (if uploaded).

**User Value**: Client reporting in 2 minutes instead of 2 hours. No more manually assembling screenshots into a PowerPoint.

**Competitive Edge**: Sendible has a strong report builder; Agorapulse exports well. Buffer's reporting is limited. SocialSpark adds AI-generated executive summaries and narrative insights to reports -- the AI writes the "what happened and why" section that normally takes the most time.

**Acceptance Criteria**:
- [ ] Report builder: select date range, platforms, metrics, and chart types to include
- [ ] Export formats: PDF (styled), CSV (raw data)
- [ ] PDF report includes: cover page with logo (if uploaded), executive summary (AI-generated), per-platform metrics, top posts, growth charts, content recommendations
- [ ] AI-generated executive summary: 3-5 sentences covering key highlights, changes, and recommendations
- [ ] Shareable link option: generate a view-only link for clients (no SocialSpark login needed)
- [ ] Scheduled reports: auto-generate and email weekly or monthly reports
- [ ] Report templates: save report configurations for repeated use
- [ ] White-labeled: user's logo replaces SocialSpark branding on reports (paid tier feature)

---

### 2.8 Unified Inbox (Lightweight)

#### 2.8.1 Aggregated Comments & Mentions

**Description**: A single inbox view aggregating comments on posts, @mentions, and direct replies from all connected platforms. Items displayed in reverse chronological order with platform icon, author avatar, content preview, and the original post it refers to.

**User Value**: Never miss a customer comment or mention again. Currently, managing engagement across 5+ platforms requires checking each one individually. The unified inbox centralizes this.

**Competitive Edge**: Hootsuite's Universal Inbox is the gold standard but requires $99+/month minimum. No affordable tool (< $50/month) offers a unified inbox. SocialSpark fills this gap identified in market research as a Tier 1 opportunity.

**Acceptance Criteria**:
- [ ] Inbox aggregates: comments on posts published via SocialSpark, @mentions/tags on connected platforms, and direct replies (where API permits)
- [ ] Per-item display: platform icon, author name and avatar, content text, timestamp, link to original post
- [ ] Inbox loads in under 3 seconds
- [ ] New items appear within 15 minutes of being posted on the platform (sync frequency)
- [ ] Filter by: platform, read/unread, resolved/unresolved, date range
- [ ] Search inbox by keyword or author name
- [ ] Unread count badge on inbox icon in navigation
- [ ] Supported platforms for inbox:

| Platform | Comments | Mentions | Replies | DMs |
|----------|----------|----------|---------|-----|
| Instagram | Yes | Yes | Yes | Post-MVP |
| Facebook | Yes | Yes | Yes | Post-MVP |
| X/Twitter | Yes | Yes | Yes | Post-MVP |
| LinkedIn | Yes (Pages) | Yes | Yes | Post-MVP |
| TikTok | Yes | Limited | Yes | Post-MVP |
| YouTube | Yes | Yes | Yes | N/A |
| Threads | Limited* | Limited* | Limited* | N/A |
| Pinterest | Limited | N/A | N/A | N/A |
| Bluesky | Yes* | Yes* | Yes* | N/A |
| Mastodon | Yes* | Yes* | Yes* | N/A |

*Subject to API availability and limitations

#### 2.8.2 Reply Directly from SocialSpark

**Description**: Users can compose and send replies to comments and mentions directly from the unified inbox without leaving SocialSpark. The reply is posted to the original platform as the connected account.

**User Value**: Respond to engagement without switching to the native platform. Saves context-switching time and ensures faster response times.

**Competitive Edge**: Hootsuite and Sprout Social offer this at premium prices. Buffer does not have reply functionality. SocialSpark brings in-app replies to the affordable tier.

**Acceptance Criteria**:
- [ ] Reply text field available on each inbox item
- [ ] Reply posted to original platform as the connected account
- [ ] Reply confirmation: "Reply posted to [platform]" with link to view on platform
- [ ] AI-suggested replies: click to generate a contextually appropriate reply (3 suggestions: friendly, professional, brief)
- [ ] Emoji and @mention support in replies
- [ ] Reply character limit shown per platform
- [ ] Reply failure handling: clear error message if reply fails (e.g., comment was deleted, permissions issue)
- [ ] Reply history visible in inbox thread (see the conversation context)

#### 2.8.3 Mark as Read / Resolved

**Description**: Inbox items can be marked as "Read" (acknowledged but may need follow-up) or "Resolved" (handled, no further action). Supports bulk actions. Resolved items move to an archive.

**User Value**: Inbox zero for social media. Clear distinction between "I've seen this" and "this is handled."

**Competitive Edge**: Simple but effective. Most affordable tools lack even basic inbox management. SocialSpark's read/resolved states bring email-like organization to social engagement.

**Acceptance Criteria**:
- [ ] Each inbox item has: Unread (default), Read, and Resolved states
- [ ] Click to mark individual items
- [ ] Bulk actions: mark selected as read, mark selected as resolved
- [ ] "Mark all as read" for current filter/view
- [ ] Resolved items move to "Resolved" tab (accessible but out of the main feed)
- [ ] Unread count updates in real-time in navigation badge
- [ ] Filter toggles: show unread only, show all, show resolved
- [ ] Team visibility: if a team member marks an item as resolved, it shows who resolved it and when
- [ ] Auto-resolve option: auto-mark as resolved after reply is sent (configurable toggle)

---

## 3. Differentiating Features (What Makes SocialSpark Unique)

These are not separate features but design principles and capabilities woven throughout the product. They represent the answer to "why SocialSpark instead of Buffer/Hootsuite/PostSyncer?"

### 3.1 "Write Once, Publish Everywhere Optimally"

**What it is**: The platform-specific content adaptation engine described in Section 2.2.2, elevated to a brand promise.

**Why it matters**: Market research identified "True Cross-Platform Content Adaptation" as a critical gap. No tool in the 21 analyzed truly handles this. Users manually adjust every post for every platform, or they post identical content everywhere (which platforms penalize with reduced reach).

**How it works in practice**:
1. User writes one post (or AI generates it from a brief)
2. Clicks "Adapt for All"
3. Instantly sees 10 platform-specific versions, each optimized for that platform's audience, format, character limits, and best practices
4. Reviews, tweaks if needed, and schedules all 10 with one click

**Measurable impact**: Reduce multi-platform content creation from 45+ minutes to under 5 minutes per post.

### 3.2 Progressive Disclosure UI

**What it is**: A design philosophy where the interface starts simple and reveals complexity only as the user needs it. New users see a clean, uncluttered interface. Power features (analytics deep-dives, competitor intelligence, advanced scheduling rules, API access) are accessible but tucked behind intentional interaction patterns (expandable sections, "Advanced" tabs, hover-to-reveal controls).

**Why it matters**: Market research shows that Vista Social ranks #1 on G2 for ease of use, and Buffer wins on simplicity. Hootsuite and Sprout Social lose users due to complexity. SocialSpark must be as approachable as Buffer for "Solo Sam" while offering depth for "Team Tara."

**Implementation principles**:
- Default view shows only the most common 80% of actions
- Advanced features are one click away, never zero clicks away (they don't clutter the default view)
- First-time user can create and schedule a post within 2 minutes of first login
- Feature discovery via contextual tooltips ("Did you know you can set up a queue? Learn more")
- No feature requires reading documentation to understand

### 3.3 Smart Composer

**What it is**: AI assistance that works inline as the user types, not as a separate generation step. As the user writes, the Smart Composer:
- Suggests completions (like code autocomplete, but for social copy)
- Recommends relevant hashtags in a floating pill menu
- Suggests emoji placement where appropriate
- Proposes CTA additions ("Add a call to action? Try: 'Drop a comment if you agree'")
- Warns about potential issues ("This post is 312 characters -- it will be truncated on X/Twitter")

**Why it matters**: The difference between "AI as a tool I have to invoke" and "AI as a copilot that helps me as I work." Lowers the bar for AI adoption -- users benefit from AI even if they never explicitly click "Generate."

**Implementation approach**:
- Non-intrusive: suggestions appear as grayed-out text (Tab to accept) or as a floating suggestion bar below the editor
- Toggle on/off per user preference
- Suggestions contextual to selected platforms
- Learning: suggestions improve based on which suggestions the user accepts/rejects

### 3.4 Content Intelligence

**What it is**: An AI layer that continuously analyzes the user's content performance and proactively suggests strategy adjustments. Goes beyond "your top post this month" to "here is what you should change about your content strategy based on patterns in your data."

**Examples of Content Intelligence outputs**:
- "Your LinkedIn posts with questions get 2.3x more comments than statements. Consider asking more questions."
- "Your Instagram engagement peaks on Tuesdays and drops on Fridays. Consider shifting your posting schedule."
- "Posts with 7+ hashtags on Instagram outperform those with 3 or fewer by 40%. You typically use 4."
- "Your video posts consistently outperform image posts on TikTok and Instagram. Consider increasing video frequency."

**Why it matters**: Transforms analytics from a backward-looking report into a forward-looking advisor. Users don't just see what happened -- they see what to do next. No competitor at the < $100/month tier offers this.

**Acceptance Criteria**:
- [ ] Content Intelligence panel accessible from analytics dashboard
- [ ] Generates 3-5 actionable recommendations per month (increases with more data)
- [ ] Each recommendation includes: the insight, supporting data, and a specific action ("Try X")
- [ ] Recommendations update monthly as new data comes in
- [ ] User can mark recommendations as: "Will try," "Already doing this," or "Not relevant"
- [ ] Recommendations improve over time based on user feedback

### 3.5 Trend Radar

**What it is**: A discovery feature that surfaces trending topics, hashtags, audio tracks, and content formats relevant to the user's niche. Powered by analysis of platform trending data and the user's own content categories.

**Examples**:
- "Trending on TikTok in your niche: #SilentWalking -- 14M views this week. Would you like to create a post about it?"
- "Carousel posts about [your topic] are spiking on Instagram this week. Here's a template."
- "This trending audio on Reels aligns with your brand voice. Consider using it in your next video."

**Why it matters**: Market research identified "Real-Time Trend Response" as a Tier 3 opportunity. While a full trend-response workflow is post-MVP, surfacing trends is achievable for MVP and gives users a discovery engine no affordable tool provides.

**Acceptance Criteria**:
- [ ] Trend Radar section accessible from dashboard and content creation view
- [ ] Shows trending topics for platforms the user has connected
- [ ] Trending items relevant to user's niche (based on their content history and categories)
- [ ] Each trend shows: topic/hashtag, platform(s), volume indicator, trend direction (rising/stable/falling)
- [ ] "Create post about this" button generates an AI draft based on the trend
- [ ] Refreshes daily
- [ ] User can configure niche/topics of interest for better relevance

---

## 4. Features Deferred to Post-MVP (v2+)

The following features are intentionally excluded from the MVP. Each exclusion is deliberate and documented to prevent scope creep and to set expectations with stakeholders.

| Feature | Target Version | Reasoning for Deferral |
|---------|---------------|----------------------|
| **Social Commerce Integration** (TikTok Shop, Instagram Shop, inventory sync) | v2.0 | Tier 1 market opportunity but requires complex platform partnerships, inventory management infrastructure, and commerce-specific APIs. MVP focus is content scheduling; commerce is a separate product vertical to layer on once the core is solid. |
| **Advanced Competitor Intelligence** (track competitor accounts, benchmark against competitors, strategy analysis) | v2.0 | Requires significant data collection infrastructure and potential scraping/API challenges. Content Intelligence (analyzing the user's own data) comes first; competitor analysis layers on top. |
| **White-Label / Agency Portal** (custom branding, client-facing portals, sub-workspaces) | v2.5 | Agency Alex is a target persona, but the MVP serves them through multi-account management and exportable reports. Full white-label requires multi-tenancy architecture changes that should not be shoe-horned into MVP. |
| **Public API for Third-Party Integrations** | v2.5 | Building and maintaining a public API requires documentation, versioning, rate limiting, developer portal, and support infrastructure. Internal APIs come first; public exposure after the product stabilizes. |
| **Creator Monetization Tracking** (track earnings, eligibility thresholds across platforms) | v2.0 | Identified as a Tier 2 market gap with zero competition. Requires integration with platform earning APIs which are inconsistent and restricted. Planned as a major v2 differentiator. |
| **Advanced Video Generation** (text-to-video, AI video editing, multi-clip assembly) | v3.0 | High technical complexity (AI video models, rendering pipeline, storage). MVP includes AI image generation; video generation requires specialized infrastructure. PostSyncer claims video generation but quality is limited -- SocialSpark should not ship until it can do it well. |
| **Live Shopping Integration** (live stream scheduling, product tagging in live video) | v3.0 | Requires real-time streaming infrastructure entirely separate from the content scheduling pipeline. Deferred until social commerce foundation is built in v2. |
| **Multi-Workspace** (manage multiple brands/clients in separate workspaces under one login) | v2.0 | MVP supports multiple accounts per platform within a single workspace. Multi-workspace (completely separate environments per client) is an architecture expansion suited for v2 after validating demand from Agency Alex persona. |
| **DM Inbox Integration** (read and reply to direct messages from unified inbox) | v2.0 | Platform DM APIs are restrictive (Instagram requires approved app, X has tiered API access). Comments and mentions are achievable for MVP; DMs require additional API approvals and compliance work. |
| **Multi-Level Approval Workflows** (multiple approval stages, external client approvals without login) | v2.0 | MVP includes single-level approval (sufficient for small teams). Multi-level (manager -> director -> client) is a Planable-competitive feature better suited for v2 when team features are validated. |
| **A/B Testing** (publish two variants, measure which performs better) | v2.0 | Valuable but adds significant complexity to the publishing pipeline (variant selection, traffic splitting, statistical significance). Deferred until core publishing is battle-tested. |
| **Content Repurposing Engine** (auto-convert blog post to social thread, video to clips, podcast to quotes) | v2.0 | Beyond platform adaptation (which is MVP). Full repurposing involves parsing long-form content, extracting key points, and generating multiple format outputs. Layer on top of the AI engine once it is proven. |
| **Mobile App** (native iOS/Android) | v2.0 | MVP is web-first (responsive). Mobile app is a high-effort deliverable (two platforms, app store approval, push notifications). Web responsive covers mobile reading use cases; native app for mobile-first creation workflow comes in v2. |

---

## 5. Pricing Strategy

### Competitive Pricing Landscape

Before defining SocialSpark pricing, here is where the market sits (from research):

| Tier | Competitors | Price Range |
|------|------------|-------------|
| Free (generous) | Buffer (30 posts/month), Publer (10 pending posts) | $0 |
| Budget entry | Publer ($12/mo), Buffer Starter ($6/mo/channel) | $6-15/mo |
| Mid-market standard | SocialBee ($29), Pallyy ($25), Later ($25), Sendible ($29) | $25-35/mo |
| Mid-market team | Planable ($33), Loomly ($32), SocialBee Accelerate ($49) | $32-50/mo |
| Premium | Hootsuite ($99), Agorapulse ($99), SocialBee Pro ($99) | $99+/mo |
| Enterprise | Sprout Social ($199+/user), Hootsuite Team ($249) | $199-500+/mo |

### SocialSpark Pricing Tiers

#### Free Tier -- "Spark"

**Purpose**: User acquisition and product-led growth. Must be generous enough that Solo Sam can genuinely use it as their primary tool, creating habit and dependency before they need to upgrade.

| Attribute | Included |
|-----------|----------|
| **Price** | $0/month |
| **Social accounts** | 3 (across any platforms) |
| **Scheduled posts/month** | 30 per account (90 total) |
| **AI content generations/month** | 20 |
| **AI image generations/month** | 5 |
| **Platform adaptation** | Yes (core differentiator -- must be free to prove value) |
| **Team members** | 1 (solo only) |
| **Analytics** | 30-day history, basic metrics |
| **Unified inbox** | View only (no reply from inbox) |
| **Media library storage** | 500 MB |
| **Evergreen posts** | Up to 10 |
| **Queue slots** | Up to 3 per platform |
| **Templates** | 5 custom + all starter templates |
| **Brand voice profiles** | 1 |
| **Bulk scheduling** | Not included |
| **Approval workflow** | Not included |
| **Reports** | Not included |
| **Support** | Community + knowledge base |

**Justification**: More generous than Publer free (10 pending posts) but comparable to Buffer free (30 posts/month per channel). The critical differentiator -- AI platform adaptation -- is available on free to ensure every user experiences the core value proposition. AI generation limits encourage upgrade when usage increases.

---

#### Pro Tier -- "Ignite"

**Purpose**: The primary revenue tier for Solo Sam and Agency Alex. All features unlocked at a price point that undercuts SocialBee ($29) and Pallyy ($25) while offering more AI capability.

| Attribute | Included |
|-----------|----------|
| **Price** | **$19/month** (annual) / $24/month (monthly) |
| **Social accounts** | 10 (across any platforms) |
| **Scheduled posts/month** | Unlimited |
| **AI content generations/month** | 100 |
| **AI image generations/month** | 30 |
| **Platform adaptation** | Unlimited |
| **Team members** | 1 |
| **Analytics** | 12-month history, full metrics, Content Intelligence |
| **Unified inbox** | Full (view + reply) |
| **Media library storage** | 5 GB |
| **Evergreen posts** | Unlimited |
| **Queue slots** | Unlimited |
| **Templates** | Unlimited |
| **Brand voice profiles** | 5 |
| **Bulk scheduling** | CSV upload up to 200 posts |
| **Approval workflow** | Not included (solo plan) |
| **Reports** | Exportable PDF/CSV, 1 scheduled report |
| **Trend Radar** | Yes |
| **Support** | Email (48hr response) |

**Justification**: At $19/month, SocialSpark Pro undercuts SocialBee ($29), Later ($25), and Pallyy ($25) while offering AI adaptation that none of them have. Unlimited scheduling matches Publer ($12) and Pallyy ($25). 10 social accounts matches Vista Social and exceeds Buffer. The value proposition is: "Everything you get from Publer + Later + ChatGPT, in one tool, for $19/month."

---

#### Team Tier -- "Blaze"

**Purpose**: For Team Tara and growing Agency Alex. Unlocks collaboration features and higher limits. Priced below Hootsuite ($99) and Planable ($33) while offering more AI and more platforms.

| Attribute | Included |
|-----------|----------|
| **Price** | **$49/month** (annual) / $59/month (monthly) -- includes 3 team members |
| **Additional members** | $12/month per additional member |
| **Social accounts** | 25 (across any platforms) |
| **Scheduled posts/month** | Unlimited |
| **AI content generations/month** | 500 |
| **AI image generations/month** | 100 |
| **Platform adaptation** | Unlimited |
| **Team members** | 3 included (up to 10 total) |
| **Analytics** | Unlimited history, full metrics, Content Intelligence, cross-platform comparison |
| **Unified inbox** | Full (view + reply + assign to team member) |
| **Media library storage** | 25 GB |
| **Evergreen posts** | Unlimited |
| **Queue slots** | Unlimited |
| **Templates** | Unlimited + team-shared templates |
| **Brand voice profiles** | 15 |
| **Bulk scheduling** | CSV upload up to 500 posts |
| **Approval workflow** | Full (draft -> review -> approved -> scheduled) |
| **Reports** | White-labeled PDF/CSV, unlimited scheduled reports, shareable client links |
| **Trend Radar** | Yes + team alerts |
| **Activity log** | Full (1-year retention) |
| **Support** | Priority email (24hr response) + live chat |

**Justification**: At $49/month for 3 users, SocialSpark Team costs less than Hootsuite Professional ($99/month for 1 user) and Sprout Social ($199/month per user). It includes approval workflows (Planable's core feature at $33/month) plus AI content engine + unified inbox. For a 3-person team, the total cost comparison:

| Tool | 3-Person Team Cost | AI Content | Unified Inbox | Approvals |
|------|-------------------|------------|---------------|-----------|
| **SocialSpark Blaze** | **$49/mo** | **Yes (500/mo)** | **Yes** | **Yes** |
| Hootsuite Team | $249/mo | Limited | Yes | Yes |
| Sprout Social | $597/mo (3 users) | No | Yes | Yes |
| Buffer Team | $27/mo (3 channels) | Basic | No | No |
| SocialBee | $99/mo | Yes | No | Limited |
| Planable | $99/mo (3 users) | Basic | No | Yes |

SocialSpark Blaze offers the most complete feature set for small teams at a fraction of the enterprise tool cost.

---

### Pricing Principles

1. **AI adaptation is always free**: The primary differentiator must be experienced on every tier to drive word-of-mouth and conversion. Limit the number of AI generations, not the adaptation feature itself.

2. **No per-user pricing on Pro**: Solo creators should not pay per seat. Team tier introduces per-user pricing only beyond the included 3 members.

3. **Generous free tier for product-led growth**: Free users are the top of the funnel. A free user who experiences AI adaptation becomes an evangelist. Conversion to paid happens when they hit account limits or need team features.

4. **Annual discount but not punishing monthly**: The 20% annual discount is meaningful but monthly pricing is not inflated to punish monthly users. Trust builds long-term retention better than lock-in.

5. **Transparent, no hidden add-ons**: Unlike Hootsuite (social listening add-on), Sprout Social (premium analytics add-on, listening add-on), SocialSpark includes all features in the tier price. No surprise invoices.

---

## Appendix: Technical Constraints & Dev Approach

### Development Context

- **Team**: Solo developer with AI coding assistance
- **Priority**: Reliability, testability, and ability to scale incrementally
- **Implication**: Features must be designed for incremental delivery. The MVP can ship feature categories in phases (e.g., scheduling + AI engine first, team collaboration + inbox second) while maintaining a coherent user experience at each phase.

### MVP Phased Rollout Recommendation

| Phase | Features | Target Timeline |
|-------|----------|----------------|
| **Phase 1: Core Loop** | Auth, platform connections, AI content generation, AI adaptation, editor, basic scheduling, auto-publishing | Foundation |
| **Phase 2: Calendar & Queue** | Visual calendar, drag-and-drop, queue system, bulk scheduling, timezone support, evergreen recycling | +4-6 weeks |
| **Phase 3: Intelligence** | Analytics dashboard, post performance, Content Intelligence, best posting times, Trend Radar, brand voice learning | +4-6 weeks |
| **Phase 4: Collaboration** | Team invites, roles, approval workflow, comments, activity log, unified inbox | +4-6 weeks |

### Platform API Dependencies & Risks

| Platform | API Maturity | Risk Level | Notes |
|----------|-------------|------------|-------|
| Instagram (Meta) | Mature | Low | Well-documented, stable. Requires Meta app review. |
| Facebook (Meta) | Mature | Low | Same as Instagram (unified Meta API). |
| X/Twitter | Unstable | Medium | API tiers changed multiple times post-acquisition. Basic tier ($100/month) needed for posting. Monitor for changes. |
| LinkedIn | Mature | Low | Good documentation. Company page posting requires LinkedIn Marketing API approval. |
| TikTok | Maturing | Medium | Content posting API available. Analytics API evolving. |
| YouTube | Mature | Low | Data API v3 well-documented. Quota limits require management. |
| Threads | Early | High | Meta's Threads API is new (launched 2024). Feature coverage still limited. May not support all inbox features. |
| Pinterest | Mature | Low | Well-documented API. Board management well-supported. |
| Bluesky | Early | High | AT Protocol is open but evolving. No official scheduling API. Direct posting via app password or OAuth. |
| Mastodon | Stable | Medium | ActivityPub-based, instance-dependent. Each Mastodon instance is separate. API is stable but varies by version. |

### Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Page load time | < 2 seconds (P95) |
| Post publishing latency | < 60 seconds from scheduled time |
| API uptime | 99.9% (43 minutes downtime/month max) |
| Data encryption | AES-256 at rest, TLS 1.3 in transit |
| Token storage | Encrypted, never exposed to frontend |
| Concurrent users | Support 1,000+ simultaneous users at launch |
| Database | Horizontally scalable (managed PostgreSQL or equivalent) |
| Background jobs | Reliable job queue with retry logic (e.g., BullMQ, SQS) |
| Testing | >80% code coverage; E2E tests for all publishing flows |
| Monitoring | Error tracking, performance monitoring, publishing success rate dashboard |

---

*This document is a living specification. It will be updated as user research, technical feasibility assessments, and market conditions evolve. All acceptance criteria are subject to refinement during sprint planning.*

**Last updated**: February 12, 2026
