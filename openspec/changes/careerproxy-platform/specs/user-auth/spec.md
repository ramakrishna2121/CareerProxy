## ADDED Requirements

### Requirement: Candidate registration
The system SHALL allow a new user to register with an email address and password via `POST /auth/signup`. On success, a Supabase Auth user is created and a corresponding row is inserted into `profiles` with `role = 'candidate'`.

#### Scenario: Successful registration
- **WHEN** a visitor submits a valid email and password (8+ characters) to `POST /auth/signup`
- **THEN** the system returns HTTP 201 with a JWT access token and the new candidate's profile ID

#### Scenario: Duplicate email registration
- **WHEN** a visitor submits an email that already exists in `auth.users`
- **THEN** the system returns HTTP 409 with an error message indicating the email is already registered

#### Scenario: Weak password rejected
- **WHEN** a visitor submits a password shorter than 8 characters
- **THEN** the system returns HTTP 422 with a validation error

### Requirement: Candidate login
The system SHALL authenticate a candidate via `POST /auth/login` using email and password, returning a JWT access token valid for the Supabase session duration.

#### Scenario: Successful login
- **WHEN** a candidate submits valid credentials to `POST /auth/login`
- **THEN** the system returns HTTP 200 with a JWT access token and refresh token

#### Scenario: Invalid credentials
- **WHEN** a candidate submits an incorrect password or non-existent email
- **THEN** the system returns HTTP 401 with a generic "Invalid credentials" message (no disclosure of which field is wrong)

### Requirement: Logout
The system SHALL invalidate the current session via `POST /auth/logout`. Subsequent requests with the invalidated token SHALL be rejected.

#### Scenario: Successful logout
- **WHEN** an authenticated user calls `POST /auth/logout` with a valid JWT
- **THEN** the system returns HTTP 204 and the session is invalidated in Supabase Auth

### Requirement: Password reset
The system SHALL send a password reset email via `POST /auth/reset-password` using Supabase Auth's built-in reset flow.

#### Scenario: Reset email sent for known address
- **WHEN** a user submits a registered email to `POST /auth/reset-password`
- **THEN** the system returns HTTP 200 and Supabase sends a reset email to that address

#### Scenario: Reset request for unknown address
- **WHEN** a user submits an unregistered email to `POST /auth/reset-password`
- **THEN** the system returns HTTP 200 (no enumeration — same response regardless)

### Requirement: JWT-protected routes
All API routes except `POST /auth/signup`, `POST /auth/login`, `POST /auth/reset-password`, and `POST /webhooks/stripe` SHALL require a valid Supabase JWT in the `Authorization: Bearer <token>` header.

#### Scenario: Request with valid JWT
- **WHEN** a client sends a request to a protected route with a valid unexpired JWT
- **THEN** the route handler processes the request normally

#### Scenario: Request with missing or invalid JWT
- **WHEN** a client sends a request to a protected route without a JWT or with an expired/invalid token
- **THEN** the system returns HTTP 401

### Requirement: Role-based route access
The system SHALL enforce role-based access: team-only endpoints reject candidates; admin-only endpoints reject candidates and team members.

#### Scenario: Candidate accessing team-only endpoint
- **WHEN** a candidate JWT is used to call `POST /applications` (team-only)
- **THEN** the system returns HTTP 403

#### Scenario: Team member accessing admin-only endpoint
- **WHEN** a team member JWT is used to call `GET /admin/metrics`
- **THEN** the system returns HTTP 403

### Requirement: Candidate onboarding flow
After registration, the system SHALL guide the candidate through a three-step onboarding wizard: (1) resume upload, (2) job preferences, (3) plan selection. The candidate's `profiles.onboarding_complete` flag SHALL be set to `true` upon completion.

#### Scenario: Onboarding wizard displayed post-signup
- **WHEN** a newly registered candidate logs in for the first time (`onboarding_complete = false`)
- **THEN** the UI redirects to `/onboarding` and displays Step 1 (resume upload)

#### Scenario: Onboarding completion
- **WHEN** the candidate completes all three onboarding steps
- **THEN** `profiles.onboarding_complete` is set to `true` and the candidate is redirected to `/dashboard`
