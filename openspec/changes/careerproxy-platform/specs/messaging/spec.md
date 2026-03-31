## ADDED Requirements

### Requirement: Message thread per candidate
The system SHALL maintain one message thread per candidate, shared between the candidate and their assigned team member. Threads are identified by `candidateId`. Messages are ordered chronologically.

#### Scenario: Thread created on first message
- **WHEN** a message is sent for a candidate with no existing thread
- **THEN** a new thread is created and the message is stored as the first entry

#### Scenario: Thread scoped to assigned team member
- **WHEN** a team member calls `GET /messages/{candidateId}`
- **THEN** the system returns HTTP 403 if that candidate is not assigned to the requesting team member

### Requirement: Send a message
The system SHALL allow candidates and team members to send messages via `POST /messages/{candidateId}`. Messages are stored with `sender_id`, `sender_role`, `content`, and `created_at`.

#### Scenario: Candidate sends message
- **WHEN** a candidate posts to `POST /messages/{candidateId}` (where `candidateId = auth.uid()`)
- **THEN** the message is stored with `sender_role = 'candidate'` and returned in the response

#### Scenario: Team member sends message
- **WHEN** an assigned team member posts to `POST /messages/{candidateId}`
- **THEN** the message is stored with `sender_role = 'team_member'` and returned in the response

#### Scenario: Empty message rejected
- **WHEN** a sender submits a message with an empty `content` field
- **THEN** the system returns HTTP 422

### Requirement: Retrieve message thread
The system SHALL allow retrieval of all messages in a thread via `GET /messages/{candidateId}`, ordered by `created_at` ascending. Only the candidate themselves or their assigned team member may read the thread.

#### Scenario: Candidate reads own thread
- **WHEN** a candidate calls `GET /messages/{candidateId}` with their own ID
- **THEN** all messages in the thread are returned in chronological order

#### Scenario: Unauthorised read rejected
- **WHEN** a different candidate attempts to read another candidate's thread
- **THEN** the system returns HTTP 403

### Requirement: Plan gating on messaging
The messaging feature SHALL be restricted to Pro and Premium plan candidates. Starter plan candidates SHALL receive HTTP 403 when accessing any messaging endpoint.

#### Scenario: Starter plan blocked from messaging
- **WHEN** a Starter candidate or their team member calls any `/messages/` endpoint
- **THEN** the system returns HTTP 403 with a message indicating Pro or Premium is required

#### Scenario: Pro plan can access messaging
- **WHEN** a Pro candidate calls `GET /messages/{candidateId}`
- **THEN** the request is processed normally

### Requirement: Read receipts
The system SHALL track when messages are read by updating `read_at` on each `messages` row. `read_at` is set when the recipient fetches the thread after the message was created.

#### Scenario: Messages marked as read on fetch
- **WHEN** a recipient calls `GET /messages/{candidateId}`
- **THEN** all messages in the thread where `sender_id != auth.uid()` and `read_at IS NULL` have `read_at` set to the current timestamp
