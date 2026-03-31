## 1. Project Foundation

- [x] 1.1 Initialise Next.js 14 project with App Router, TypeScript, and Tailwind CSS
- [x] 1.2 Install and configure Supabase JS client (`@supabase/supabase-js`, `@supabase/auth-helpers-nextjs`)
- [x] 1.3 Set up environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`
- [x] 1.4 Create Supabase project and configure Auth (email/password enabled, Google OAuth configured)
- [x] 1.5 Write and run database migrations for all seven core tables: `profiles`, `job_preferences`, `resumes`, `applications`, `messages`, `subscriptions`, `team_assignments`
- [x] 1.6 Apply RLS policies for all tables (candidate self-access, team member assigned-candidate access, admin full access)
- [x] 1.7 Create private Supabase Storage bucket for resumes with CORS configured for the Vercel domain
- [x] 1.8 Set up OpenAPI 3.1 spec file (`openapi.yaml`) in the project root as the API contract reference

## 2. Authentication API

- [x] 2.1 Implement `POST /api/v1/auth/signup` — create Supabase Auth user and insert `profiles` row with `role = 'candidate'`
- [x] 2.2 Implement `POST /api/v1/auth/login` — authenticate via Supabase Auth, return JWT and refresh token
- [x] 2.3 Implement `POST /api/v1/auth/logout` — invalidate Supabase session
- [x] 2.4 Implement `POST /api/v1/auth/reset-password` — trigger Supabase password reset email
- [x] 2.5 Create reusable `withAuth` middleware that validates the Bearer JWT and attaches `user` and `role` to the request context
- [x] 2.6 Create `withRole(role)` middleware guard for team-only and admin-only routes

## 3. Public Website

- [x] 3.1 Build landing page (`/`) with hero, value proposition, how-it-works steps, testimonials, and CTA buttons
- [x] 3.2 Build `/how-it-works` page with four-step explainer and sign-up CTA
- [x] 3.3 Build `/pricing` page with three plan cards, feature comparison table, and checkout links
- [x] 3.4 Build persistent navigation bar component (Home, How It Works, Pricing, Login/Sign Up)
- [x] 3.5 Ensure all public pages are responsive (mobile 320px+ and desktop 1280px+)
- [x] 3.6 Build `/login` page with email/password form connected to `POST /auth/login`
- [x] 3.7 Build `/signup` page with email/password form connected to `POST /auth/signup`

## 4. Candidate Onboarding

- [x] 4.1 Build three-step onboarding wizard at `/onboarding` (Step 1: resume upload, Step 2: job preferences, Step 3: plan selection)
- [x] 4.2 Implement redirect to `/onboarding` for authenticated candidates where `onboarding_complete = false`
- [x] 4.3 Set `profiles.onboarding_complete = true` and redirect to `/dashboard` on wizard completion
- [x] 4.4 Implement plan selection step that initiates Stripe Checkout session for the chosen plan

## 5. Candidate Portal — Core APIs

- [x] 5.1 Implement `GET /api/v1/candidates/me` — return authenticated candidate's profile
- [x] 5.2 Implement `PATCH /api/v1/candidates/me` — update profile fields; sync email to Supabase Auth if changed
- [x] 5.3 Implement `GET /api/v1/candidates/me/preferences` — return job preferences row
- [x] 5.4 Implement `PUT /api/v1/candidates/me/preferences` — replace job preferences row
- [x] 5.5 Implement `GET /api/v1/candidates/me/dashboard` — return `total_apps_this_month`, `interviews_scheduled`, `plan`

## 6. Resume Management API

- [x] 6.1 Implement `GET /api/v1/resumes` — list all resumes for the authenticated candidate
- [x] 6.2 Implement `POST /api/v1/resumes` — accept `multipart/form-data`, validate file type (PDF/DOCX) and size (≤10MB), upload to private Supabase Storage, insert `resumes` row
- [x] 6.3 Implement `PATCH /api/v1/resumes/{id}/activate` — set `is_active = true` for given resume, `false` for all others belonging to the same candidate
- [x] 6.4 Implement `DELETE /api/v1/resumes/{id}` — remove file from Supabase Storage and delete row

## 7. Candidate Portal — UI

- [x] 7.1 Build dashboard overview page (`/dashboard`) with three stat cards (total apps, interviews, plan status)
- [x] 7.2 Build resume vault UI (`/dashboard/resumes`) with upload form, file list, activate and delete actions
- [x] 7.3 Build job preferences form (`/dashboard/preferences`) with multi-select fields for titles, industries, locations, work type, visa sponsorship
- [x] 7.4 Build application tracker (`/dashboard/applications`) as a paginated table with status filter and sort by date
- [x] 7.5 Build subscription management page (`/dashboard/billing`) with current plan display and "Manage Billing" button linking to Stripe portal

## 8. Applications API

- [x] 8.1 Implement `GET /api/v1/applications` — paginated list; candidates see own records; team members see assigned candidates' records; admins see all
- [x] 8.2 Implement `POST /api/v1/applications` — team-only; validate required fields; enforce plan daily limit; insert row with `status = 'applied'`
- [x] 8.3 Implement `GET /api/v1/applications/{id}` — return single application (role-scoped)
- [x] 8.4 Implement `PATCH /api/v1/applications/{id}` — update `status` or `notes`; validate status enum
- [x] 8.5 Implement `DELETE /api/v1/applications/{id}` — soft-delete (set `deleted_at`)
- [x] 8.6 Implement `POST /api/v1/applications/bulk` — parse JSON array body; insert valid rows; return `{ imported, failed, errors[] }`

## 9. Team Portal — UI

- [x] 9.1 Build team dashboard (`/team/dashboard`) showing assigned candidate queue with plan, status, and daily progress bar per candidate
- [x] 9.2 Build candidate profile view (`/team/candidates/{id}`) showing resume (signed URL), job preferences, and application history
- [x] 9.3 Build application log form (single entry) with fields: company, job title, job board, URL, date, notes
- [x] 9.4 Build bulk CSV import UI with upload input, preview table, and import result summary
- [x] 9.5 Build daily progress bar component showing `X / Y applications today` per candidate
- [x] 9.6 Implement status update dropdown on application rows in the team view

## 10. Subscription Billing

- [ ] 10.1 Configure Stripe products and prices for Starter ($99), Pro ($199), Premium ($299) monthly plans; store Price IDs in env vars
- [x] 10.2 Implement `POST /api/v1/subscriptions/checkout` — create Stripe Checkout session in subscription mode; return `checkout_url`
- [x] 10.3 Implement `POST /api/v1/subscriptions/portal` — create Stripe Customer Portal session; return portal URL; return 400 if no Stripe customer
- [x] 10.4 Implement `GET /api/v1/subscriptions/me` — return local `subscriptions` row for authenticated candidate
- [x] 10.5 Implement `POST /api/v1/webhooks/stripe` (public) — verify Stripe signature; handle `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`; deduplicate by event ID

## 11. Messaging

- [x] 11.1 Implement `GET /api/v1/messages/{candidateId}` — return messages ordered by `created_at` ASC; enforce Pro/Premium plan gate; mark unread messages as read; reject if team member is not assigned to candidate
- [x] 11.2 Implement `POST /api/v1/messages/{candidateId}` — insert message row with `sender_id`, `sender_role`, `content`; enforce plan gate; validate non-empty content
- [x] 11.3 Build messaging inbox UI (`/dashboard/messages`) for candidates showing the thread with their team member
- [x] 11.4 Build messaging UI for team members within the candidate profile view

## 12. Admin Panel

- [x] 12.1 Implement `GET /api/v1/admin/candidates` — paginated list of all candidates with filters for plan, status, team assignment
- [x] 12.2 Implement `GET /api/v1/admin/team` — list all team members with assigned candidate count
- [x] 12.3 Implement `POST /api/v1/admin/team` — create team member Auth user + profile; send welcome email via Resend
- [x] 12.4 Implement `PATCH /api/v1/admin/team/{id}/assign` — replace `team_assignments` entries for listed candidate IDs
- [x] 12.5 Implement `GET /api/v1/admin/metrics` — return `total_candidates`, `active_subscriptions`, `mrr`, `total_applications`, `avg_apps_per_candidate`
- [x] 12.6 Build admin panel UI (`/admin`) with tabbed views: Candidates, Team Members, Subscriptions, Metrics
- [x] 12.7 Build team assignment UI allowing drag-and-drop or dropdown assignment of candidates to team members
- [x] 12.8 Implement manual billing actions (plan change, refund) via Stripe API proxied through admin panel

## 13. Email Reports

- [x] 13.1 Configure Resend API key and create React Email templates for: welcome email, password reset, weekly report
- [x] 13.2 Build weekly report email template showing: applications sent this week, status breakdown, interviews scheduled
- [x] 13.3 Implement weekly report generation function — query applications for the past 7 days per candidate, render template, send via Resend
- [x] 13.4 Schedule weekly report as a Vercel Cron Job (`vercel.json`) triggered every Monday at 9am UTC; restrict to Pro and Premium active subscribers

## 14. Launch Readiness

- [x] 14.1 Write Supabase RLS policy tests using `SET ROLE` pattern for all critical access patterns (candidate isolation, team assignment scope, admin access)
- [x] 14.2 Add request validation middleware using zod schemas derived from the OpenAPI spec for all route handlers
- [ ] 14.3 Configure Vercel project with all environment variables and deploy production build
- [ ] 14.4 Set Stripe webhook endpoint to `https://careerproxy.com/api/v1/webhooks/stripe` and verify test event delivery
- [ ] 14.5 Run end-to-end smoke test: signup → onboarding → plan selection → team logs application → candidate views tracker
- [x] 14.6 Add `/privacy` and `/terms` static pages (required before launch per NFRs)
- [x] 14.7 Enable Vercel Analytics for performance and error monitoring
