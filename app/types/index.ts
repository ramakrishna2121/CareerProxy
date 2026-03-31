export type UserRole = 'candidate' | 'team_member' | 'admin'

export type ApplicationStatus =
  | 'applied'
  | 'viewed'
  | 'interview_scheduled'
  | 'rejected'
  | 'offer'
  | 'withdrawn'

export type JobBoard = 'LinkedIn' | 'Indeed' | 'Glassdoor'

export type WorkType = 'remote' | 'hybrid' | 'onsite'

export type SubscriptionPlan = 'starter' | 'pro' | 'premium'

export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'trialing'
  | 'incomplete'

export interface Profile {
  id: string
  email: string
  full_name: string
  phone?: string
  role: UserRole
  plan?: SubscriptionPlan
  status: 'active' | 'paused' | 'inactive'
  onboarding_complete: boolean
  team_member_id?: string
  created_at: string
  updated_at: string
}

export interface JobPreferences {
  id: string
  candidate_id: string
  target_titles: string[]
  industries: string[]
  locations: string[]
  salary_min?: number
  salary_max?: number
  work_type?: WorkType
  visa_sponsorship: boolean
  updated_at: string
}

export interface Resume {
  id: string
  candidate_id: string
  file_url: string
  file_name: string
  file_type: 'pdf' | 'docx'
  is_active: boolean
  uploaded_at: string
}

export interface Application {
  id: string
  candidate_id: string
  team_member_id: string
  company: string
  job_title: string
  job_board: JobBoard
  job_url: string
  status: ApplicationStatus
  applied_at: string
  notes?: string
  deleted_at?: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  thread_id: string
  sender_id: string
  sender_role: 'candidate' | 'team_member'
  content: string
  created_at: string
  read_at?: string
}

export interface Subscription {
  id: string
  candidate_id: string
  stripe_subscription_id: string
  stripe_customer_id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  current_period_end: string
  cancel_at?: string
  created_at: string
  updated_at: string
}

export interface TeamAssignment {
  id: string
  team_member_id: string
  candidate_id: string
  created_at: string
}

export interface DashboardStats {
  total_apps_this_month: number
  interviews_scheduled: number
  plan: SubscriptionPlan | null
  plan_status: SubscriptionStatus | null
}

export interface Metrics {
  total_candidates: number
  active_subscriptions: number
  mrr: number
  total_applications: number
  avg_apps_per_candidate: number
}

export const PLAN_DAILY_LIMITS: Record<SubscriptionPlan, number | null> = {
  starter: 50,
  pro: 100,
  premium: null, // unlimited
}

export const PLAN_PRICES_USD: Record<SubscriptionPlan, number> = {
  starter: 99,
  pro: 199,
  premium: 299,
}

export const PLAN_FEATURES: Record<SubscriptionPlan, string[]> = {
  starter: ['50 applications/month', 'Basic application tracker', 'Email support'],
  pro: [
    '100 applications/month',
    'Full application tracker',
    'Weekly email reports',
    'Team chat / messaging',
    'Email + Chat support',
  ],
  premium: [
    'Unlimited applications',
    'Full application tracker + priority',
    'Weekly email reports',
    'Team chat / messaging',
    'Cover letter customisation',
    'LinkedIn profile review',
    'Priority assignment',
    'Dedicated support',
  ],
}
