import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { WeeklyReportEmail } from '@/emails/WeeklyReportEmail'

// This route is called by Vercel Cron every Monday at 9am UTC
// Vercel cron config in vercel.json: { "path": "/api/cron/weekly-report", "schedule": "0 9 * * 1" }
export async function GET(req: NextRequest) {
  // Verify cron secret
  const secret = req.headers.get('authorization')
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const resend = new Resend(process.env.RESEND_API_KEY)

  // Get date range for past 7 days
  const now = new Date()
  const weekEnd = new Date(now)
  const weekStart = new Date(now)
  weekStart.setDate(weekStart.getDate() - 7)

  const weekStartISO = weekStart.toISOString()

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  // Query all active Pro/Premium candidates
  const { data: activeSubs } = await supabase
    .from('subscriptions')
    .select('candidate_id, plan')
    .in('plan', ['pro', 'premium'])
    .eq('status', 'active')

  if (!activeSubs || activeSubs.length === 0) {
    return NextResponse.json({ message: 'No active Pro/Premium candidates found', sent: 0 })
  }

  const candidateIds = activeSubs.map((s: { candidate_id: string; plan: string }) => s.candidate_id)

  // Fetch candidate profiles
  const { data: candidates } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .in('id', candidateIds)

  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ message: 'No candidate profiles found', sent: 0 })
  }

  let sent = 0
  const errors: string[] = []

  for (const candidate of candidates as Array<{ id: string; email: string; full_name: string }>) {
    try {
      // Get applications for the past 7 days
      const { data: applications } = await supabase
        .from('applications')
        .select('status')
        .eq('candidate_id', candidate.id)
        .is('deleted_at', null)
        .gte('applied_at', weekStartISO)

      const apps = applications ?? []

      const statusBreakdown = {
        applied: 0,
        viewed: 0,
        interview_scheduled: 0,
        rejected: 0,
        offer: 0,
      }

      for (const app of apps as Array<{ status: string }>) {
        if (app.status in statusBreakdown) {
          statusBreakdown[app.status as keyof typeof statusBreakdown]++
        }
      }

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@careerproxy.com',
        to: [candidate.email],
        subject: `Your CareerProxy Weekly Report — ${formatDate(weekStart)} to ${formatDate(weekEnd)}`,
        react: WeeklyReportEmail({
          candidateName: candidate.full_name,
          weekStart: formatDate(weekStart),
          weekEnd: formatDate(weekEnd),
          totalApplications: apps.length,
          statusBreakdown,
          interviewsScheduled: statusBreakdown.interview_scheduled,
        }),
      })

      sent++
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      errors.push(`Failed for candidate ${candidate.id}: ${message}`)
      console.error(`Weekly report error for candidate ${candidate.id}:`, err)
    }
  }

  return NextResponse.json({ sent, errors: errors.length > 0 ? errors : undefined })
}
