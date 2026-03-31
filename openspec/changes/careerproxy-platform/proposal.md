## Why

International students and recent MS graduates in the US spend enormous time on manual job applications — time better spent on interview prep and current work. CareerProxy addresses this by offering a managed service where a team applies to 50–100 jobs per day on the candidate's behalf, but the business lacks the operational platform to coordinate candidates, staff, billing, and reporting at scale.

## What Changes

- Launch the CareerProxy web platform from scratch as a Next.js 14 application
- Public marketing website with pricing and signup funnel
- Candidate portal: resume vault, job preferences, application tracker, subscription management
- Team portal: candidate queue, application logging (individual + bulk), daily progress tracking
- Admin panel: candidate/team management, platform metrics, billing oversight
- Stripe-powered subscription billing with three monthly plans (Starter $99, Pro $199, Premium $299)
- RESTful API following the OpenAPI 3.1 specification as the implementation contract
- Supabase for PostgreSQL database, authentication (JWT + OAuth), and file storage
- Threaded messaging between candidates and their assigned team members
- Weekly automated email reports via Resend for Pro and Premium subscribers

## Capabilities

### New Capabilities

- `public-website`: Marketing landing page, how-it-works, pricing page, and SEO-ready blog structure
- `user-auth`: Candidate registration, email/password login, Google OAuth, JWT session management, password reset
- `candidate-portal`: Candidate-facing dashboard with stats overview, resume vault, job preferences form, and application tracker
- `team-portal`: Team member interface for viewing assigned candidates, logging applications (single + bulk CSV), and tracking daily progress
- `admin-panel`: Admin views for candidate and team management, subscription overview, and platform-wide metrics
- `subscription-billing`: Stripe checkout sessions, billing portal, webhook handler, and three-tier plan enforcement
- `messaging`: Threaded candidate-team inbox with read/unread state

### Modified Capabilities

## Impact

- New repository: all code is net-new (no existing files to modify)
- API: all endpoints defined in OpenAPI 3.1 spec, implemented as Next.js API routes under `/api/v1/`
- Database: seven Supabase tables with RLS policies (`profiles`, `job_preferences`, `resumes`, `applications`, `messages`, `subscriptions`, `team_assignments`)
- External dependencies: Stripe (billing), Supabase (db/auth/storage), Resend (email), Vercel (deployment)
- File storage: private Supabase Storage bucket for candidate resume files (PDF/DOCX), accessed via signed URLs
