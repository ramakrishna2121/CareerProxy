import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — CareerProxy',
  description: 'CareerProxy Privacy Policy — how we collect, use, and protect your personal data.',
}

export default function PrivacyPage() {
  const lastUpdated = 'March 31, 2025'

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-slate-500 mb-10">Last updated: {lastUpdated}</p>

      <div className="prose prose-slate max-w-none space-y-8 text-slate-700">

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Introduction</h2>
          <p>
            CareerProxy (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the CareerProxy platform at careerproxy.com.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information
            when you use our services. We are committed to protecting your privacy and complying with applicable
            data protection laws, including the General Data Protection Regulation (GDPR) and the California
            Consumer Privacy Act (CCPA).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Information We Collect</h2>
          <p>We collect the following categories of personal information:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>Account Information:</strong> Name, email address, and password (hashed) when you create an account.</li>
            <li><strong>Profile Information:</strong> Job preferences, target job titles, locations, industries, salary range, visa sponsorship needs, and work type preferences.</li>
            <li><strong>Resume Data:</strong> Resume files (PDF or DOCX) you upload to our platform.</li>
            <li><strong>Application Data:</strong> Records of job applications submitted on your behalf, including company names, job titles, application URLs, and application status.</li>
            <li><strong>Billing Information:</strong> Subscription plan and payment information processed by Stripe. We do not store raw payment card data.</li>
            <li><strong>Usage Data:</strong> Log data, IP addresses, browser type, and pages visited for security and analytics purposes.</li>
            <li><strong>Communications:</strong> Messages exchanged between you and your assigned team member within the platform.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Provide, operate, and improve the CareerProxy service.</li>
            <li>Apply to jobs on your behalf according to your preferences and plan.</li>
            <li>Send you weekly application reports and transactional emails (account creation, password reset).</li>
            <li>Process payments and manage your subscription via Stripe.</li>
            <li>Assign a dedicated team member to your account and facilitate communication.</li>
            <li>Comply with legal obligations and enforce our Terms of Service.</li>
            <li>Detect and prevent fraud, abuse, or security incidents.</li>
          </ul>
          <p className="mt-3">
            <strong>Legal basis (GDPR):</strong> We process your data based on performance of a contract
            (to deliver the service you subscribed to), legitimate interests (fraud prevention, service improvement),
            and your consent where required.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Data Sharing and Disclosure</h2>
          <p>We do not sell your personal data. We share your information only with:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>Team Members:</strong> CareerProxy staff assigned to apply to jobs on your behalf. They have access only to the data necessary to perform applications.</li>
            <li><strong>Stripe:</strong> Our payment processor. See <a href="https://stripe.com/privacy" className="text-indigo-600 hover:underline" target="_blank" rel="noopener noreferrer">Stripe&apos;s Privacy Policy</a>.</li>
            <li><strong>Supabase:</strong> Our database and authentication provider. Data is stored on infrastructure in the US.</li>
            <li><strong>Resend:</strong> Our email delivery provider for transactional and report emails.</li>
            <li><strong>Vercel:</strong> Our hosting provider. See <a href="https://vercel.com/legal/privacy-policy" className="text-indigo-600 hover:underline" target="_blank" rel="noopener noreferrer">Vercel&apos;s Privacy Policy</a>.</li>
            <li><strong>Legal requirements:</strong> When required by law, court order, or governmental authority.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Your Rights (GDPR &amp; CCPA)</h2>
          <p>Depending on your location, you have the following rights regarding your personal data:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>Right to Access:</strong> Request a copy of the personal data we hold about you.</li>
            <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete data.</li>
            <li><strong>Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> Request deletion of your personal data, subject to legal retention requirements.</li>
            <li><strong>Right to Restriction:</strong> Request that we limit how we process your data.</li>
            <li><strong>Right to Data Portability:</strong> Receive your data in a structured, machine-readable format.</li>
            <li><strong>Right to Object:</strong> Object to processing based on legitimate interests.</li>
            <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time where processing is consent-based.</li>
            <li><strong>CCPA (California):</strong> California residents have the right to know, delete, and opt out of the sale of personal information. We do not sell personal information.</li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, email us at{' '}
            <a href="mailto:privacy@careerproxy.com" className="text-indigo-600 hover:underline">
              privacy@careerproxy.com
            </a>. We will respond within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Data Retention</h2>
          <p>
            We retain your personal data for as long as your account is active or as needed to provide services.
            After account deletion, we retain minimal data for up to 90 days for fraud prevention and legal compliance
            before permanent deletion. Resume files are deleted from storage upon your request or 30 days after account deletion.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Data Security</h2>
          <p>
            We implement industry-standard security measures including encrypted transmission (HTTPS/TLS),
            encrypted storage, row-level security (RLS) in our database, and access controls that limit
            data access to authorized personnel only. However, no method of transmission or storage is 100% secure.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">8. International Data Transfers</h2>
          <p>
            Your data may be processed in the United States. By using CareerProxy, you consent to the
            transfer of your data to the US. We rely on Standard Contractual Clauses (SCCs) for transfers
            from the European Economic Area (EEA) where required by GDPR.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">9. Cookies and Tracking</h2>
          <p>
            We use essential cookies for authentication (session management). We use Vercel Analytics
            for anonymized performance monitoring. We do not use advertising or third-party tracking cookies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">10. Children&apos;s Privacy</h2>
          <p>
            CareerProxy is not directed at children under 16. We do not knowingly collect personal data from
            children. If you believe we have inadvertently collected data from a child, contact us immediately.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of significant changes
            by email or a prominent notice on our platform. Continued use of the service after changes
            constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">12. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or wish to exercise your rights, contact us at:
          </p>
          <div className="mt-3 bg-slate-50 rounded-lg p-4 text-sm">
            <p><strong>CareerProxy</strong></p>
            <p>Email: <a href="mailto:privacy@careerproxy.com" className="text-indigo-600 hover:underline">privacy@careerproxy.com</a></p>
            <p>Website: <Link href="/" className="text-indigo-600 hover:underline">careerproxy.com</Link></p>
          </div>
        </section>
      </div>
    </div>
  )
}
