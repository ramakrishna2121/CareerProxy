## ADDED Requirements

### Requirement: Three-tier subscription plans
The system SHALL support three monthly subscription plans billed in USD via Stripe: Starter ($99/mo, 50 apps/day), Pro ($199/mo, 100 apps/day), Premium ($299/mo, unlimited apps/day). Plan limits SHALL be enforced at the API layer.

#### Scenario: Starter plan daily limit enforced
- **WHEN** a Starter candidate has already had 50 applications logged today
- **THEN** `POST /applications` for that candidate returns HTTP 429 with a plan limit message

#### Scenario: Premium plan has no daily limit
- **WHEN** a Premium candidate's team member logs any number of applications
- **THEN** `POST /applications` succeeds regardless of today's count

### Requirement: Stripe checkout session
The system SHALL create a Stripe Checkout session for new subscriptions via `POST /subscriptions/checkout`. The session SHALL include the selected plan's Stripe Price ID and the candidate's email.

#### Scenario: Checkout session created
- **WHEN** an authenticated candidate calls `POST /subscriptions/checkout` with a valid `plan` value
- **THEN** the system creates a Stripe Checkout session in subscription mode and returns the `checkout_url`

#### Scenario: Candidate redirected after payment
- **WHEN** a candidate completes payment in the Stripe Checkout flow
- **THEN** Stripe redirects to the `success_url` configured in the session (e.g., `/dashboard?subscribed=true`)

#### Scenario: Invalid plan rejected
- **WHEN** a candidate submits an unrecognised plan name
- **THEN** the system returns HTTP 422

### Requirement: Stripe billing portal
The system SHALL create a Stripe Customer Portal session via `POST /subscriptions/portal` allowing candidates to upgrade, downgrade, cancel, or update payment details.

#### Scenario: Portal session created
- **WHEN** an authenticated candidate calls `POST /subscriptions/portal`
- **THEN** the system creates a Stripe Customer Portal session and returns the portal URL

#### Scenario: Candidate without a subscription cannot access portal
- **WHEN** a candidate with no Stripe customer record calls `POST /subscriptions/portal`
- **THEN** the system returns HTTP 400 indicating no active subscription exists

### Requirement: Stripe webhook handler
The system SHALL handle Stripe webhook events at `POST /webhooks/stripe`. This endpoint is public (no JWT required). Every incoming request SHALL have its Stripe signature verified before processing.

#### Scenario: Signature verification
- **WHEN** a webhook arrives without a valid `Stripe-Signature` header
- **THEN** the system returns HTTP 400 and does not process the event

#### Scenario: subscription.created event
- **WHEN** Stripe sends a `customer.subscription.created` event
- **THEN** a row is inserted into `subscriptions` with the correct `plan`, `status`, `current_period_end`, and `stripe_subscription_id`

#### Scenario: subscription.updated event
- **WHEN** Stripe sends a `customer.subscription.updated` event
- **THEN** the matching `subscriptions` row is updated to reflect the new plan and status

#### Scenario: subscription.deleted event
- **WHEN** Stripe sends a `customer.subscription.deleted` event
- **THEN** the matching `subscriptions` row has `status` set to `'canceled'`

#### Scenario: Idempotent event processing
- **WHEN** the same Stripe event ID is received more than once
- **THEN** the system processes it only once (subsequent delivery is a no-op)

### Requirement: Plan feature gating
The system SHALL restrict Pro and Premium features at the API layer based on the candidate's current plan from the `subscriptions` table.

#### Scenario: Team chat restricted on Starter
- **WHEN** a Starter candidate or their team member attempts to use messaging endpoints
- **THEN** the system returns HTTP 403 with a message indicating the feature requires Pro or higher

#### Scenario: Weekly reports only for Pro and Premium
- **WHEN** the weekly report job runs
- **THEN** emails are sent only to candidates with `plan IN ('pro', 'premium')` and `status = 'active'`
