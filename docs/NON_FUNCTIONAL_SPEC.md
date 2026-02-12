# SocialSpark Non-Functional Specification

> **Version:** 1.0
> **Last Updated:** 2026-02-12
> **Status:** Draft
> **Audience:** Engineering, Product, Operations

---

## Table of Contents

1. [Performance Requirements](#1-performance-requirements)
2. [Scalability](#2-scalability)
3. [Reliability & Availability](#3-reliability--availability)
4. [Security](#4-security)
5. [Data Privacy & Compliance](#5-data-privacy--compliance)
6. [Accessibility](#6-accessibility)
7. [Testability](#7-testability)
8. [Observability](#8-observability)
9. [Maintainability](#9-maintainability)
10. [Deployment & Infrastructure](#10-deployment--infrastructure)
11. [Internationalization](#11-internationalization)

---

## 1. Performance Requirements

### 1.1 Page Load Times

| Metric | Target | Measurement Method |
|--------|--------|--------------------|
| First Contentful Paint (FCP) | < 1.2s | Lighthouse, Web Vitals |
| Largest Contentful Paint (LCP) | < 2.5s | Lighthouse, Web Vitals |
| Time to Interactive (TTI) | < 3.5s | Lighthouse |
| Cumulative Layout Shift (CLS) | < 0.1 | Lighthouse, Web Vitals |
| First Input Delay (FID) | < 100ms | Web Vitals |
| Subsequent Page Navigation (SPA) | < 300ms | Custom instrumentation |

- Initial page load budget: **< 200 KB** compressed JavaScript, **< 50 KB** compressed CSS.
- Critical rendering path must complete within **1.5s** on a 4G connection (simulated 9 Mbps down, 1.5 Mbps up, 170ms RTT).
- Static assets must be served from a CDN with edge caching; cache-hit ratio target: **> 95%**.

### 1.2 API Response Times

| Endpoint Category | p50 | p95 | p99 |
|-------------------|-----|-----|-----|
| Read (GET lists, details) | < 100ms | < 250ms | < 500ms |
| Write (POST/PUT/PATCH) | < 150ms | < 400ms | < 800ms |
| Delete | < 100ms | < 300ms | < 600ms |
| Search and filter | < 200ms | < 500ms | < 1s |
| Authentication flows | < 200ms | < 500ms | < 1s |
| File upload initiation | < 300ms | < 700ms | < 1.5s |
| Bulk operations (up to 50 items) | < 500ms | < 1.5s | < 3s |

All response time targets are measured at the application boundary (excluding network transit to the client).

### 1.3 AI Generation Response Times

| Operation | Target | Strategy |
|-----------|--------|----------|
| Caption generation (single) | < 3s | Direct LLM call with streaming |
| Content adaptation (single post to multiple platforms) | < 5s | Parallel LLM calls |
| Hashtag suggestions | < 2s | Cached model + LLM fallback |
| Content calendar suggestions (week) | < 8s | Background pre-computation + streaming |
| Image alt-text generation | < 4s | Vision model call |
| Bulk content generation (10 posts) | < 15s | Parallel execution with streaming |

- All AI operations must support **streaming responses** so the UI can render progressive output.
- AI requests must have a hard **timeout of 30s**; if exceeded, return partial results or a graceful error.
- AI responses must be **cached** when inputs are identical; cache TTL: 1 hour.

### 1.4 Calendar Rendering

| Scenario | Target |
|----------|--------|
| Initial calendar load (current month, up to 200 posts) | < 500ms render |
| Calendar with 1,000+ posts (month view) | < 1s render |
| Calendar with 1,000+ posts (week view) | < 500ms render |
| Drag-and-drop reschedule (single post) | < 100ms visual feedback, < 300ms persistence |
| Switching between month/week/day views | < 300ms |
| Infinite scroll load (next month batch) | < 400ms |

- Calendar must use **virtualized rendering** for large post counts; only visible cells are rendered in the DOM.
- Post data for the calendar must be fetched with **pagination** (per-month or per-week chunks) rather than loading all posts at once.
- Calendar state changes (filters, date range) must be **debounced** at 150ms to prevent excessive re-renders.

### 1.5 Media Upload Throughput

| Metric | Target |
|--------|--------|
| Single image upload (up to 10 MB) | < 3s on 50 Mbps connection |
| Single video upload (up to 500 MB) | Streaming upload with progress; initiation < 1s |
| Batch image upload (up to 20 images) | Parallel upload (max 4 concurrent); total < 15s |
| Upload resume after interruption | Supported via chunked/resumable uploads |
| Media processing (thumbnail, resize) | < 5s per image, < 30s per video (background) |

- All uploads must use **chunked/resumable upload protocol** (e.g., tus or similar).
- Chunk size: **5 MB** default, adjustable based on connection quality.
- Client must display real-time progress percentage and estimated time remaining.
- Uploads must continue in the background if the user navigates away within the SPA.

### 1.6 Search and Filter Response Times

| Operation | Target |
|-----------|--------|
| Full-text post search | < 300ms for up to 50K posts |
| Filter by platform, status, date range | < 200ms |
| Combined search + filter | < 400ms |
| Autocomplete suggestions | < 150ms |
| Search result pagination (next page) | < 200ms |

- Search must use an **indexed search engine** (e.g., PostgreSQL full-text search at launch, migrating to Elasticsearch/Meilisearch if needed at scale).
- Filter queries must use **database indexes** on all filterable columns.
- Autocomplete must be **debounced** at 200ms on the client side.

### 1.7 Concurrent User Capacity

| Milestone | Concurrent Users | Requests per Second | Timeline |
|-----------|-----------------|---------------------|----------|
| Launch (MVP) | 100 | 500 | Month 0 |
| 6 months | 500 | 2,500 | Month 6 |
| 1 year | 2,000 | 10,000 | Month 12 |
| 2 years | 5,000 | 25,000 | Month 24 |

- "Concurrent users" defined as users with at least one active request or WebSocket connection in a 5-minute window.
- The system must maintain all response time SLAs at the stated concurrent user levels.
- Load testing must validate these targets before each milestone.

---

## 2. Scalability

### 2.1 Horizontal Scaling Strategy

**Application Tier:**

- The API server must be **stateless**; all session and user state stored externally (database, Redis, object storage).
- Application instances must be horizontally scalable behind a load balancer with no code changes.
- Auto-scaling rules:
  - Scale up when average CPU > 70% for 3 minutes or average response time p95 > 400ms.
  - Scale down when average CPU < 30% for 10 minutes and response time p95 < 200ms.
  - Minimum instances: 2 (for redundancy). Maximum instances: 20 (with override capability).
- Scaling cooldown: 3 minutes between scale-up events, 5 minutes between scale-down events.

**Worker Tier (Background Jobs):**

- Worker processes must be independently scalable from the API tier.
- Workers must be horizontally scalable by adding more consumer instances.
- Auto-scaling rules for workers:
  - Scale up when queue depth > 1,000 jobs or oldest job age > 2 minutes.
  - Scale down when queue depth < 100 jobs for 10 minutes.
- Minimum worker instances: 2. Maximum: 10.

### 2.2 Database Scaling Approach

**Phase 1 (0-10K users): Vertical Scaling + Read Replicas**

- Primary PostgreSQL instance with sufficient resources for the workload.
- One read replica for analytics queries, reporting, and read-heavy dashboard endpoints.
- Connection pooling via PgBouncer (max 200 connections per pool).

**Phase 2 (10K-50K users): Read Replica Expansion + Partitioning**

- Add additional read replicas (up to 3) for geographic distribution.
- Implement table partitioning on high-volume tables:
  - `posts` table: partition by `created_at` (monthly).
  - `analytics_events` table: partition by `event_date` (weekly).
  - `audit_logs` table: partition by `created_at` (monthly).
- Archive data older than 24 months to cold storage.

**Phase 3 (50K-100K+ users): Evaluate Sharding or Managed Service Migration**

- Evaluate migration to a managed database service with automatic scaling.
- If self-managed, implement application-level sharding by `team_id`.
- Introduce a caching layer (Redis) for frequently accessed data:
  - User profiles and team settings: TTL 5 minutes.
  - Post metadata: TTL 2 minutes.
  - Platform connection status: TTL 1 minute.

### 2.3 Queue and Job Processing Scaling

**Queue Architecture:**

- Use a dedicated message queue system (e.g., Redis-backed BullMQ, or a managed service like SQS/Cloud Tasks).
- Separate queues by priority and type:

| Queue | Priority | Max Concurrency per Worker | Use Case |
|-------|----------|---------------------------|----------|
| `scheduled-publish` | Critical | 10 | Publishing posts at scheduled times |
| `platform-sync` | High | 5 | Syncing analytics, refreshing tokens |
| `media-processing` | Medium | 3 | Thumbnail generation, video transcoding |
| `ai-generation` | Medium | 5 | AI content generation tasks |
| `analytics` | Low | 10 | Aggregating analytics data |
| `notifications` | Low | 10 | Email, in-app notifications |
| `cleanup` | Low | 2 | Data archival, temp file cleanup |

**Scaling Rules:**

- Each queue must be independently monitorable for depth, processing rate, and error rate.
- Dead letter queues (DLQ) for each queue; jobs moved to DLQ after max retries.
- Job deduplication: prevent duplicate scheduled-publish jobs via idempotency keys.

### 2.4 Media Storage Scaling

- Use **object storage** (e.g., S3, GCS, R2) for all media files.
- Storage tiers:
  - **Hot storage:** Active media (referenced by posts in the last 6 months). Standard storage class.
  - **Cool storage:** Older media (6-24 months). Infrequent Access storage class.
  - **Archive:** Media older than 24 months. Archive storage class.
- Lifecycle policies for automatic tier transitions.
- CDN integration for media delivery; cache TTL: 30 days for images, 7 days for videos.
- Target media storage cost: < $0.02/GB/month blended across tiers.
- Maximum single file size: 500 MB (video), 25 MB (image).
- Per-team storage quota at launch: 10 GB (free), 100 GB (pro), 500 GB (business). Quotas are configurable.

### 2.5 API Rate Limit Management Across Users

**Internal Rate Limiting (SocialSpark API):**

| Plan | Requests/min | Requests/day | Concurrent Connections |
|------|-------------|--------------|----------------------|
| Free | 60 | 10,000 | 5 |
| Pro | 300 | 100,000 | 20 |
| Business | 600 | 500,000 | 50 |

**External Platform Rate Limit Management:**

- Maintain a **rate limit budget tracker** per platform per user, updated in real-time.
- Before each API call to a platform, check the remaining budget; if near the limit (< 10% remaining), queue the request for later.
- Implement **token bucket** or **sliding window** rate limiting per platform:
  - Track `X-RateLimit-Remaining` and `X-RateLimit-Reset` headers from each platform.
  - Store rate limit state in Redis with TTL matching the platform reset window.
- When a platform returns 429 (Too Many Requests):
  - Parse `Retry-After` header.
  - Exponential backoff: 1s, 2s, 4s, 8s, max 60s.
  - Move subsequent requests for that platform+user to a delay queue.
- **Fair queuing** across users: no single user's requests may consume more than 20% of the global budget for any platform.
- Rate limit status must be visible to users in the UI (e.g., "Instagram: 80% of hourly limit used").

### 2.6 Growth Targets

| Milestone | Total Users | Active Teams | Posts/Month | Media Storage |
|-----------|------------|--------------|-------------|---------------|
| Launch | 500 | 100 | 10,000 | 50 GB |
| 6 months | 3,000 | 600 | 75,000 | 500 GB |
| 1 year | 10,000 | 2,000 | 300,000 | 2 TB |
| 2 years | 100,000 | 20,000 | 3,000,000 | 20 TB |

- Architecture decisions must be validated against the 2-year target; no redesign should be required before that point.
- Quarterly capacity planning reviews to adjust scaling strategy based on actual growth.

---

## 3. Reliability & Availability

### 3.1 Uptime SLA Targets

| Component | Target Uptime | Maximum Downtime/Month | Maximum Downtime/Year |
|-----------|---------------|------------------------|-----------------------|
| Core API | 99.9% | 43 minutes | 8.7 hours |
| Scheduled Publishing Engine | 99.95% | 22 minutes | 4.4 hours |
| Web Application | 99.9% | 43 minutes | 8.7 hours |
| Media Upload/Processing | 99.5% | 3.6 hours | 1.8 days |
| AI Features | 99.0% | 7.3 hours | 3.6 days |

- Uptime is calculated as the percentage of time the system responds to health check probes with a 2xx status within 5 seconds.
- Planned maintenance windows are excluded from SLA calculations if announced 48+ hours in advance.
- Scheduled publishing has the highest uptime target because it is the core value promise.

### 3.2 Scheduled Post Delivery Guarantee

This is the single most critical reliability requirement. A missed or late scheduled post directly breaks user trust.

**Delivery Timing:**

| Metric | Target |
|--------|--------|
| On-time delivery (within +/- 60 seconds of scheduled time) | > 99.9% |
| Maximum acceptable delay | 5 minutes |
| Posts delivered within 5 minutes of scheduled time | > 99.99% |

**Architecture for Reliability:**

- **Dual-trigger system:** Both a cron-based scheduler (polling every 30 seconds) and an event-driven scheduler (timer/delayed job) must independently trigger scheduled posts. If one fails, the other catches it.
- **Pre-flight checks** run 10 minutes before scheduled time:
  - Validate platform token is still active.
  - Validate media assets are accessible.
  - Validate content meets platform requirements (character limits, aspect ratios).
  - If pre-flight fails, notify the user immediately and mark the post for manual review.
- **Publish lock:** A distributed lock (Redis-based with TTL) prevents duplicate publishes of the same post.
- **Publish confirmation:** After sending to the platform API, poll for confirmation (or wait for webhook) that the post was published. If unconfirmed after 60 seconds, retry.
- **Dead man's switch:** If no scheduled posts have been processed in 10 minutes and there are posts due, trigger a critical alert.

### 3.3 Retry Policies for Failed Publishes

| Retry Attempt | Delay | Condition |
|---------------|-------|-----------|
| 1st | 30 seconds | Immediate retry for transient errors (5xx, timeout, network error) |
| 2nd | 2 minutes | |
| 3rd | 10 minutes | |
| 4th | 30 minutes | |
| 5th | 1 hour | |
| Final | Manual | Move to "failed" state; notify user |

**Retry Rules:**

- **Do not retry** on 4xx errors (except 429). These indicate content/auth issues that require user action.
- **429 errors:** Retry after the `Retry-After` duration specified by the platform.
- **Token expiration (401):** Attempt an automatic token refresh; if refresh fails, notify user and halt retries.
- **Partial success** (e.g., posted to 3 of 5 platforms): Mark successful platforms as "published"; retry only the failed platforms.
- Each retry attempt is logged with full context (error code, response body, platform, timestamp).
- Users can manually retry failed posts from the UI at any time.

### 3.4 Graceful Degradation

When external platform APIs are unavailable:

| Platform Status | SocialSpark Behavior |
|----------------|---------------------|
| Platform API down | Queue posts for later; show "Platform Experiencing Issues" banner |
| Platform API slow (> 10s response) | Increase timeout to 30s; add to slow-publish queue |
| Platform API returning errors (> 50% error rate) | Circuit breaker opens; queue all posts; check every 2 minutes |
| Platform auth/token issues | Notify user; pause scheduled posts for that platform; retry token refresh |

**Circuit Breaker Configuration:**

- **Closed:** Normal operation.
- **Open:** Triggered when error rate > 50% over a 5-minute window (minimum 10 requests). All requests to the platform are queued, not sent.
- **Half-open:** After 2 minutes, allow 3 test requests. If 2/3 succeed, close the breaker. If not, remain open for another 2 minutes.

**Feature Degradation Priority** (when under stress, degrade in this order):

1. Analytics data collection (degrade first -- least user impact).
2. AI content generation (return cached results or "temporarily unavailable").
3. Media processing (queue for later; accept uploads but delay processing).
4. Notifications (queue for later delivery).
5. Scheduled publishing (degrade last -- this is the core promise).

### 3.5 Data Backup Strategy

| Data Type | Backup Frequency | Retention | Storage |
|-----------|-----------------|-----------|---------|
| PostgreSQL (full) | Daily at 02:00 UTC | 30 days | Object storage, separate region |
| PostgreSQL (incremental/WAL) | Continuous (streaming replication) | 7 days | Object storage |
| Redis (RDB snapshot) | Every 6 hours | 7 days | Object storage |
| Media files (object storage) | Cross-region replication (continuous) | Same as source | Separate region |
| Configuration and secrets | On every change | 90 days | Encrypted object storage |

- **Recovery Point Objective (RPO):** < 1 hour for database, < 5 minutes for critical tables (posts, scheduled jobs).
- **Recovery Time Objective (RTO):** < 4 hours for full system restoration, < 30 minutes for database failover to replica.
- Backups must be **tested monthly** with a full restore to a staging environment.
- Backup encryption: AES-256 at rest; TLS 1.3 in transit.

### 3.6 Disaster Recovery Plan

**Failure Scenarios and Responses:**

| Scenario | Detection | Response | RTO |
|----------|-----------|----------|-----|
| Single instance failure | Health check (30s) | Auto-replace via orchestrator | < 2 minutes |
| Database primary failure | Replication lag alert | Promote read replica to primary | < 5 minutes |
| Full region outage | Multi-region health probe | Failover to standby region (Phase 2+) | < 30 minutes |
| Data corruption | Integrity checks, user reports | Point-in-time recovery from WAL | < 1 hour |
| Security breach | IDS alerts, anomaly detection | Isolate, assess, restore from clean backup | < 4 hours |
| Queue system failure | Queue depth/age monitoring | Switch to fallback queue or direct processing | < 10 minutes |

**Phase 1 (Launch):** Single-region with multi-AZ deployment. Automated failover within the region.
**Phase 2 (10K+ users):** Warm standby in a secondary region. DNS failover with < 5 minute TTL.
**Phase 3 (50K+ users):** Active-active multi-region with geo-routed traffic.

- Disaster recovery drills must be conducted **quarterly**.
- Runbook documentation for each scenario must be maintained and version-controlled.

### 3.7 Monitoring and Alerting

See [Section 8: Observability](#8-observability) for detailed monitoring, alerting, and dashboard requirements.

**Critical Alerts (page on-call immediately):**

- Scheduled post delivery failure rate > 1% in any 5-minute window.
- API error rate (5xx) > 5% in any 5-minute window.
- Database replication lag > 30 seconds.
- Queue depth growing for > 5 minutes with no processing.
- Health check failures on any production instance.
- Disk usage > 90% on any production system.
- SSL certificate expiry within 14 days.

---

## 4. Security

### 4.1 Authentication

**JWT + Refresh Token Strategy:**

- **Access tokens:** Short-lived (15 minutes), signed with RS256, stored in memory only (never localStorage).
- **Refresh tokens:** Long-lived (7 days), stored in HTTP-only secure cookies with `SameSite=Strict`.
- **Token rotation:** Every refresh token use issues a new refresh token and invalidates the old one (rotation).
- **Token revocation:** Maintain a server-side blocklist (Redis) for revoked access tokens; check on every request.
- **Device tracking:** Each refresh token is bound to a device fingerprint; suspicious device changes trigger re-authentication.
- Maximum concurrent sessions per user: 5. Oldest session is revoked when the limit is exceeded.

**OAuth 2.0 (for platform connections):**

- Implement OAuth 2.0 Authorization Code flow with PKCE for all social media platform integrations.
- Store access and refresh tokens encrypted in the database (see Section 4.5).
- Automatic token refresh 10 minutes before expiry.
- Token refresh failures trigger user notification and pause scheduled posts for that platform.
- Each platform connection must track: token expiry, scopes granted, last successful API call, error state.

**Additional Auth Requirements:**

- Password requirements: minimum 10 characters, checked against the HaveIBeenPwned breached password list (k-Anonymity API).
- Multi-factor authentication (MFA) via TOTP (e.g., Google Authenticator, Authy). Optional at launch, required for team admin roles.
- Account lockout after 10 failed login attempts in 15 minutes; unlock via email link or 30-minute cooldown.
- Login anomaly detection: alert users on login from a new device, location, or IP range.

### 4.2 Authorization (RBAC)

**Role Hierarchy:**

| Role | Permissions |
|------|------------|
| Owner | Full access, billing, delete team, manage all members |
| Admin | Manage members (except Owner), manage all content, manage platform connections, view analytics |
| Editor | Create/edit/schedule own and assigned content, view team analytics |
| Viewer | View content, view analytics, comment (no edit/publish) |

**Authorization Rules:**

- All API endpoints must enforce authorization checks at the handler level.
- Team-level data isolation: a user must never access data belonging to a team they are not a member of.
- Resource-level permissions: Editors can only modify their own content unless explicitly assigned as a collaborator.
- Platform connection management restricted to Admin and Owner roles.
- Billing management restricted to Owner role.
- Role changes must be audit-logged.
- A team must always have at least one Owner; the last Owner cannot be removed or downgraded.

### 4.3 Data Encryption

**In Transit:**

- All external communication over TLS 1.3 (minimum TLS 1.2).
- HSTS header with `max-age=31536000; includeSubDomains; preload`.
- Certificate pinning for mobile clients (future consideration).
- Internal service-to-service communication encrypted via mTLS or VPC private networking.

**At Rest:**

- Database encryption at rest using AES-256 (managed by the cloud provider or self-managed LUKS).
- Object storage (media files) encrypted at rest using server-side encryption (SSE-S3/SSE-KMS equivalent).
- Redis data considered ephemeral; sensitive data (token blocklist) encrypted at the application layer before storage.
- Backups encrypted with AES-256; encryption keys stored separately from backup data.

### 4.4 Sensitive Field Encryption

Beyond full-disk encryption, certain fields require **application-level encryption**:

| Field | Encryption | Key Management |
|-------|-----------|---------------|
| Social platform access tokens | AES-256-GCM | Per-team encryption key, stored in vault |
| Social platform refresh tokens | AES-256-GCM | Per-team encryption key, stored in vault |
| User passwords | bcrypt (cost factor 12) | N/A (hashed, not encrypted) |
| MFA secrets | AES-256-GCM | Per-user encryption key, stored in vault |
| API keys (user-generated) | SHA-256 hash stored; full key shown once | N/A (hashed after first display) |

**Key Management:**

- Use a dedicated secrets manager (e.g., HashiCorp Vault, AWS KMS, GCP KMS).
- Encryption key rotation: every 90 days. Old keys retained for decryption of existing data; re-encryption on next access.
- Key access audit-logged.
- Application servers never persist encryption keys to disk; keys loaded into memory from the vault at startup.

### 4.5 OWASP Top 10 Compliance

| OWASP Category | Mitigation |
|---------------|------------|
| A01: Broken Access Control | RBAC enforcement on every endpoint; automated tests for authorization boundaries; default-deny policy |
| A02: Cryptographic Failures | TLS 1.3, AES-256 at rest, bcrypt for passwords, no sensitive data in URLs or logs |
| A03: Injection | Parameterized queries (ORM-enforced), input validation on all user inputs, output encoding |
| A04: Insecure Design | Threat modeling during design phase, security design reviews, abuse case testing |
| A05: Security Misconfiguration | Infrastructure as Code with security baselines, automated configuration scanning, no default credentials |
| A06: Vulnerable Components | Automated dependency scanning (Dependabot/Snyk), weekly vulnerability review, < 48 hour SLA for critical CVEs |
| A07: Authentication Failures | See Section 4.1; rate limiting on auth endpoints, breach password checking, MFA support |
| A08: Software/Data Integrity | Signed deployments, integrity checks on CI/CD pipeline, CSP to prevent script injection |
| A09: Logging/Monitoring Failures | Structured logging of security events, alerting on anomalies; see Section 8 |
| A10: Server-Side Request Forgery | URL allowlisting for outbound requests, no user-controlled URLs in server-side fetches, private IP blocking |

### 4.6 Rate Limiting and DDoS Protection

**Application-Level Rate Limiting:**

| Endpoint Category | Rate Limit | Window | Response |
|-------------------|-----------|--------|----------|
| Login | 10 requests | 15 minutes | 429 + lockout |
| Password reset | 3 requests | 1 hour | 429 + silent drop |
| API (authenticated, per-user) | See Section 2.5 | Per minute | 429 + Retry-After header |
| API (unauthenticated) | 20 requests | 1 minute | 429 |
| Webhook endpoints | 100 requests | 1 minute per source IP | 429 |
| File upload | 20 uploads | 1 hour per user | 429 |

**Infrastructure-Level DDoS Protection:**

- Deploy behind a cloud-based DDoS mitigation service (e.g., Cloudflare, AWS Shield).
- Geo-blocking capability for regions not served.
- IP reputation filtering.
- Automatic challenge (CAPTCHA) on suspicious traffic patterns.
- Rate limiting at the load balancer/reverse proxy layer as a first line of defense.

### 4.7 Input Validation and Sanitization

- **All user inputs** validated on both client and server side; server-side validation is authoritative.
- Use a schema validation library (e.g., Zod, Joi) for request body validation.
- Maximum input lengths enforced:
  - Post content: 10,000 characters (accommodates all platform limits).
  - Usernames: 50 characters.
  - Team names: 100 characters.
  - Search queries: 500 characters.
  - File names: 255 characters.
- HTML sanitization for any user-generated content rendered in the UI (DOMPurify or equivalent).
- File upload validation: MIME type verification (magic bytes, not just extension), virus scanning for all uploads.
- Reject null bytes, control characters, and excessively nested JSON (max depth: 10 levels).

### 4.8 Security Headers and Policies

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://cdn.socialspark.app https://*.platform-cdn.example; connect-src 'self' https://api.socialspark.app wss://api.socialspark.app; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';
```

| Header | Value |
|--------|-------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `0` (disabled in favor of CSP) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Cross-Origin-Resource-Policy` | `same-origin` |

**CORS Policy:**

- Allowed origins: `https://app.socialspark.app` (production), configurable per environment.
- Allowed methods: `GET, POST, PUT, PATCH, DELETE, OPTIONS`.
- Allowed headers: `Content-Type, Authorization, X-Request-ID`.
- Credentials: allowed (for cookie-based refresh tokens).
- Max age: 86400 seconds (24 hours).
- No wildcard origins in production.

### 4.9 Dependency Vulnerability Scanning

- **Automated scanning** on every pull request and daily on the main branch.
- Tools: Dependabot (or Renovate) for updates + Snyk (or GitHub Advanced Security) for vulnerability detection.
- **SLA for remediation:**
  - Critical (CVSS 9.0+): patch within 24 hours.
  - High (CVSS 7.0-8.9): patch within 7 days.
  - Medium (CVSS 4.0-6.9): patch within 30 days.
  - Low (CVSS < 4.0): patch in next scheduled maintenance.
- Lock files (`package-lock.json`, `pnpm-lock.yaml`, etc.) must be committed and reviewed.
- No `npm install` with `--ignore-scripts` in production builds without explicit review.

### 4.10 Audit Logging

**Events to Log:**

| Category | Events |
|----------|--------|
| Authentication | Login, logout, login failure, password change, MFA enable/disable, token refresh |
| Authorization | Permission denied, role change, team member added/removed |
| Data access | View/export of analytics, bulk data access, admin panel access |
| Data modification | Post create/edit/delete, platform connect/disconnect, team settings change |
| System | Configuration change, deployment, backup, manual job trigger |
| Security | Rate limit triggered, suspicious activity detected, IP blocked |

**Audit Log Requirements:**

- Audit logs are **append-only** and **immutable** in production.
- Stored in a separate database/table with restricted access (write: application only, read: admin + compliance roles).
- Retention: minimum 2 years.
- Each log entry includes: timestamp (UTC), actor (user ID), action, resource type, resource ID, IP address, user agent, result (success/failure), metadata (diff for modifications).
- Audit logs are excluded from user data deletion requests (legal basis: legitimate interest for security and compliance).

---

## 5. Data Privacy & Compliance

### 5.1 GDPR Compliance Requirements

SocialSpark must comply with the General Data Protection Regulation (GDPR) for all users, regardless of location, as a baseline privacy standard.

**Lawful Basis for Processing:**

| Data Category | Lawful Basis | Details |
|---------------|-------------|---------|
| Account data (email, name) | Contract | Necessary to provide the service |
| Post content and scheduling data | Contract | Core service functionality |
| Platform tokens | Contract | Required for platform integration |
| Usage analytics | Legitimate interest | Service improvement; opt-out available |
| Marketing emails | Consent | Explicit opt-in; easy unsubscribe |
| Cookies (non-essential) | Consent | Cookie consent banner with granular controls |

**Data Processing Principles:**

- **Purpose limitation:** Data collected only for specified, explicit purposes documented in the privacy policy.
- **Data minimization:** Collect only the data strictly necessary for each feature.
- **Storage limitation:** Data retained only as long as necessary (see Section 5.2).
- **Accuracy:** Provide mechanisms for users to view and correct their data.
- **Integrity and confidentiality:** Enforced by the security measures in Section 4.

**Data Processing Agreements (DPA):**

- DPAs must be in place with all sub-processors (cloud providers, AI providers, email services, analytics tools).
- Maintain and publish a list of sub-processors.
- Notify users 30 days before adding a new sub-processor.

### 5.2 Data Retention Policies

| Data Type | Retention Period | After Retention |
|-----------|-----------------|-----------------|
| Active user account data | Duration of account | Deleted per Section 5.4 |
| Post content (published) | Duration of account | Deleted on account deletion |
| Post content (draft, never published) | 6 months after last edit | Auto-deleted with 30-day warning |
| Analytics data (detailed) | 24 months | Aggregated and anonymized |
| Analytics data (aggregated) | Indefinite | N/A (no personal data) |
| Audit logs | 24 months minimum | Archived to cold storage for 5 years total |
| Platform tokens | Duration of connection | Immediately deleted on disconnect |
| Session data | 7 days after last activity | Auto-deleted |
| Media files | Duration of account | Deleted on account deletion |
| Support tickets | 24 months after resolution | Anonymized |
| Backup data | As per Section 3.5 | Rotated per backup policy |

- Users must be notified 30 days before any automatic data deletion.
- All retention policies must be documented in the privacy policy.

### 5.3 Right to Data Portability (Export)

- Users can request a full export of their data from the account settings page.
- Export must be available within **24 hours** of request (target: < 1 hour for accounts with < 10 GB data).
- Export format: **ZIP archive** containing:
  - `profile.json` -- user profile and settings.
  - `posts.json` -- all posts with content, scheduling data, platform metadata, and analytics.
  - `media/` -- all uploaded media files in original format.
  - `analytics.json` -- all analytics data in structured format.
  - `teams.json` -- team memberships and roles.
  - `connections.json` -- platform connection metadata (not tokens).
- Export files available for download for 7 days, then automatically deleted.
- Rate limit: 1 export request per 24 hours.
- Export must be downloadable over HTTPS with a time-limited signed URL.

### 5.4 Right to Erasure (Account Deletion)

**User-Initiated Deletion:**

- Available as a self-service option in account settings.
- **Soft delete** with a 30-day grace period during which the user can reactivate.
- During the grace period: all data retained but account inaccessible, scheduled posts paused, platform connections deactivated.
- After 30 days: **hard delete** all personal data:
  - User profile and credentials: deleted.
  - Posts and drafts: deleted.
  - Media files: deleted from object storage.
  - Analytics data: anonymized (aggregated data retained, personal identifiers removed).
  - Platform tokens: securely wiped.
  - Audit logs: retained (legal basis: legitimate interest) but user ID pseudonymized.
  - Backup data: marked for exclusion; fully purged within 90 days as backups rotate.

**Team Context:**

- If the user is the sole Owner of a team, they must transfer ownership or delete the team before deleting their account.
- Shared content (posts created by the user for a team) is reassigned to the team (ownership transferred to the team admin) unless the team is also being deleted.

### 5.5 Cookie Policy

| Cookie | Type | Purpose | Duration | Consent Required |
|--------|------|---------|----------|-----------------|
| `session_id` | Strictly necessary | Session management | Session | No |
| `refresh_token` | Strictly necessary | Authentication | 7 days | No |
| `csrf_token` | Strictly necessary | CSRF protection | Session | No |
| `preferences` | Functional | UI preferences (theme, locale) | 1 year | Yes |
| `analytics_id` | Analytics | Usage analytics | 1 year | Yes |

- Cookie consent banner must be displayed on first visit with granular options (necessary, functional, analytics).
- Consent choices stored and editable from account settings.
- No third-party tracking cookies.
- Cookie policy page must detail all cookies, their purpose, and duration.

### 5.6 Third-Party Data Processing

**Principles:**

- Minimize data shared with third parties to the absolute minimum required for functionality.
- Never sell user data.
- Never use user content for AI training without explicit, granular consent.

**Third-Party Categories and Data Shared:**

| Third Party | Data Shared | Purpose | DPA Required |
|-------------|-------------|---------|-------------|
| Social media platforms | Post content, media, scheduling metadata | Core functionality (publishing) | Yes (platform TOS) |
| AI/LLM provider | Post content (for generation) | AI content features | Yes |
| Cloud infrastructure | All data (as processor) | Hosting | Yes |
| Email service | Email address, name | Transactional emails | Yes |
| Payment processor | Email, billing address, payment method | Billing | Yes (PCI-DSS) |
| Error tracking | Error context (no PII by default) | Debugging | Yes |

- AI content generation: user content sent for AI processing must not be used for model training. Verify and enforce this contractually with the AI provider.
- All third-party integrations must be documented in the privacy policy.

### 5.7 Privacy by Design Principles

- **Default privacy:** New accounts default to the most private settings (analytics cookies off, public profile off).
- **Data minimization in code:** ORMs and query builders must select only required columns (`SELECT *` is forbidden in application code).
- **PII tagging:** Database columns containing PII must be tagged in the schema metadata for automated compliance tooling.
- **Log redaction:** PII (emails, names, IPs) must be automatically redacted or masked in application logs. Structured logging must support a `[REDACTED]` placeholder for sensitive fields.
- **Environment parity:** Test and staging environments must use **anonymized/synthetic data**, never production PII.
- **Privacy impact assessment:** Required before launching any new feature that collects or processes new categories of personal data.

---

## 6. Accessibility

### 6.1 WCAG 2.1 AA Compliance

SocialSpark must meet **WCAG 2.1 Level AA** conformance across all user-facing pages and components.

**Compliance Verification:**

- Automated accessibility scanning (axe-core or similar) integrated into the CI/CD pipeline; builds fail on Level A or AA violations.
- Manual accessibility audit by a qualified auditor before launch and annually thereafter.
- Accessibility statement published on the website documenting conformance level and known limitations.

### 6.2 Keyboard Navigation

- All interactive elements must be reachable and operable via keyboard alone (Tab, Shift+Tab, Enter, Space, Arrow keys, Escape).
- Focus order must follow a logical reading sequence (DOM order matches visual order).
- Focus indicators must be clearly visible (minimum 2px solid outline with sufficient contrast against the background, never `outline: none` without a visible replacement).
- Skip navigation link available on every page ("Skip to main content").
- Modal dialogs must trap focus and return focus to the trigger element on close.
- Calendar component must support keyboard navigation:
  - Arrow keys to move between dates.
  - Enter/Space to select or open a date.
  - Escape to close date pickers/popovers.
- Drag-and-drop interactions (e.g., rescheduling posts on the calendar) must have a keyboard-accessible alternative (e.g., a "Move to" action with a date picker).
- Custom keyboard shortcuts must not conflict with screen reader shortcuts and must be documented. All custom shortcuts must be toggleable.

### 6.3 Screen Reader Support

- All images must have descriptive `alt` text (or `alt=""` for decorative images).
- All form inputs must have associated `<label>` elements (or `aria-label`/`aria-labelledby`).
- Dynamic content updates must use ARIA live regions (`aria-live="polite"` for non-urgent updates, `aria-live="assertive"` for errors and confirmations).
- Custom components (dropdowns, modals, tabs, calendars) must use appropriate ARIA roles, states, and properties following the WAI-ARIA Authoring Practices.
- Page structure must use semantic HTML (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`) and proper heading hierarchy (no skipped levels).
- Status messages (success, error, loading) must be announced to screen readers without moving focus.
- Tables (if used) must have proper `<thead>`, `<th>` with `scope`, and `<caption>` elements.

### 6.4 Color Contrast Requirements

| Element | Minimum Contrast Ratio (AA) |
|---------|----------------------------|
| Normal text (< 18pt) | 4.5:1 |
| Large text (>= 18pt or >= 14pt bold) | 3:1 |
| UI components and graphical objects | 3:1 |
| Focus indicators | 3:1 against adjacent colors |

- Information must never be conveyed by color alone. Use icons, text labels, or patterns in addition to color (e.g., error states must use both red color and an error icon/text).
- Charts and graphs must use colorblind-safe palettes (avoid red/green as the only differentiator) and include patterns or labels.
- A high-contrast mode is recommended but not required for launch.

### 6.5 Responsive Design

**Breakpoints:**

| Device Category | Breakpoint | Layout |
|----------------|-----------|--------|
| Mobile | < 640px | Single column, bottom navigation |
| Tablet | 640px - 1024px | Two-column, side navigation (collapsible) |
| Desktop | > 1024px | Full layout, persistent side navigation |
| Large desktop | > 1440px | Full layout with wider content area |

**Requirements:**

- All features must be fully functional on mobile (no desktop-only features).
- Touch targets must be at minimum **44x44 CSS pixels** (WCAG 2.1 AA target size).
- Text must be readable without horizontal scrolling at 320px viewport width.
- Text must remain readable at 200% browser zoom without loss of content or functionality.
- Media queries must use relative units (`rem`, `em`) wherever possible.
- Critical user flows (create post, view calendar, check analytics) must be tested on the following devices (or equivalent emulators):
  - iPhone SE (375px), iPhone 14 Pro (393px), iPad (768px), iPad Pro (1024px), 1080p laptop (1920px).
- The calendar view must adapt to mobile with a day or agenda view (month grid is not required on mobile).

---

## 7. Testability

### 7.1 Unit Test Coverage Targets

| Category | Coverage Target | Enforcement |
|----------|----------------|-------------|
| Business logic (services, utilities) | > 90% line coverage | CI gate (fail below 85%) |
| API route handlers | > 80% line coverage | CI gate (fail below 75%) |
| UI components | > 80% line coverage | CI gate (fail below 70%) |
| Database models/queries | > 80% line coverage | CI gate (fail below 75%) |
| Overall project | > 80% line coverage | CI gate (fail below 75%) |

- Coverage measured with a standard tool (e.g., Jest coverage, c8, Istanbul).
- Coverage reports generated on every PR and tracked over time.
- **Branch coverage** must also be tracked (target: > 70%).
- New code in PRs must meet or exceed the existing coverage percentage for the file being modified.

### 7.2 Integration Test Strategy

**Scope:** Tests that verify interactions between multiple modules, services, or external dependencies.

| Integration Area | Approach | Frequency |
|-----------------|----------|-----------|
| API endpoints (full request/response cycle) | Supertest or equivalent against a running server with test database | Every PR |
| Database operations (migrations, complex queries) | Test against a real PostgreSQL instance (Docker) | Every PR |
| Queue/job processing | Test with a real Redis instance (Docker); verify job enqueue, process, retry, DLQ | Every PR |
| Platform API integrations | Mock/stub external APIs with recorded responses (VCR/nock); contract tests for schema | Every PR |
| AI provider integration | Mock responses for unit/integration; contract tests for API schema; periodic live API tests | Every PR (mock), Weekly (live) |
| Authentication flows | Full OAuth2 flow with mock identity provider | Every PR |
| File upload pipeline | Test against local object storage (MinIO) | Every PR |

- Integration tests must run in isolated environments; each test suite gets a fresh database.
- Integration test execution time target: < 5 minutes for the full suite.
- Test data factories (e.g., FactoryBot, Fishery) for consistent test data generation.

### 7.3 End-to-End (E2E) Test Strategy

**Tool:** Playwright (or Cypress) for browser-based E2E tests.

**Critical User Flows (must have E2E coverage):**

1. Sign up, onboard, connect first platform.
2. Create a post, add media, schedule for a future time.
3. View the calendar, drag a post to a new time slot.
4. Publish a post immediately.
5. View analytics for a published post.
6. Invite a team member, assign a role.
7. Generate AI content, edit, and schedule.
8. Export user data.
9. Delete account.
10. Login, logout, password reset.

**E2E Test Requirements:**

- E2E tests run against a staging-like environment with seeded data and mocked external APIs.
- Tests must run in CI on every merge to main and before production deployment.
- Tests run across: Chromium, Firefox, WebKit (Playwright default engines).
- Mobile viewport tests for critical flows (at least flows 1, 2, and 5).
- E2E test execution time target: < 15 minutes for the full suite (parallelize across browsers/workers).
- Flaky test policy: any test that fails intermittently more than twice in a week must be fixed or quarantined within 48 hours.

### 7.4 API Contract Testing

- **OpenAPI specification** maintained as the single source of truth for the API.
- Contract tests auto-generated from the OpenAPI spec to verify:
  - Request schemas (required fields, types, formats).
  - Response schemas (structure, types, status codes).
  - Error response formats (consistent error envelope).
- Contract tests run on every PR.
- Breaking change detection: CI must fail if a PR introduces a backward-incompatible change to a published API version without incrementing the version.
- Consumer-driven contract testing (e.g., Pact) considered for Phase 2 when/if a mobile client is introduced.

### 7.5 Load and Stress Testing

**Load Testing:**

- Tool: k6, Artillery, or Locust.
- Scenarios:

| Scenario | Virtual Users | Duration | Success Criteria |
|----------|--------------|----------|-----------------|
| Baseline load | 100 concurrent | 10 minutes | All response time targets met |
| Expected peak | 500 concurrent | 30 minutes | p95 response times within 2x of targets |
| Growth target (1 year) | 2,000 concurrent | 30 minutes | No errors > 1%, no response time > 5s |
| Spike test | 0 to 1,000 in 60 seconds | 5 minutes | System recovers within 2 minutes, no data loss |
| Soak test | 200 concurrent | 4 hours | No memory leaks, no performance degradation > 10% |

- Load tests run weekly in a staging environment that mirrors production configuration.
- Load test results archived and compared across runs to detect performance regressions.

**Stress Testing:**

- Identify the breaking point of each component (API, database, queue, media processing).
- Document the failure mode for each component under stress (graceful degradation vs crash).
- Verify auto-scaling triggers activate correctly under stress.

### 7.6 CI/CD Pipeline Requirements

See also [Section 10: Deployment & Infrastructure](#10-deployment--infrastructure).

**Pipeline Stages (per PR):**

1. **Lint and Format Check** (< 1 minute): ESLint, Prettier (or equivalent), type checking.
2. **Unit Tests** (< 3 minutes): Run all unit tests with coverage.
3. **Integration Tests** (< 5 minutes): Run against Docker-composed dependencies.
4. **Contract Tests** (< 2 minutes): Verify OpenAPI conformance.
5. **Security Scan** (< 3 minutes): Dependency vulnerability scan, SAST scan.
6. **Build** (< 3 minutes): Build production artifacts.
7. **E2E Tests** (< 15 minutes): Run against the built artifact in a staging-like environment.

**Total PR pipeline time target: < 20 minutes** (with parallelization of independent stages).

**Pipeline Rules:**

- All stages must pass before a PR can be merged.
- Pipeline results posted as PR comments/checks.
- Pipeline failures must clearly indicate the failing stage and provide actionable logs.

### 7.7 Test Environment Management

| Environment | Purpose | Data | Platform APIs | Refresh Cycle |
|-------------|---------|------|---------------|---------------|
| Local (developer) | Development and debugging | Docker-composed dependencies, seed data | Mocked (MSW, nock) | On demand |
| CI | Automated testing | Ephemeral, seeded per test run | Mocked | Per pipeline run |
| Staging | Pre-production validation, E2E tests, load tests | Anonymized subset of production data | Sandbox/test accounts on real platforms | Weekly refresh |
| Production | Live service | Real user data | Real platform APIs | N/A |

- Staging must mirror production in configuration, infrastructure size (can be smaller but same architecture), and feature flags.
- Test data seeding scripts maintained alongside application code and version-controlled.
- Developers must be able to set up a fully functional local environment with a single command (`make dev` or equivalent) in < 5 minutes.

---

## 8. Observability

### 8.1 Structured Logging Strategy

**Log Format:** JSON structured logs with the following mandatory fields:

```json
{
  "timestamp": "2026-02-12T14:30:00.000Z",
  "level": "info",
  "service": "api",
  "traceId": "abc123",
  "spanId": "def456",
  "requestId": "req-789",
  "userId": "[REDACTED]",
  "teamId": "team-012",
  "message": "Post scheduled successfully",
  "metadata": {
    "postId": "post-345",
    "platform": "instagram",
    "scheduledAt": "2026-02-13T09:00:00.000Z"
  }
}
```

**Log Levels:**

| Level | Usage | Example |
|-------|-------|---------|
| `error` | Unrecoverable failures requiring attention | Database connection lost, unhandled exception |
| `warn` | Recoverable issues or degraded states | Retry triggered, rate limit approaching, slow query |
| `info` | Significant business events | Post published, user signed up, platform connected |
| `debug` | Detailed diagnostic info (disabled in production by default) | Query parameters, cache hit/miss, function entry/exit |

**Log Rules:**

- **No PII in logs.** Emails, names, and IPs must be redacted or replaced with pseudonymous identifiers. User IDs (opaque UUIDs) are acceptable.
- Log aggregation via a centralized logging service (e.g., Datadog, Grafana Loki, CloudWatch Logs).
- Log retention: 30 days hot (searchable), 90 days warm (queryable but slower), 1 year cold (archived).
- Correlation: Every log line within a request must share the same `requestId` and `traceId`.

### 8.2 Distributed Tracing

- Implement OpenTelemetry-based distributed tracing across all services and background workers.
- Every incoming HTTP request generates a trace with a unique trace ID propagated via the `traceparent` header (W3C Trace Context).
- Background jobs inherit the trace ID from the originating request (if applicable) or generate a new one.
- Trace spans must be created for:
  - HTTP request handling (automatic via middleware).
  - Database queries (automatic via ORM instrumentation).
  - External API calls (social media platforms, AI providers).
  - Queue operations (enqueue, dequeue, process).
  - Cache operations (Redis get/set).
  - File storage operations (upload, download, delete).
- Trace sampling in production: 10% of all traces, 100% of error traces, 100% of traces exceeding p95 latency.
- Trace visualization in the observability dashboard with flame graph and waterfall views.

### 8.3 Metrics Collection

**Application Metrics:**

| Metric | Type | Labels |
|--------|------|--------|
| `http_request_duration_seconds` | Histogram | method, route, status_code |
| `http_requests_total` | Counter | method, route, status_code |
| `http_request_size_bytes` | Histogram | method, route |
| `http_response_size_bytes` | Histogram | method, route |
| `active_websocket_connections` | Gauge | |
| `database_query_duration_seconds` | Histogram | query_type, table |
| `database_connection_pool_active` | Gauge | |
| `database_connection_pool_idle` | Gauge | |
| `cache_hit_total` | Counter | cache_name |
| `cache_miss_total` | Counter | cache_name |
| `queue_job_duration_seconds` | Histogram | queue_name, job_type |
| `queue_depth` | Gauge | queue_name |
| `queue_job_failures_total` | Counter | queue_name, job_type, error_type |
| `external_api_request_duration_seconds` | Histogram | platform, endpoint |
| `external_api_errors_total` | Counter | platform, endpoint, status_code |
| `ai_generation_duration_seconds` | Histogram | operation_type |
| `ai_generation_tokens_used` | Counter | operation_type, model |
| `media_upload_duration_seconds` | Histogram | file_type |
| `media_upload_size_bytes` | Histogram | file_type |

**Business Metrics:**

| Metric | Type | Labels |
|--------|------|--------|
| `posts_scheduled_total` | Counter | platform |
| `posts_published_total` | Counter | platform, result (success/failure) |
| `posts_publish_latency_seconds` | Histogram | platform |
| `users_registered_total` | Counter | plan |
| `users_active_daily` | Gauge | |
| `users_active_monthly` | Gauge | |
| `teams_created_total` | Counter | |
| `platform_connections_total` | Counter | platform |
| `ai_generations_total` | Counter | operation_type |
| `media_storage_bytes` | Gauge | team_id |

**Infrastructure Metrics:**

| Metric | Source |
|--------|--------|
| CPU utilization | Cloud provider / container orchestrator |
| Memory utilization | Cloud provider / container orchestrator |
| Disk I/O | Cloud provider |
| Network I/O | Cloud provider |
| Container restarts | Orchestrator |
| Database replication lag | Database monitoring |
| SSL certificate expiry days | Certificate monitoring |

### 8.4 Error Tracking and Reporting

- Dedicated error tracking service (e.g., Sentry, Bugsnag).
- **All unhandled exceptions** automatically captured with full stack trace, request context, and user context (pseudonymized).
- **Error grouping:** Similar errors grouped by stack trace fingerprint to reduce noise.
- **Error budgets:**
  - API 5xx error rate must remain below 0.1% of total requests.
  - Background job failure rate must remain below 1% of total jobs.
  - If error budgets are exceeded, new feature development pauses until errors are resolved.
- Source maps uploaded to the error tracking service for frontend errors (source maps not served to clients).
- Each error event includes: stack trace, request URL, HTTP method, request headers (sanitized), user agent, user ID (pseudonymized), breadcrumbs (recent user actions), release version.
- Alerts triggered on:
  - New error type (never seen before).
  - Error rate spike (> 3x normal rate in 5-minute window).
  - Error affecting > 10 unique users in 10 minutes.

### 8.5 Application Performance Monitoring (APM)

- APM integration (e.g., Datadog APM, New Relic, Grafana Tempo + Grafana) for end-to-end performance visibility.
- APM must automatically detect and alert on:
  - Slow endpoints (response time > 2x the p95 baseline for 5+ minutes).
  - Slow database queries (individual queries > 500ms).
  - Memory leaks (monotonically increasing memory over 1 hour).
  - N+1 query patterns (detected via ORM instrumentation).
  - External API latency degradation.
- APM dashboards must provide:
  - Service map showing dependencies and health.
  - Top 10 slowest endpoints.
  - Top 10 most-called endpoints.
  - Database query performance breakdown.
  - Deployment markers overlaid on performance graphs.

### 8.6 Dashboard Requirements

**Operational Dashboard (real-time, for on-call):**

- System health overview (green/yellow/red per component).
- Request rate, error rate, and latency (p50, p95, p99) -- last 1 hour.
- Active users and WebSocket connections.
- Queue depths and processing rates per queue.
- Database connection pool utilization.
- Recent deployments.
- Active alerts.

**Business Dashboard (daily/weekly, for product):**

- Daily/weekly/monthly active users.
- Posts scheduled and published (by platform, by day).
- Publish success rate (by platform, over time).
- AI feature usage (generations, tokens, cost estimate).
- User signups and churn.
- Storage usage trends.

**Infrastructure Dashboard (for capacity planning):**

- CPU, memory, disk, network utilization across all instances.
- Database performance (query latency, connections, replication lag).
- CDN cache hit ratio and bandwidth.
- Cost tracking by service (compute, storage, database, CDN, AI API calls).

### 8.7 Alerting Rules

**Severity Levels:**

| Severity | Response Time | Notification Channel | Examples |
|----------|--------------|---------------------|----------|
| P1 - Critical | < 15 minutes | PagerDuty/phone + Slack | Publishing engine down, database down, data breach |
| P2 - High | < 1 hour | Slack + email | Error rate > 5%, queue processing stalled, degraded performance |
| P3 - Medium | < 4 hours | Slack | High latency, disk usage > 80%, certificate expiry < 30 days |
| P4 - Low | Next business day | Email | Warning-level anomalies, dependency update available |

**Alert Rules:**

| Alert | Condition | Severity |
|-------|-----------|----------|
| Publishing engine health | Scheduled post failure rate > 1% over 5 min | P1 |
| API availability | Health check failure on > 50% of instances | P1 |
| Database down | Primary DB unresponsive for > 30 seconds | P1 |
| API error rate | 5xx rate > 5% over 5 minutes | P2 |
| API latency | p95 latency > 2x target for > 10 minutes | P2 |
| Queue backlog | Any queue depth > 5,000 or oldest job > 10 minutes | P2 |
| Database replication lag | > 30 seconds for > 5 minutes | P2 |
| Memory usage | > 85% on any instance for > 5 minutes | P3 |
| Disk usage | > 80% on any volume | P3 |
| External API errors | Platform API error rate > 25% for > 10 minutes | P3 |
| Certificate expiry | < 14 days until expiry | P3 |
| Dependency vulnerability | Critical CVE detected | P3 |
| Cost anomaly | Daily cost > 150% of 7-day average | P4 |

- **Alert fatigue prevention:** Alerts must be actionable. Any alert that fires > 3 times per week without requiring action must be tuned or downgraded.
- **On-call rotation:** Defined weekly rotation with escalation policy. Primary responder has 15 minutes to acknowledge P1; escalation to secondary after 15 minutes; escalation to engineering lead after 30 minutes.

---

## 9. Maintainability

### 9.1 Code Quality Standards

**Linting:**

- TypeScript/JavaScript: ESLint with a strict configuration (e.g., `eslint-config-airbnb` or equivalent, adapted for the project).
- No `eslint-disable` comments without a justifying code comment explaining why the rule is disabled.
- ESLint errors fail the CI build. ESLint warnings must be resolved before merging; maximum 0 warnings in the main branch.

**Formatting:**

- Automated code formatting with Prettier (or equivalent).
- Format-on-save enabled in recommended editor configuration.
- CI check validates that all code matches the formatter output; PRs with formatting differences are rejected.

**Type Safety:**

- TypeScript `strict` mode enabled (`strict: true` in tsconfig).
- No use of `any` type without explicit justification and a `// eslint-disable` comment.
- Shared types between frontend and backend must be in a shared package/module to prevent drift.

**Code Review Standards:**

- All changes require at least one approval before merging.
- PRs should be < 400 lines of changed code (excluding auto-generated files). Larger PRs must be broken into smaller, reviewable chunks.
- PR description template must include: what changed, why, how to test, and any follow-up work.
- Automated checks (lint, test, build) must pass before review is requested.

### 9.2 Documentation Requirements

| Documentation Type | Location | Update Frequency |
|-------------------|----------|------------------|
| API documentation (OpenAPI spec) | Version-controlled, auto-published | Every API change |
| Architecture Decision Records (ADRs) | `docs/adr/` in the repo | Every significant design decision |
| Runbook (operational procedures) | `docs/runbook/` in the repo | Every new alert or operational procedure |
| Onboarding guide | `docs/onboarding.md` | Quarterly review |
| Environment setup | `README.md` and/or `docs/setup.md` | Every environment change |
| Database schema documentation | Auto-generated from migrations + inline comments | Every migration |
| Feature flag documentation | Feature flag management tool or `docs/feature-flags.md` | Every new flag |

- **Inline code comments:** Required for non-obvious business logic, workarounds, and complex algorithms. Not required for self-explanatory code.
- **JSDoc/TSDoc:** Required for all exported functions, classes, and types in shared libraries.
- Documentation must be reviewed as part of the PR process; code changes that affect documented behavior must include documentation updates.

### 9.3 API Versioning Strategy

- **URL-based versioning:** `/api/v1/...`, `/api/v2/...`.
- Version 1 (`v1`) at launch.
- **Backward compatibility:** Within a version, changes must be backward-compatible:
  - New optional fields may be added to responses.
  - New optional parameters may be added to requests.
  - Existing fields must not be removed or have their type changed.
  - Existing required parameters must not be added.
- **Breaking changes** require a new version:
  - Removing or renaming a field.
  - Changing a field type.
  - Changing error response formats.
  - Changing authentication mechanisms.
- **Deprecation policy:**
  - Deprecated versions must continue to function for at least 6 months after deprecation announcement.
  - Deprecation communicated via: `Sunset` HTTP header, changelog, email notification to API consumers.
  - Usage analytics tracked per version to inform deprecation timeline.
- **Version sunset:** After the 6-month deprecation period, the old version returns `410 Gone` with a message directing users to the new version.

### 9.4 Database Migration Strategy

- Migrations managed via a migration tool integrated with the ORM (e.g., Prisma Migrate, Knex migrations, Drizzle Kit).
- All migrations must be:
  - **Forward-only** in production (no rollback migrations; instead, write a new forward migration to reverse changes).
  - **Backward-compatible** with the currently running application version (to support zero-downtime deployments).
  - **Idempotent** where possible.
  - **Small and focused** (one logical change per migration).
- Migration execution as part of the deployment pipeline (before the new application version starts receiving traffic).
- **Large table migrations** (tables with > 1M rows) must use online schema change tools (e.g., `pg_repack`, `gh-ost` equivalent for PostgreSQL, or background migration patterns) to avoid locking.
- Migration testing: all migrations must be tested in staging against a copy of production data (anonymized) before production deployment.
- Seed data scripts maintained for development and test environments.

### 9.5 Feature Flag System

- Feature flags for all new features and any risky changes.
- Feature flag management via a lightweight in-house system at launch (database-backed flags evaluated at runtime), migrating to a dedicated service (e.g., LaunchDarkly, Unleash, Flagsmith) as the team grows.

**Flag Types:**

| Type | Purpose | Lifetime |
|------|---------|----------|
| Release toggle | Gradual rollout of new features | Days to weeks; removed after full rollout |
| Ops toggle | Runtime control of operational behavior (e.g., disable AI features under load) | Permanent |
| Experiment toggle | A/B testing | Weeks to months; removed after experiment concludes |
| Permission toggle | Premium features / plan-based access | Permanent |

**Flag Rules:**

- Flags can be scoped to: global, per-team, per-user, percentage-based.
- Flag evaluation must be fast (< 1ms); flags cached locally with a 30-second refresh interval.
- Every flag must have an owner, a description, and an expected removal date (for temporary flags).
- **Stale flag cleanup:** Flags older than their expected removal date are surfaced in a weekly report. Flags unused for 90 days must be removed.
- Flag state changes are audit-logged.

### 9.6 Dependency Update Policy

- **Automated updates:** Dependabot (or Renovate) configured to create PRs for dependency updates.
- **Update schedule:**
  - Security patches: merged within the SLA defined in Section 4.9.
  - Minor/patch updates: reviewed and merged weekly (batched).
  - Major updates: reviewed individually; scheduled for the next sprint unless security-critical.
- **Lock file integrity:** Lock files must always be committed. Any PR that modifies the lock file must be reviewed carefully.
- **Dependency audit:** Quarterly review of all dependencies to identify:
  - Unused dependencies (remove them).
  - Deprecated dependencies (plan replacement).
  - Dependencies with restrictive license changes.
- **Maximum dependency age:** No dependency should be more than 2 major versions behind the latest release.

---

## 10. Deployment & Infrastructure

### 10.1 CI/CD Pipeline Requirements

**Pipeline Triggers:**

| Trigger | Actions |
|---------|---------|
| Pull request opened/updated | Lint, test (unit + integration + contract), security scan, build, E2E tests |
| Merge to main | All PR checks + deploy to staging + smoke tests |
| Manual trigger or tag | Deploy to production (with approval gate) |
| Scheduled (daily) | Full test suite + dependency vulnerability scan + load test (staging) |

**Pipeline Performance Targets:**

| Stage | Target Duration |
|-------|----------------|
| Lint + type check | < 1 minute |
| Unit tests | < 3 minutes |
| Integration tests | < 5 minutes |
| Security scan | < 3 minutes |
| Build | < 3 minutes |
| E2E tests | < 15 minutes |
| **Total PR pipeline** | **< 20 minutes** |
| Deploy to staging | < 5 minutes |
| Staging smoke tests | < 3 minutes |
| Deploy to production | < 10 minutes (including health checks) |

**Pipeline Rules:**

- All pipeline stages must pass before merging to main.
- Production deployments require an explicit approval from a team member (even if the solo dev -- this creates a deliberate checkpoint).
- Pipeline artifacts (build outputs, test reports, coverage reports) are stored for 30 days.
- Pipeline configuration is version-controlled alongside application code.

### 10.2 Environment Strategy

| Environment | Purpose | Deployed From | Infrastructure |
|-------------|---------|--------------|---------------|
| Local | Development | Developer machine | Docker Compose |
| CI | Automated testing | PR branch | Ephemeral containers |
| Staging | Pre-production validation | `main` branch | Mirrors production (smaller scale) |
| Production | Live service | Tagged release from `main` | Full-scale infrastructure |

**Environment Parity:**

- Staging must use the same container images, environment variable structure, and infrastructure components as production.
- Staging may use smaller instance sizes but must have the same number of component types (API, worker, database, queue, cache, object storage).
- Environment-specific configuration managed via environment variables; no hardcoded environment-specific values in code.
- `.env.example` maintained with all required environment variables (no sensitive values).

### 10.3 Container Orchestration

- Application packaged as Docker containers.
- Orchestrated via Kubernetes (managed service, e.g., EKS, GKE, or equivalent) or a simpler platform (e.g., Fly.io, Railway, Render) at launch.
- **Phase 1 (launch):** Simplified container platform with built-in scaling, health checks, and zero-downtime deploys. This is appropriate for a solo dev and reduces operational burden.
- **Phase 2 (10K+ users):** Evaluate migration to Kubernetes if the simpler platform becomes limiting.

**Container Requirements:**

- Container images must be **minimal** (multi-stage builds, distroless or Alpine-based).
- Container images must not contain secrets or credentials.
- Container images tagged with git SHA and semantic version.
- Container health check endpoints: `/health/live` (liveness) and `/health/ready` (readiness).
- Liveness probe: responds 200 if the process is running.
- Readiness probe: responds 200 if the process can accept traffic (database connected, cache connected, queue connected).

### 10.4 Infrastructure as Code

- All infrastructure defined in code (Terraform, Pulumi, or cloud-specific IaC like AWS CDK).
- IaC stored in a version-controlled repository (can be the same repo or a separate infra repo).
- **No manual infrastructure changes in production.** All changes go through IaC + PR review + apply pipeline.
- IaC state stored remotely with locking (e.g., S3 + DynamoDB for Terraform state).
- Infrastructure changes must be planned (dry-run) before applying; plan output reviewed in the PR.
- Secrets managed via the cloud provider's secrets manager; referenced by IaC, not stored in IaC.

### 10.5 Zero-Downtime Deployments

- **Rolling deployment strategy:** New instances start and pass health checks before old instances are drained and stopped.
- Deployment process:
  1. Build and push new container image.
  2. Start new instances with the new image.
  3. Wait for readiness probe to pass on new instances.
  4. Route traffic to new instances (gradual shift or blue/green).
  5. Drain connections from old instances (allow 30 seconds for in-flight requests to complete).
  6. Terminate old instances.
- **Database migrations** must be backward-compatible (see Section 9.4) to allow old and new application versions to run simultaneously during deployment.
- **WebSocket connections:** Clients must implement automatic reconnection. During deployment, existing WebSocket connections are gracefully closed with a "reconnect" signal.
- Deployment health gate: if error rate exceeds 5% within 5 minutes of deployment, automatically roll back.

### 10.6 Rollback Procedures

**Automated Rollback:**

- Triggered automatically if the deployment health gate fails (error rate > 5% within 5 minutes).
- Rollback to the previous known-good container image.
- Rollback completes within 5 minutes.
- Rollback triggers a P2 alert for investigation.

**Manual Rollback:**

- One-command rollback: `deploy rollback` (or equivalent CLI command).
- Rollback target: any previously deployed version (tagged container images retained for 30 days).
- Database rollback: not automatic. If a migration must be reversed, a new forward migration is created, tested in staging, and deployed.

**Rollback Verification:**

- After any rollback, automated smoke tests run to verify the system is healthy.
- Post-mortem required for any production rollback.

### 10.7 CDN for Static Assets

- All static assets (JavaScript, CSS, images, fonts) served via a CDN.
- CDN provider: Cloudflare, CloudFront, or equivalent.
- **Cache strategy:**
  - Immutable assets (hashed filenames): `Cache-Control: public, max-age=31536000, immutable`.
  - HTML pages: `Cache-Control: public, max-age=0, must-revalidate` (always check for updates).
  - API responses: not cached at CDN level (handled by application-level caching).
  - Media files (user uploads): `Cache-Control: public, max-age=2592000` (30 days).
- CDN cache invalidation: automatic on deployment for HTML; not needed for hashed assets.
- CDN edge locations: optimize for primary user geography (initially US/EU; expand based on user distribution).
- CDN analytics: monitor cache hit ratio (target: > 95%), bandwidth, and latency by region.

---

## 11. Internationalization

### 11.1 Multi-Language Support Readiness

Even though SocialSpark launches in English only, the codebase must be prepared for multi-language support from day one.

**Requirements:**

- All user-facing strings must be externalized into translation files (e.g., JSON locale files), not hardcoded in components.
- Translation file structure: `locales/{language_code}.json` (e.g., `locales/en.json`, `locales/es.json`).
- Use a standard i18n library (e.g., `react-intl`, `next-intl`, `i18next`) from the start.
- String keys must be descriptive and namespaced: `dashboard.calendar.emptyState.title`, not `str_001`.
- Pluralization must use ICU MessageFormat syntax to handle language-specific plural rules.
- No string concatenation for forming sentences (word order varies across languages).
- Numbers, dates, and currencies must use `Intl.NumberFormat`, `Intl.DateTimeFormat`, and `Intl.RelativeTimeFormat` (or equivalent library wrappers) rather than custom formatting.
- Target languages for Phase 2: Spanish, French, German, Portuguese, Japanese. Preparation means no code changes should be required to add a language -- only adding a translation file and updating the language selector.

### 11.2 Timezone Handling

Timezone correctness is critical for a scheduling application. Errors in timezone handling directly break the core value proposition.

**Rules:**

- **All timestamps stored in UTC** in the database. No exceptions.
- **User timezone** stored in user profile settings; auto-detected on signup (via browser `Intl.DateTimeFormat().resolvedOptions().timeZone`) with the option to override manually.
- **Display timestamps** always converted to the user's local timezone in the UI.
- **Scheduled post times** stored as UTC in the database. The UI presents them in the user's timezone and converts to UTC before sending to the API.
- **API accepts and returns UTC** timestamps in ISO 8601 format (`2026-02-12T14:30:00.000Z`). The API never accepts local time without an explicit timezone offset.
- **Timezone database:** Use the IANA Time Zone Database (via `luxon`, `date-fns-tz`, or the built-in `Intl` API). The timezone database must be kept up to date (updated within 1 week of IANA releases).
- **Daylight Saving Time (DST) transitions:** Scheduled posts near DST transitions must be handled correctly:
  - If a user schedules a post for 2:30 AM and the clock jumps from 2:00 AM to 3:00 AM, the post is published at 3:00 AM (the first valid time after the scheduled time in the user's timezone).
  - If the clock falls back (e.g., 2:00 AM occurs twice), the post is published at the first occurrence.
  - Users scheduling near DST transitions should see a warning in the UI.
- **Team timezone vs. user timezone:** Teams can set a "team timezone" for shared calendar views. Individual users can toggle between their personal timezone and the team timezone.
- **Platform-specific timezone handling:** Some platforms may require timestamps in specific formats or timezones. The publishing engine must handle conversion per platform.

### 11.3 Date and Time Formatting

| Context | Format | Example |
|---------|--------|---------|
| Calendar headers | Localized long date | "February 12, 2026" (en), "12 de febrero de 2026" (es) |
| Post timestamp | Localized short date + time | "Feb 12, 2:30 PM" (en) |
| Relative time | Natural language relative | "in 3 hours", "2 days ago" |
| API (input/output) | ISO 8601 UTC | "2026-02-12T14:30:00.000Z" |
| Exports (CSV/JSON) | ISO 8601 UTC | "2026-02-12T14:30:00.000Z" |
| Scheduled post display | Time with timezone abbreviation | "2:30 PM EST" |

- All date/time formatting must use `Intl.DateTimeFormat` (or a library wrapper) to respect the user's locale.
- The first day of the week must respect the user's locale (Monday in most of Europe, Sunday in the US).
- 12-hour vs. 24-hour clock must respect the user's locale preference (with an option to override in settings).

### 11.4 RTL Language Support Preparation

SocialSpark does not need to support RTL languages at launch, but the codebase should not make RTL support difficult to add later.

**Preparation Requirements:**

- Use CSS logical properties (`margin-inline-start` instead of `margin-left`, `padding-inline-end` instead of `padding-right`, etc.) wherever possible.
- Avoid hardcoded directional values in CSS (e.g., `text-align: left` should be `text-align: start`).
- Use a CSS framework or utility library that supports RTL (e.g., Tailwind CSS with RTL plugin).
- Set the `dir` attribute on the `<html>` element dynamically based on the selected locale.
- Icons with directional meaning (arrows, progress indicators) must be mirrored in RTL mode. Non-directional icons are not mirrored.
- Layout components must use flexbox or grid with logical properties (no `float: left/right`).
- Test the UI periodically with `dir="rtl"` to catch regressions (a visual regression test in RTL mode is recommended as part of the E2E suite, even before officially supporting RTL languages).

---

## Appendix A: Requirement Priority Matrix

Each non-functional requirement is assigned a priority for implementation phasing.

| Priority | Definition | Timeline |
|----------|-----------|----------|
| P0 | Must have for MVP launch | Before launch |
| P1 | Must have within 3 months of launch | Month 0-3 |
| P2 | Should have within 6 months | Month 3-6 |
| P3 | Nice to have, planned for year 1 | Month 6-12 |

| Requirement | Priority |
|-------------|----------|
| Core performance targets (API, page load) | P0 |
| Scheduled post delivery guarantee | P0 |
| Authentication and authorization (JWT, RBAC) | P0 |
| Data encryption (TLS, at-rest) | P0 |
| Platform token encryption | P0 |
| Input validation and sanitization | P0 |
| Security headers (CSP, CORS, HSTS) | P0 |
| Unit test coverage > 80% | P0 |
| CI/CD pipeline (full) | P0 |
| Structured logging | P0 |
| Error tracking | P0 |
| Basic monitoring and alerting (P1/P2 alerts) | P0 |
| Timezone handling (correct) | P0 |
| Externalized strings (i18n readiness) | P0 |
| Zero-downtime deployments | P0 |
| Database backups (automated) | P0 |
| GDPR core compliance (privacy policy, consent, data processing) | P0 |
| Responsive design (mobile, tablet, desktop) | P0 |
| Keyboard navigation (critical flows) | P0 |
| Retry policies for failed publishes | P0 |
| Feature flag system (basic) | P0 |
| Calendar performance (1000+ posts) | P1 |
| AI generation response time targets | P1 |
| Rate limit management (internal + external) | P1 |
| WCAG 2.1 AA audit | P1 |
| Screen reader support (full) | P1 |
| Integration tests (full coverage) | P1 |
| E2E tests (critical flows) | P1 |
| Data export (right to portability) | P1 |
| Account deletion (right to erasure) | P1 |
| Audit logging | P1 |
| APM integration | P1 |
| Distributed tracing | P1 |
| MFA support | P1 |
| Load testing (baseline) | P1 |
| Graceful degradation (circuit breakers) | P1 |
| Horizontal auto-scaling | P2 |
| Database read replicas | P2 |
| CDN optimization | P2 |
| API versioning (v2 readiness) | P2 |
| Load testing (growth targets) | P2 |
| Disaster recovery drills | P2 |
| Business dashboards | P2 |
| Dependency vulnerability SLA enforcement | P2 |
| Media storage tiering | P3 |
| Database partitioning | P3 |
| Multi-region deployment | P3 |
| RTL language preparation (verification) | P3 |
| Second language support | P3 |
| Advanced DDoS protection | P3 |

---

## Appendix B: Glossary

| Term | Definition |
|------|-----------|
| **APM** | Application Performance Monitoring |
| **CDN** | Content Delivery Network |
| **CORS** | Cross-Origin Resource Sharing |
| **CSP** | Content Security Policy |
| **DLQ** | Dead Letter Queue |
| **DST** | Daylight Saving Time |
| **DPA** | Data Processing Agreement |
| **FCP** | First Contentful Paint |
| **GDPR** | General Data Protection Regulation |
| **HSTS** | HTTP Strict Transport Security |
| **IANA** | Internet Assigned Numbers Authority |
| **IaC** | Infrastructure as Code |
| **ICU** | International Components for Unicode |
| **JWT** | JSON Web Token |
| **LCP** | Largest Contentful Paint |
| **MFA** | Multi-Factor Authentication |
| **mTLS** | Mutual TLS (Transport Layer Security) |
| **OWASP** | Open Worldwide Application Security Project |
| **PII** | Personally Identifiable Information |
| **PKCE** | Proof Key for Code Exchange |
| **RBAC** | Role-Based Access Control |
| **RPO** | Recovery Point Objective |
| **RTO** | Recovery Time Objective |
| **RTL** | Right-to-Left (text direction) |
| **SLA** | Service Level Agreement |
| **SPA** | Single Page Application |
| **SSE** | Server-Side Encryption |
| **TOTP** | Time-based One-Time Password |
| **TTL** | Time to Live |
| **WAL** | Write-Ahead Log |
| **WCAG** | Web Content Accessibility Guidelines |

---

*This document is a living specification. It will be reviewed and updated quarterly or when significant architectural decisions are made. All changes must be tracked via version control.*
