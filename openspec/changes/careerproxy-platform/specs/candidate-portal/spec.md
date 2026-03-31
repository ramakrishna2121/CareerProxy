## ADDED Requirements

### Requirement: Dashboard overview
The system SHALL provide `GET /candidates/me/dashboard` returning the candidate's current-month application count, number of interviews scheduled, and current plan status.

#### Scenario: Dashboard stats returned
- **WHEN** an authenticated candidate calls `GET /candidates/me/dashboard`
- **THEN** the response includes `total_apps_this_month`, `interviews_scheduled`, and `plan` fields

#### Scenario: Dashboard UI displays stat cards
- **WHEN** a candidate views `/dashboard`
- **THEN** three summary cards are shown: Total Applications This Month, Interviews Scheduled, and Plan Status

### Requirement: Resume vault
The system SHALL allow candidates to upload, replace, and manage multiple resume versions. Each resume is stored in a private Supabase Storage bucket. Only PDF and DOCX files up to 10MB are accepted.

#### Scenario: Resume upload
- **WHEN** a candidate sends a valid PDF or DOCX file to `POST /resumes`
- **THEN** the file is stored in private Supabase Storage, a `resumes` row is inserted, and the response returns the new resume's `id`, `file_name`, and `uploaded_at`

#### Scenario: Invalid file type rejected
- **WHEN** a candidate uploads a file that is not PDF or DOCX
- **THEN** the system returns HTTP 422 with an error indicating the supported file types

#### Scenario: File size limit enforced
- **WHEN** a candidate uploads a file exceeding 10MB
- **THEN** the system returns HTTP 413

#### Scenario: Set active resume
- **WHEN** a candidate calls `PATCH /resumes/{id}/activate`
- **THEN** the specified resume's `is_active` is set to `true` and all other resumes for that candidate are set to `false`

#### Scenario: Delete resume
- **WHEN** a candidate calls `DELETE /resumes/{id}`
- **THEN** the file is removed from Supabase Storage and the `resumes` row is deleted

### Requirement: Job preferences
The system SHALL allow candidates to set and update their job search preferences via `PUT /candidates/me/preferences`. Preferences include target job titles, industries, locations, salary range, work type, and visa sponsorship requirement.

#### Scenario: Set job preferences
- **WHEN** a candidate sends a valid preferences payload to `PUT /candidates/me/preferences`
- **THEN** the `job_preferences` row for that candidate is replaced and the updated preferences are returned

#### Scenario: Retrieve job preferences
- **WHEN** a candidate calls `GET /candidates/me/preferences`
- **THEN** the current preferences are returned including all array fields and scalar filters

#### Scenario: Empty preferences allowed
- **WHEN** a candidate calls `PUT /candidates/me/preferences` with an empty body
- **THEN** the system accepts the request and clears all preference fields (candidate has no filters set)

### Requirement: Application tracker
The system SHALL display a paginated table of all applications submitted on the candidate's behalf, showing company, job title, job board, date applied, and current status.

#### Scenario: List own applications
- **WHEN** an authenticated candidate calls `GET /applications`
- **THEN** only applications where `candidate_id = auth.uid()` are returned, ordered by `applied_at` descending

#### Scenario: Filter by status
- **WHEN** a candidate calls `GET /applications?status=interview_scheduled`
- **THEN** only applications with `status = 'interview_scheduled'` are returned

#### Scenario: Pagination
- **WHEN** a candidate calls `GET /applications?page=2&limit=25`
- **THEN** the second page of 25 results is returned with a total count in the response

### Requirement: Subscription management
The system SHALL allow candidates to view their current subscription plan, next billing date, and access the Stripe billing portal to upgrade, downgrade, or cancel.

#### Scenario: View current subscription
- **WHEN** a candidate calls `GET /subscriptions/me`
- **THEN** the response includes `plan`, `status`, `current_period_end`, and `cancel_at`

#### Scenario: Open billing portal
- **WHEN** a candidate calls `POST /subscriptions/portal`
- **THEN** the system creates a Stripe billing portal session and returns the portal URL

### Requirement: Profile settings
The system SHALL allow candidates to update their name, email, and password, and to configure notification preferences.

#### Scenario: Update profile
- **WHEN** a candidate sends valid fields to `PATCH /candidates/me`
- **THEN** the `profiles` row is updated and the updated profile is returned

#### Scenario: Email update propagates to Supabase Auth
- **WHEN** a candidate updates their email via `PATCH /candidates/me`
- **THEN** Supabase Auth email is also updated (requires re-verification)
