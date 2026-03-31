-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.job_preferences enable row level security;
alter table public.resumes enable row level security;
alter table public.applications enable row level security;
alter table public.messages enable row level security;
alter table public.subscriptions enable row level security;
alter table public.team_assignments enable row level security;

-- Helper: check if the current user is an admin
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- Helper: check if current user is a team member assigned to a given candidate
create or replace function is_assigned_team_member(p_candidate_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.team_assignments
    where team_member_id = auth.uid() and candidate_id = p_candidate_id
  );
$$ language sql security definer stable;

-- ============================================================
-- PROFILES
-- ============================================================
create policy "Candidates can view own profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "Candidates can update own profile"
  on public.profiles for update
  using (id = auth.uid());

create policy "Team members can view assigned candidates"
  on public.profiles for select
  using (is_assigned_team_member(id));

create policy "Admins have full profile access"
  on public.profiles for all
  using (is_admin());

-- ============================================================
-- JOB PREFERENCES
-- ============================================================
create policy "Candidates can manage own preferences"
  on public.job_preferences for all
  using (candidate_id = auth.uid());

create policy "Team members can view assigned candidate preferences"
  on public.job_preferences for select
  using (is_assigned_team_member(candidate_id));

create policy "Admins have full preferences access"
  on public.job_preferences for all
  using (is_admin());

-- ============================================================
-- RESUMES
-- ============================================================
create policy "Candidates can manage own resumes"
  on public.resumes for all
  using (candidate_id = auth.uid());

create policy "Team members can view assigned candidate resumes"
  on public.resumes for select
  using (is_assigned_team_member(candidate_id));

create policy "Admins have full resume access"
  on public.resumes for all
  using (is_admin());

-- ============================================================
-- APPLICATIONS
-- ============================================================
create policy "Candidates can view own applications"
  on public.applications for select
  using (candidate_id = auth.uid() and deleted_at is null);

create policy "Team members can view assigned candidate applications"
  on public.applications for select
  using (is_assigned_team_member(candidate_id) and deleted_at is null);

create policy "Team members can insert applications for assigned candidates"
  on public.applications for insert
  with check (is_assigned_team_member(candidate_id));

create policy "Team members can update applications for assigned candidates"
  on public.applications for update
  using (is_assigned_team_member(candidate_id));

create policy "Admins have full application access"
  on public.applications for all
  using (is_admin());

-- ============================================================
-- MESSAGES
-- ============================================================
create policy "Candidates can access own thread"
  on public.messages for all
  using (thread_id = auth.uid());

create policy "Team members can access assigned candidate threads"
  on public.messages for all
  using (is_assigned_team_member(thread_id));

create policy "Admins have full message access"
  on public.messages for all
  using (is_admin());

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
create policy "Candidates can view own subscription"
  on public.subscriptions for select
  using (candidate_id = auth.uid());

create policy "Admins have full subscription access"
  on public.subscriptions for all
  using (is_admin());

-- ============================================================
-- TEAM ASSIGNMENTS
-- ============================================================
create policy "Team members can view their own assignments"
  on public.team_assignments for select
  using (team_member_id = auth.uid());

create policy "Candidates can view their own assignment"
  on public.team_assignments for select
  using (candidate_id = auth.uid());

create policy "Admins have full assignment access"
  on public.team_assignments for all
  using (is_admin());
