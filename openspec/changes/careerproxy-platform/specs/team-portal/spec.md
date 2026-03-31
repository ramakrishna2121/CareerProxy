## ADDED Requirements

### Requirement: Assigned candidate queue
The system SHALL provide team members with a list of their assigned candidates via `GET /candidates/me` scoped by role, showing each candidate's plan, enrollment status, and today's application count.

#### Scenario: Team member views their queue
- **WHEN** an authenticated team member navigates to `/team/dashboard`
- **THEN** only candidates assigned to that team member (via `team_assignments`) are displayed

#### Scenario: RLS enforces assignment scope
- **WHEN** a team member calls any candidate-scoped endpoint
- **THEN** the database RLS policy ensures only assigned candidates' data is accessible

### Requirement: View candidate profile
The system SHALL allow team members to view a candidate's active resume (via signed URL), job preferences, and personal profile details.

#### Scenario: View candidate resume
- **WHEN** a team member accesses a candidate's resume
- **THEN** a time-limited signed URL is generated for the active resume file and returned

#### Scenario: View job preferences
- **WHEN** a team member opens a candidate's profile page
- **THEN** the candidate's `job_preferences` are displayed including titles, industries, locations, work type, and visa sponsorship flag

### Requirement: Log a single application
The system SHALL allow team members to log a job application on behalf of an assigned candidate via `POST /applications`. Required fields: `candidate_id`, `company`, `job_title`, `job_board` (LinkedIn | Indeed | Glassdoor), `job_url`, `applied_at`.

#### Scenario: Successful application log
- **WHEN** a team member submits a valid application form
- **THEN** an `applications` row is inserted with `status = 'applied'` and the new record is returned

#### Scenario: Log rejected for unassigned candidate
- **WHEN** a team member attempts to log an application for a candidate not in their `team_assignments`
- **THEN** the system returns HTTP 403

#### Scenario: Required fields validation
- **WHEN** a team member submits the log form missing the `company` or `job_board` field
- **THEN** the system returns HTTP 422 with field-level validation errors

### Requirement: Bulk application import
The system SHALL allow team members to upload a CSV file to log multiple applications at once via `POST /applications/bulk`. The CSV MUST have columns: `company`, `job_title`, `job_board`, `job_url`, `applied_at`, `notes` (optional).

#### Scenario: Valid CSV imported
- **WHEN** a team member uploads a valid CSV with 10 rows
- **THEN** 10 application records are inserted and a summary (`imported: 10, failed: 0`) is returned

#### Scenario: Partial failure with row-level errors
- **WHEN** a CSV contains 8 valid rows and 2 rows with missing required fields
- **THEN** the 8 valid rows are inserted and the response includes `imported: 8, failed: 2` with per-row error details

#### Scenario: Invalid CSV format rejected
- **WHEN** a non-CSV file is uploaded to `POST /applications/bulk`
- **THEN** the system returns HTTP 422

### Requirement: Daily progress tracker
The system SHALL display a per-candidate progress bar showing how many applications have been logged today versus the candidate's daily target (derived from their plan).

#### Scenario: Progress bar displayed
- **WHEN** a team member views the candidate queue
- **THEN** each candidate card shows `X / Y applications today` with a visual progress indicator (X = logged today, Y = plan daily target)

#### Scenario: Daily count resets at midnight UTC
- **WHEN** the date rolls over to the next day
- **THEN** the daily application count resets to 0 for all candidates

### Requirement: Update application status
The system SHALL allow team members to update the status of any application for their assigned candidates via `PATCH /applications/{id}`.

#### Scenario: Status update succeeds
- **WHEN** a team member sends `PATCH /applications/{id}` with `status: "interview_scheduled"`
- **THEN** the `applications` row is updated and the updated record is returned

#### Scenario: Invalid status value rejected
- **WHEN** a team member sends an unrecognised status value
- **THEN** the system returns HTTP 422 with the list of valid statuses

### Requirement: Application history view
The system SHALL allow team members to view all previously logged applications for a given candidate, filterable by status and date range.

#### Scenario: View application history
- **WHEN** a team member views a candidate's history tab
- **THEN** all applications for that candidate are listed in descending date order

#### Scenario: Filter by status
- **WHEN** a team member filters by `status = 'rejected'`
- **THEN** only rejected applications for that candidate are shown
