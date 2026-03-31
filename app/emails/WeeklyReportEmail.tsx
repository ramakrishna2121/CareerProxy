import { Html, Body, Heading, Text, Section, Hr, Row, Column } from '@react-email/components'

interface ApplicationStatusBreakdown {
  applied: number
  viewed: number
  interview_scheduled: number
  rejected: number
  offer: number
}

interface WeeklyReportEmailProps {
  candidateName: string
  weekStart: string // e.g. "March 24, 2025"
  weekEnd: string   // e.g. "March 30, 2025"
  totalApplications: number
  statusBreakdown: ApplicationStatusBreakdown
  interviewsScheduled: number
}

export function WeeklyReportEmail({
  candidateName,
  weekStart,
  weekEnd,
  totalApplications,
  statusBreakdown,
  interviewsScheduled,
}: WeeklyReportEmailProps) {
  const statusLabels: Record<keyof ApplicationStatusBreakdown, string> = {
    applied: 'Applied',
    viewed: 'Viewed by Employer',
    interview_scheduled: 'Interview Scheduled',
    rejected: 'Rejected',
    offer: 'Offer Received',
  }

  const statusColors: Record<keyof ApplicationStatusBreakdown, string> = {
    applied: '#4f46e5',
    viewed: '#0891b2',
    interview_scheduled: '#16a34a',
    rejected: '#dc2626',
    offer: '#d97706',
  }

  return (
    <Html>
      <Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f8fafc', margin: 0, padding: '40px 0' }}>
        <Section style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '8px', padding: '40px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          {/* Header */}
          <Section style={{ backgroundColor: '#4f46e5', borderRadius: '6px', padding: '24px', marginBottom: '24px', textAlign: 'center' as const }}>
            <Heading style={{ color: '#ffffff', fontSize: '22px', margin: 0 }}>
              Your Weekly Job Application Report
            </Heading>
            <Text style={{ color: '#c7d2fe', fontSize: '14px', margin: '8px 0 0 0' }}>
              {weekStart} – {weekEnd}
            </Text>
          </Section>

          <Text style={{ color: '#334155', fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
            Hi {candidateName},
          </Text>
          <Text style={{ color: '#334155', fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
            Here is a summary of the job applications submitted on your behalf this week.
          </Text>

          {/* Total Applications Card */}
          <Section style={{ backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '24px', marginBottom: '24px', textAlign: 'center' as const }}>
            <Text style={{ color: '#64748b', fontSize: '14px', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Applications This Week
            </Text>
            <Heading style={{ color: '#1e293b', fontSize: '48px', margin: 0, lineHeight: 1 }}>
              {totalApplications}
            </Heading>
          </Section>

          {/* Interviews Scheduled Banner */}
          {interviewsScheduled > 0 && (
            <Section style={{ backgroundColor: '#dcfce7', borderRadius: '8px', padding: '16px', marginBottom: '24px', textAlign: 'center' as const }}>
              <Text style={{ color: '#166534', fontSize: '16px', fontWeight: '600', margin: 0 }}>
                {interviewsScheduled} Interview{interviewsScheduled !== 1 ? 's' : ''} Scheduled This Week!
              </Text>
            </Section>
          )}

          {/* Status Breakdown */}
          <Heading style={{ color: '#1e293b', fontSize: '18px', marginBottom: '16px' }}>
            Application Status Breakdown
          </Heading>

          {(Object.keys(statusBreakdown) as Array<keyof ApplicationStatusBreakdown>).map((status) => (
            <Row key={status} style={{ marginBottom: '10px' }}>
              <Column style={{ width: '160px' }}>
                <Text style={{ color: '#475569', fontSize: '14px', margin: 0 }}>
                  {statusLabels[status]}
                </Text>
              </Column>
              <Column>
                <Section style={{ backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', height: '24px', position: 'relative' as const }}>
                  {statusBreakdown[status] > 0 && (
                    <Section
                      style={{
                        backgroundColor: statusColors[status],
                        width: `${Math.min((statusBreakdown[status] / Math.max(totalApplications, 1)) * 100, 100)}%`,
                        height: '24px',
                        display: 'inline-block',
                      }}
                    />
                  )}
                </Section>
              </Column>
              <Column style={{ width: '40px', textAlign: 'right' as const }}>
                <Text style={{ color: '#1e293b', fontSize: '14px', fontWeight: '600', margin: 0 }}>
                  {statusBreakdown[status]}
                </Text>
              </Column>
            </Row>
          ))}

          <Hr style={{ borderColor: '#e2e8f0', margin: '24px 0' }} />

          <Text style={{ color: '#334155', fontSize: '14px', lineHeight: '1.6', marginBottom: '16px' }}>
            Keep it up! The CareerProxy team is working hard to maximize your opportunities.
            Log in to your dashboard to view detailed application history and communicate with your team member.
          </Text>

          <Section style={{ textAlign: 'center' as const }}>
            <a
              href="https://careerproxy.com/dashboard"
              style={{
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '600',
                display: 'inline-block',
              }}
            >
              View Full Dashboard
            </a>
          </Section>

          <Hr style={{ borderColor: '#e2e8f0', margin: '24px 0 16px' }} />

          <Text style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.5' }}>
            You are receiving this weekly report as a CareerProxy Pro or Premium subscriber.
            To manage your email preferences, visit your{' '}
            <a href="https://careerproxy.com/dashboard/billing" style={{ color: '#4f46e5' }}>account settings</a>.
          </Text>
        </Section>
      </Body>
    </Html>
  )
}

export default WeeklyReportEmail
