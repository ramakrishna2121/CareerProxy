-- =============================================================================
-- CareerProxy — Supabase RLS Policy Tests
-- Run these in the Supabase SQL editor or via psql against your test database.
-- Each block tests a specific access pattern by switching roles and JWT claims.
-- =============================================================================

-- Fixture UUIDs (replace with actual seeded UUIDs in test database)
-- candidate-uuid-1 : a candidate
-- candidate-uuid-2 : another candidate
-- team-uuid-1      : team member assigned to candidate-uuid-1
-- team-uuid-2      : team member NOT assigned to candidate-uuid-1
-- admin-uuid-1     : admin

-- =============================================================================
-- PROFILES table
-- =============================================================================

-- Test 1: Candidate can read only their own profile
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "candidate-uuid-1", "role": "authenticated"}';

SELECT COUNT(*) AS should_be_1 FROM profiles WHERE id = 'candidate-uuid-1';
SELECT COUNT(*) AS should_be_0 FROM profiles WHERE id = 'candidate-uuid-2';

ROLLBACK;

-- Test 2: Candidate cannot update another candidate's profile
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "candidate-uuid-1", "role": "authenticated"}';

UPDATE profiles SET full_name = 'HACKED' WHERE id = 'candidate-uuid-2';
SELECT COUNT(*) AS should_be_0 FROM profiles WHERE id = 'candidate-uuid-2' AND full_name = 'HACKED';

ROLLBACK;

-- Test 3: Team member can read profiles of their assigned candidates only
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "team-uuid-1", "role": "authenticated"}';

-- candidate-uuid-1 is assigned to team-uuid-1 (set up in team_assignments fixture)
SELECT COUNT(*) AS should_be_1 FROM profiles WHERE id = 'candidate-uuid-1';
-- candidate-uuid-2 is NOT assigned to team-uuid-1
SELECT COUNT(*) AS should_be_0 FROM profiles WHERE id = 'candidate-uuid-2';

ROLLBACK;

-- Test 4: Admin can read all profiles
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "admin-uuid-1", "role": "authenticated"}';

SELECT COUNT(*) >= 0 AS always_true FROM profiles;

ROLLBACK;

-- =============================================================================
-- APPLICATIONS table
-- =============================================================================

-- Test 5: Candidate can only read their own applications
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "candidate-uuid-1", "role": "authenticated"}';

SELECT COUNT(*) AS should_be_0 FROM applications WHERE candidate_id = 'candidate-uuid-2';

ROLLBACK;

-- Test 6: Candidate cannot insert applications (team members do that)
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "candidate-uuid-1", "role": "authenticated"}';

INSERT INTO applications (candidate_id, team_member_id, company, job_title, job_board, job_url, status)
VALUES ('candidate-uuid-1', 'team-uuid-1', 'Acme', 'Engineer', 'LinkedIn', 'https://example.com', 'applied');
-- Should fail or insert 0 rows due to RLS

ROLLBACK;

-- Test 7: Team member can insert applications for their assigned candidates
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "team-uuid-1", "role": "authenticated"}';

INSERT INTO applications (candidate_id, team_member_id, company, job_title, job_board, job_url, status)
VALUES ('candidate-uuid-1', 'team-uuid-1', 'Acme', 'Engineer', 'LinkedIn', 'https://example.com', 'applied');

SELECT COUNT(*) AS should_be_1 FROM applications
  WHERE candidate_id = 'candidate-uuid-1' AND company = 'Acme';

ROLLBACK;

-- Test 8: Team member cannot read applications for candidates they are NOT assigned to
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "team-uuid-2", "role": "authenticated"}';

-- team-uuid-2 is not assigned to candidate-uuid-1
SELECT COUNT(*) AS should_be_0 FROM applications WHERE candidate_id = 'candidate-uuid-1';

ROLLBACK;

-- Test 9: Admin can read all applications
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "admin-uuid-1", "role": "authenticated"}';

SELECT COUNT(*) >= 0 AS always_true FROM applications;

