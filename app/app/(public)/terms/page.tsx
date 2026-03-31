import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service — CareerProxy',
  description: 'CareerProxy Terms of Service — the rules and conditions for using our platform.',
}

export default function TermsPage() {
  const lastUpdated = 'March 31, 2025'

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-slate-500 mb-10">Last updated: {lastUpdated}</p>

      <div className="prose prose-slate max-w-none space-y-8 text-slate-700">

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing or using CareerProxy (&quot;the Service&quot;), you agree to be bound by these Terms of Service
            (&quot;Terms&quot;). If you do not agree to these Terms, do not use the Service. These Terms constitute a
            legally binding agreement between you and CareerProxy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Description of Service</h2>
          <p>
            CareerProxy is a subscription-based platform that provides job application services. Our team members
            apply to jobs on your behalf according to your stated job preferences and the limits of your chosen plan.
            We offer three tiers:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>Starter ($99/month):</strong> Up to 50 applications per month.</li>
            <li><strong>Pro ($199/month):</strong> Up to 100 applications per month, weekly email reports, and team messaging.</li>
            <li><strong>Premium ($299/month):</strong> Unlimited applications, all Pro features, cover letter customization, LinkedIn profile review, and priority assignment.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Account Registration</h2>
          <p>
            To use the Service, you must create an account. You agree to provide accurate, current, and complete
            information and to keep your account information updated. You are responsible for maintaining the
            confidentiality of your credentials and for all activity under your account.
            You must be at least 18 years old to use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Subscriptions and Billing</h2>
          <p>
            Subscriptions are billed monthly in advance. All fees are in US dollars and are non-refundable
            except as expressly stated in these Terms or required by applicable law. We reserve the right
            to change pricing with 30 days notice.
          </p>
          <p className="mt-3">
            Payments are processed by Stripe. By providing payment information, you authorize CareerProxy
            to charge your payment method on a recurring monthly basis until you cancel.
            You may cancel your subscription at any time; cancellations take effect at the end of the current billing period.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Refund Policy</h2>
          <p>
            We offer a pro-rated refund if you cancel within 7 days of your initial subscription start
            and fewer than 10 applications have been submitted on your behalf. After that period, all
            sales are final. Refund requests may be submitted to{' '}
            <a href="mailto:support@careerproxy.com" className="text-indigo-600 hover:underline">support@careerproxy.com</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Your Responsibilities</h2>
          <p>You agree to:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Provide accurate job preferences, resume, and personal information.</li>
            <li>Keep your profile and preferences up to date so we can apply to suitable roles.</li>
            <li>Not use the Service for any unlawful purpose or in violation of any third-party rights.</li>
            <li>Not attempt to reverse engineer, scrape, or interfere with the platform.</li>
            <li>Understand that CareerProxy applies on your behalf but cannot guarantee interviews or job offers.</li>
            <li>Disclose any employment restrictions (e.g., non-compete agreements) that may affect your job search.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Service Limitations and Disclaimers</h2>
          <p>
            CareerProxy does not guarantee any specific number of applications per day, interview invitations,
            or job offers. Application limits are maximums, not guarantees. The Service is provided &quot;as is&quot;
            without warranties of any kind, express or implied.
          </p>
          <p className="mt-3">
            We are not liable for rejections, ghosting by employers, or any outcome of applications submitted
            on your behalf. Our team members follow your stated preferences in good faith.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Intellectual Property</h2>
          <p>
            You retain ownership of your resume, personal information, and job preferences you provide.
            You grant CareerProxy a limited, non-exclusive license to use this content solely for the purpose
            of delivering the Service. CareerProxy owns all rights to the platform, software, branding, and
            content we create.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">9. Privacy</h2>
          <p>
            Your use of the Service is also governed by our{' '}
            <Link href="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</Link>,
            which is incorporated into these Terms by reference.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">10. Termination</h2>
          <p>
            Either party may terminate the service agreement at any time. CareerProxy may suspend or terminate
            your account for violations of these Terms, fraudulent activity, chargebacks, or abuse of our team members.
            Upon termination, your access to the platform will be revoked and your data will be retained per our
            Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">11. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, CareerProxy shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages, or any loss of profits or revenues, arising out of your
            use of the Service. Our total liability to you for any claims arising from these Terms or the Service
            shall not exceed the amount you paid us in the 3 months preceding the claim.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">12. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the State of Delaware,
            United States, without regard to its conflict of law provisions. Any disputes shall be resolved
            through binding arbitration under the American Arbitration Association rules, except for claims
            that may be brought in small claims court.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">13. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. We will notify you of material changes at least
            14 days in advance via email or platform notice. Continued use of the Service after the effective
            date of revised Terms constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">14. Contact</h2>
          <p>
            For questions about these Terms, contact us at:
          </p>
          <div className="mt-3 bg-slate-50 rounded-lg p-4 text-sm">
            <p><strong>CareerProxy</strong></p>
            <p>Email: <a href="mailto:legal@careerproxy.com" className="text-indigo-600 hover:underline">legal@careerproxy.com</a></p>
            <p>Website: <Link href="/" className="text-indigo-600 hover:underline">careerproxy.com</Link></p>
          </div>
        </section>
      </div>
    </div>
  )
}
