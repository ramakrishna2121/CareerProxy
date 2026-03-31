-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  phone text,
  role text not null default 'candidate' check (role in ('candidate', 'team_member', 'admin')),
  plan text check (plan in ('starter', 'pro', 'premium')),
  status text not null default 'active' check (status in ('active', 'paused', 'inactive')),
  onboarding_complete boolean not null default false,
  team_member_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- JOB PREFERENCES
-- ============================================================
create table public.job_preferences (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid not null references public.profiles(id) on delete cascade unique,
  target_titles text[] not null default '{}',
  industries text[] not null default '{}',
  locations text[] not null default '{}',
  salary_min integer,
  salary_max integer,
  work_type text check (work_type in ('remote', 'hybrid', 'onsite')),
  visa_sponsorship boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- RESUMES
-- ============================================================
create table public.resumes (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  file_url text not null,
  file_name text not null,
  file_type text not null check (file_type in ('pdf', 'docx')),
  is_active boolean not null default false,
  uploaded_at timestamptz not null default now()
);

-- ============================================================
-- APPLICATIONS
-- ============================================================
create table public.applications (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  team_member_id uuid not null references public.profiles(id),
  company text not null,
  job_title text not null,
  job_board text not null check (job_board in ('LinkedIn', 'Indeed', 'Glassdoor')),
  job_url text not null,
  status text not null default 'applied' check (status in (
    'applied', 'viewed', 'interview_scheduled', 'rejected', 'offer', 'withdrawn'
  )),
  applied_at timestamptz not null default now(),
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- MESSAGES
-- ============================================================
create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  thread_id uuid not null,  -- equals candidate_id (one thread per candidate)
  sender_id uuid not null references public.profiles(id),
  sender_role text not null check (sender_role in ('candidate', 'team_member')),
  content text not null check (length(content) > 0),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid not null references public.profiles(id) on delete cascade unique,
  stripe_subscription_id text not null unique,
  stripe_customer_id text not null,
  stripe_event_ids text[] not null default '{}',  -- for idempotency
  plan text not null check (plan in ('starter', 'pro', 'premium')),
  status text not null check (status in ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  current_period_end timestamptz not null,
  cancel_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- TEAM ASSIGNMENTS
-- ============================================================
create table public.team_assignments (
  id uuid primary key default uuid_generate_v4(),
  team_member_id uuid not null references public.profiles(id) on delete cascade,
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(candidate_id)  -- a candidate can only have one team member
);

-- ============================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function update_updated_at();
create trigger applications_updated_at before update on public.applications
  for each row execute function update_updated_at();
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function update_updated_at();

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'candidate'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
