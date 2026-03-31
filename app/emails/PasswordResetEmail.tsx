import { Html, Body, Heading, Text, Button, Section, Hr } from '@react-email/components'

interface PasswordResetEmailProps {
  name: string
  resetUrl: string
}

export function PasswordResetEmail({ name, resetUrl }: PasswordResetEmailProps) {
  return (
    <Html>
      <Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f8fafc', margin: 0, padding: '40px 0' }}>
        <Section style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '8px', padding: '40px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <Heading style={{ color: '#1e293b', fontSize: '28px', marginBottom: '8px' }}>
            Reset your password
          </Heading>
          <Text style={{ color: '#64748b', fontSize: '16px', lineHeight: '1.6', marginBottom: '8px' }}>
            Hi {name},
          </Text>
          <Text style={{ color: '#64748b', fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
            We received a request to reset the password for your CareerProxy account.
            Click the button below to choose a new password. This link expires in 1 hour.
          </Text>

          <Button
            href={resetUrl}
            style={{
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '600',
              display: 'inline-block',
              marginBottom: '24px',
            }}
          >
            Reset Password
          </Button>

          <Section style={{ backgroundColor: '#fef9c3', borderRadius: '6px', padding: '16px', marginBottom: '24px' }}>
            <Text style={{ color: '#854d0e', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
              If you did not request a password reset, you can safely ignore this email.
              Your password will not change.
            </Text>
          </Section>

          <Hr style={{ borderColor: '#e2e8f0', margin: '16px 0' }} />

          <Text style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.5' }}>
            This link expires in 1 hour. If you need a new reset link, visit{' '}
            <a href="https://careerproxy.com/login" style={{ color: '#4f46e5' }}>careerproxy.com/login</a>.
          </Text>
        </Section>
      </Body>
    </Html>
  )
}

export default PasswordResetEmail
