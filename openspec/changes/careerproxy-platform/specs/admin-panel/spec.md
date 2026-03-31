## ADDED Requirements

### Requirement: Candidate management
The system SHALL provide admins with `GET /admin/candidates` returning all candidates with their plan, enrollment date, assigned team member, and current subscription status. Admins SHALL be able to filter by plan, status, and team assignment.

#### Scenario: List all candidates
- **WHEN** an admin calls `GET /admin/candidates`
- **THEN** all candidate profiles are returned regardless of assignment, with pagination

#### Scenario: Filter by plan
- **WHEN** an admin calls `GET /admin/candidates?plan=pro`
- **THEN** only Pro-plan candidates are returned

#### Scenario: Non-admin access rejected
- **WHEN** a candidate or team member calls `GET /admin/candidates`
- **THEN** the system returns HTTP 403

### Requirement: Team member management
The system SHALL allow admins to list all team members, create new team member accounts, and assign candidates to team members.

#### Scenario: List team members
- **WHEN** an admin calls `GET /admin/team`
- **THEN** all team member profiles are returned with their assigned candidate count

#### Scenario: Create team member
- **WHEN** an admin sends valid `email`, `full_name` to `POST /admin/team`
- **THEN** a Supabase Auth user is created with `role = 'team_member'`, a welcome email is sent, and the new profile is returned

#### Scenario: Assign candidates to team member
- **WHEN** an admin calls `PATCH /admin/team/{id}/assign` with an array of candidate IDs
- **THEN** `team_assignments` rows are created for each candidate-team_member pair (replacing previous assignments for those candidates)

### Requirement: Subscription overview
The system SHALL allow admins to view all active, paused, and cancelled subscriptions by reading Stripe state via the local `subscriptions` table.

#### Scenario: View all subscriptions
- **WHEN** an admin navigates to the subscriptions section of the admin panel
- **THEN** all subscription records are displayed with plan, status, billing period, and candidate name

#### Scenario: Filter by status
- **WHEN** an admin filters subscriptions by `status = 'canceled'`
- **THEN** only cancelled subscriptions are shown

### Requirement: Platform metrics
The system SHALL expose `GET /admin/metrics` returning: total candidates, active subscriptions, MRR, total applications all-time, and average applications per candidate per day.

#### Scenario: Metrics returned
- **WHEN** an admin calls `GET /admin/metrics`
- **THEN** the response includes `total_candidates`, `active_subscriptions`, `mrr`, `total_applications`, and `avg_apps_per_candidate`

#### Scenario: MRR calculated correctly
- **WHEN** active subscriptions include 5 Starter ($99), 3 Pro ($199), 2 Premium ($299) candidates
- **THEN** `mrr` equals 5×99 + 3×199 + 2×299 = 495 + 597 + 598 = 1690

### Requirement: Manual billing actions
The system SHALL allow admins to issue refunds, apply credits, and change a candidate's plan on their behalf via Stripe API calls proxied through the admin panel.

#### Scenario: Change plan on behalf of candidate
- **WHEN** an admin updates a candidate's plan in the admin panel
- **THEN** the Stripe subscription is updated via the Stripe API and the local `subscriptions` row is updated to reflect the new plan

#### Scenario: Issue refund
- **WHEN** an admin initiates a refund for a specific payment
- **THEN** the refund is submitted to Stripe and a confirmation is shown in the admin panel
