import Link from 'next/link'

const steps = [
  {
    number: '01',
    title: 'Create your account and upload your resume',
    description:
      'Sign up in under two minutes. Upload your resume in PDF or DOCX format. Our team reviews it and identifies the roles you are best suited for.',
    details: [
      'Secure file storage — your resume is never shared without your consent',
      'We support PDF and DOCX formats up to 10 MB',
      'One active resume at a time; update it any time in your dashboard',
    ],
  },
  {
    number: '02',
    title: 'Tell us your job preferences',
    description:
      'Fill in your target job titles, industries, preferred locations, and work type (remote, hybrid, onsite). Let us know if you need visa sponsorship.',
    details: [
      'Target multiple job titles and industries simultaneously',
      'Filter by remote, hybrid, or onsite positions',
      'Enable visa sponsorship filter to only target companies that sponsor H-1B/OPT',
    ],
  },
  {
    number: '03',
    title: 'Our team applies daily on your behalf',
    description:
      'Once you subscribe, our team starts applying to jobs every business day across LinkedIn, Indeed, and Glassdoor. Each application is personalised — we match your resume to the job description.',
    details: [
      'Starter: up to 50 applications/month',
      'Pro: up to 100 applications/month',
      'Premium: unlimited applications with cover letter customisation',
    ],
  },
  {
    number: '04',
    title: 'Track progress and show up to interviews',
    description:
      'Every application we submit appears in your real-time dashboard with the company name, role, job board, and current status. You will see when a company views your application or schedules an interview.',
    details: [
      'Live application status tracker (applied, viewed, interview scheduled, offer, rejected)',
      'Weekly email summary of applications sent and status changes',
      'Direct messaging with your assigned team member on Pro and Premium plans',
    ],
  },
]

const faqs = [
  {
    question: 'Do you use bots or automated scripts?',
    answer:
      'No. Real humans on our team manually submit each application through the official company portals. This means your application goes through the same process as any other candidate.',
  },
  {
    question: 'Will recruiters know CareerProxy submitted for me?',
    answer:
      'No. Your application appears as if you submitted it yourself. We use your name and contact information throughout.',
  },
  {
    question: 'What if I am currently on OPT or need visa sponsorship?',
    answer:
      'We can filter exclusively for companies with a track record of sponsoring H-1B and STEM OPT extensions, so you never waste an application on a company that will not proceed.',
  },
  {
    question: 'Can I pause or cancel my subscription?',
    answer:
      'Yes. You can pause or cancel your subscription at any time from your billing settings. There are no cancellation fees.',
  },
]

export default function HowItWorksPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-5">
            How CareerProxy works
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            From sign-up to interview offer — here is exactly what happens when you
            subscribe to CareerProxy.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto space-y-16">
          {steps.map((step, idx) => (
            <div
              key={step.number}
              className={`flex flex-col md:flex-row gap-8 items-start ${
                idx % 2 !== 0 ? 'md:flex-row-reverse' : ''
              }`}
            >
              {/* Step number */}
              <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-3xl font-extrabold shadow-lg">
                {step.number}
              </div>

              {/* Content */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-900 mb-3">{step.title}</h2>
                <p className="text-slate-600 leading-relaxed mb-4">{step.description}</p>
                <ul className="space-y-2">
                  {step.details.map((detail) => (
                    <li key={detail} className="flex items-start gap-2 text-sm text-slate-700">
                      <svg
                        className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">
            Frequently asked questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{faq.question}</h3>
                <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-700 py-20 px-4 sm:px-6 lg:px-8 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to get started?
          </h2>
          <p className="text-indigo-200 text-lg mb-8">
            Create your account today and have applications going out by tomorrow.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-white text-indigo-700 hover:bg-indigo-50 font-bold px-10 py-3 rounded-lg text-lg transition-colors shadow-md"
          >
            Sign Up Now
          </Link>
        </div>
      </section>
    </div>
  )
}
