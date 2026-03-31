import { Html, Body, Heading, Text, Button, Section, Hr } from '@react-email/components'

interface WelcomeEmailProps {
  name: string
}

export function WelcomeEmail({ name }: WelcomeEmailProps) {
  return (
    <Html>
      <Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f8fafc', margin: 0, padding: '40px 0' }}>
        <Section style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '8px', padding: '40px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <Heading style={{ color: '#1e293b', fontSize: '28px', marginBottom: '8px' }}>
            Welcome to CareerProxy, {name}!
          </Heading>
          <Text style={{ color: '#64748b', fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
            We are excited to have you on the team. Your account has been created and you are ready to get started.
          </Text>

          <Section style={{ backgroundColor: '#f1f5f9', borderRadius: '6px', padding: '20px', marginBottom: '24px' }}>
            <Text style={{ color: '#334155', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
              <strong>Next steps:</strong>
            </Text>
            <Text style={{ color: '#334155', fontSize: '14px', margin: '8px 0 0 0', lineHeight: '1.6' }}>
              1. Log in to your dashboard to view your assigned candidates.<br />
              2. Review each candidate&apos;s job preferences and resume.<br />
              3. Start logging applications on their behalf.
            </Text>
          </Section>

          <Button
            href="https://careerproxy.com/login"
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
            Go to Dashboard
          </Button>

          <Hr style={{ borderColor: '#e2e8f0', margin: '32px 0 16px' }} />

          <Text style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.5' }}>
            You received this email because an account was created for you at CareerProxy.
            If you did not expect this email, please contact support at support@careerproxy.com.
          </Text>
        </Section>
      </Body>
    </Html>
  )
}

export default WelcomeEmail