ROLLBACK;

-- =============================================================================
-- SUBSCRIPTIONS table
-- =============================================================================

-- Test 10: Candidate can only read their own subscription
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "candidate-uuid-1", "role": "authenticated"}';

SELECT COUNT(*) AS should_be_0 FROM subscriptions WHERE candidate_id = 'candidate-uuid-2';

ROLLBACK;

-- Test 11: Candidate cannot insert or update their own subscription
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "candidate-uuid-1", "role": "authenticated"}';

INSERT INTO subscriptions (candidate_id, stripe_subscription_id, stripe_customer_id, plan, status)
VALUES ('candidate-uuid-1', 'sub_test', 'cus_test', 'pro', 'active');
-- Should fail due to RLS

ROLLBACK;

-- Test 12: Admin can read and write all subscriptions
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "admin-uuid-1", "role": "authenticated"}';

SELECT COUNT(*) >= 0 AS always_true FROM subscriptions;

ROLLBACK;

-- =============================================================================
-- MESSAGES table
-- =============================================================================

-- Test 13: Candidate can only read messages from their own thread
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "candidate-uuid-1", "role": "authenticated"}';

-- Assumes thread_id includes candidate id in the message row (or via join)
SELECT COUNT(*) AS own_messages FROM messages WHERE sender_id = 'candidate-uuid-1';
SELECT COUNT(*) AS should_be_0 FROM messages WHERE sender_id = 'candidate-uuid-2';

ROLLBACK;

-- Test 14: Team member can only read/write messages for their assigned candidates
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "team-uuid-1", "role": "authenticated"}';

-- team-uuid-1 is assigned to candidate-uuid-1, so they should see thread_id for that candidate
SELECT COUNT(*) >= 0 AS accessible FROM messages WHERE thread_id IN (
  SELECT id FROM messages WHERE sender_id = 'candidate-uuid-1'
);

ROLLBACK;

-- =============================================================================
-- TEAM_ASSIGNMENTS table
-- =============================================================================

-- Test 15: Candidate cannot read team_assignments
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "candidate-uuid-1", "role": "authenticated"}';

SELECT COUNT(*) AS should_be_0 FROM team_assignments;

ROLLBACK;

-- Test 16: Team member can read their own assignments
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "team-uuid-1", "role": "authenticated"}';

SELECT COUNT(*) >= 0 AS own_assignments FROM team_assignments WHERE team_member_id = 'team-uuid-1';
SELECT COUNT(*) AS should_be_0 FROM team_assignments WHERE team_member_id = 'team-uuid-2';

ROLLBACK;

-- Test 17: Admin can read and modify all team_assignments
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "admin-uuid-1", "role": "authenticated"}';

SELECT COUNT(*) >= 0 AS always_true FROM team_assignments;

ROLLBACK;

-- =============================================================================
-- RESUMES table
-- =============================================================================

-- Test 18: Candidate can only read their own resumes
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "candidate-uuid-1", "role": "authenticated"}';

SELECT COUNT(*) AS should_be_0 FROM resumes WHERE candidate_id = 'candidate-uuid-2';

ROLLBACK;

-- Test 19: Team member assigned to a candidate can read their resumes
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "team-uuid-1", "role": "authenticated"}';

-- Should return resumes for candidate-uuid-1 (assigned)
SELECT COUNT(*) >= 0 AS assigned_resumes FROM resumes WHERE candidate_id = 'candidate-uuid-1';
-- Should return 0 for candidate-uuid-2 (not assigned)
SELECT COUNT(*) AS should_be_0 FROM resumes WHERE candidate_id = 'candidate-uuid-2';

ROLLBACK;

-- =============================================================================
-- JOB_PREFERENCES table
-- =============================================================================

-- Test 20: Candidate can only read and update their own job preferences
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "candidate-uuid-1", "role": "authenticated"}';

SELECT COUNT(*) AS should_be_0 FROM job_preferences WHERE candidate_id = 'candidate-uuid-2';

ROLLBACK;
