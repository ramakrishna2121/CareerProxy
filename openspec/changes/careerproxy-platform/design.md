## Context

CareerProxy is a net-new B2C SaaS platform for a job application consultancy targeting international MS graduates in the US. There is no existing codebase. The platform has three distinct user portals (Candidate, Team, Admin) sharing a single Next.js application and Supabase backend. The OpenAPI 3.1 specification in the PRD is the authoritative contract for all API routes.

Key constraints:
- Three user roles with different data access scopes (candidate, team_member, admin)
- Stripe handles all billing; CareerProxy never stores payment details
- Resume files must be private; access requires signed URLs
- RLS enforces data isolation at the database layer — not just in application code
- Initial deployment targets Vercel + Supabase free/hobby tier

## Goals / Non-Goals

**Goals:**
- Implement the full platform across five phases: Foundation → Candidate Portal → Team Portal → Payments → Admin + Launch
- All API routes conform to the OpenAPI 3.1 spec (validated at route level)
- Row Level Security enforced on every Supabase table
- Stripe subscription state kept in sync via webhook handler
- Performance: <2s page load, <300ms read API, <500ms write API
- GDPR-ready: data export and account deletion for candidates

**Non-Goals:**
- Automated job applications (browser automation, job board APIs)
- Mobile native apps
- AI resume generation, job matching, or interview scheduling
- Expansion outside the United States (v1.0 scope)
- Referral/affiliate programs

## Decisions

### 1. Next.js App Router with API Routes as the sole backend
**Decision**: Use Next.js 14 App Router for all pages and `/api/v1/` route handlers for the REST API.
**Rationale**: Eliminates the need for a separate backend service; Vercel handles deployment and auto-scaling of serverless functions. The App Router colocation pattern keeps UI and API code in a single repo.
**Alternative considered**: Separate Express/Hono API service — rejected to minimise infrastructure complexity at launch.

### 2. Supabase for auth, database, and file storage
**Decision**: Use Supabase Auth (JWT), Supabase PostgreSQL with RLS, and Supabase Storage for resume files.
**Rationale**: Single vendor provides auth, DB, and storage with first-class RLS support. The `auth.uid()` function in RLS policies ties directly to JWT claims, removing the need for custom auth middleware.
**Alternative considered**: Clerk (auth) + PlanetScale (DB) + S3 — rejected because it adds three vendor relationships and complicates RLS.

### 3. RLS as the primary access control layer
**Decision**: Every table has RLS policies; application code trusts the database to enforce isolation.
**Rationale**: Defence-in-depth — even if a bug in route handler logic fails to filter by user, the database rejects unauthorised reads/writes. Candidates can only read their own rows; team members can only access rows for their assigned candidates.
**Trade-off**: RLS policies add complexity to schema migrations and must be tested explicitly.

### 4. Stripe as the billing source of truth
**Decision**: CareerProxy's `subscriptions` table mirrors Stripe state and is updated exclusively via the `POST /webhooks/stripe` handler.
**Rationale**: Stripe is the authoritative record for subscription status. Syncing via webhooks ensures the local state stays current without polling.
**Alternative considered**: Polling Stripe API on each request — rejected due to latency and rate limit risk.

### 5. Plan enforcement at the API layer
**Decision**: Feature gating (e.g., weekly reports, messaging, cover letters) is enforced in API route handlers by reading the candidate's current plan from the `subscriptions` table.
**Rationale**: Frontend-only gating is trivially bypassable. API-layer checks ensure plan limits are respected regardless of client.

### 6. Resend + React Email for transactional email
**Decision**: Weekly reports and transactional emails (password reset, welcome) use Resend with React Email templates.
**Rationale**: Resend has a generous free tier, native Next.js integration, and React Email enables typed, testable email components.

### 7. File storage: private bucket + signed URLs
**Decision**: Resumes are stored in a private Supabase Storage bucket; team members and candidates receive time-limited signed URLs.
**Rationale**: Prevents direct public access to sensitive candidate documents. Signed URLs expire and can be scoped per user role.

## Risks / Trade-offs

- **Supabase free tier limits** (500MB DB, 1GB storage) → Mitigation: Monitor usage; upgrade to Supabase Pro ($25/mo) when approaching limits. Covered in NFR scalability section.
- **Webhook replay / duplicate events** → Mitigation: Use Stripe's `idempotency_key` and record processed event IDs to prevent double-processing subscription state changes.
- **RLS policy mistakes causing data leaks** → Mitigation: Write explicit RLS policy tests using Supabase's `SET ROLE` test pattern. Review all policies in code review.
- **Bulk application import (CSV) data quality** → Mitigation: Validate CSV schema server-side; return per-row error details so team members can fix and re-upload.
- **Cold-start latency on Vercel serverless functions** → Mitigation: Keep route handlers lean; avoid heavy initialisation. Monitor with Vercel Analytics.
- **Stripe webhook signature verification failure** → Mitigation: Reject unsigned or invalid webhook payloads with 400; log failures for alerting.

## Migration Plan

This is a greenfield launch — no migration from an existing system.

Deployment sequence:
1. Provision Supabase project; run schema migrations; configure RLS policies
2. Configure Supabase Auth (email/password + Google OAuth)
3. Configure Supabase Storage bucket (private, with CORS for Vercel domain)
4. Set Stripe webhook endpoint to `https://careerproxy.com/api/v1/webhooks/stripe`
5. Deploy to Vercel with all environment variables set
6. Smoke-test all API endpoints against production Supabase instance
7. Enable Vercel Analytics

Rollback: Revert Vercel deployment to previous build; Supabase schema rollback via down-migration scripts.

## Open Questions

- Should Google OAuth be enabled at launch or deferred to post-MVP? (PRD marks it "optional")
- What CSV column format will team members use for bulk application import? Needs a defined schema before Phase 3 implementation.
- Is Resend the final email provider, or should SendGrid be evaluated? (Low priority — Resend sufficient for beta)
