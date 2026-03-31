import Link from 'next/link'
import { PLAN_PRICES_USD } from '@/types'

const features = [
  {
    icon: (
      <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    title: 'Professional Applications',
    description:
      'Our expert team tailors each application to the job description, increasing your response rate significantly.',
  },
  {
    icon: (
      <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Visa Sponsorship Focus',
    description:
      'We target companies known to sponsor H-1B and OPT STEM extension, maximising your chances of staying in the US.',
  },
  {
    icon: (
      <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Real-Time Tracker',
    description:
      'Monitor every application in your personalised dashboard — status, company, role, and interview dates all in one place.',
  },
]

const steps = [
  {
    number: '01',
    title: 'Upload Your Resume',
    description: 'Share your resume and tell us what roles and industries you are targeting.',
  },
  {
    number: '02',
    title: 'Set Your Preferences',
    description: 'Choose your preferred locations, work type, and whether you need visa sponsorship.',
  },
  {
    number: '03',
    title: 'We Start Applying',
    description: 'Our team applies to jobs daily on your behalf across LinkedIn, Indeed, and Glassdoor.',
  },
  {
    number: '04',
    title: 'You Interview',
    description: 'You focus on interview prep while we keep your pipeline full of fresh opportunities.',
  },
]

const testimonials = [
  {
    quote:
      'CareerProxy applied to over 200 companies in my first month. I got 12 interviews and landed an offer at a Fortune 500 that sponsors H-1B.',
    name: 'Priya S.',
    role: 'Software Engineer, Chicago IL',
  },
  {
    quote:
      'As a recent MS grad, the job search was overwhelming. CareerProxy took that weight off me completely. I had more interviews than I could handle.',
    name: 'Wei L.',
    role: 'Data Scientist, Seattle WA',
  },
  {
    quote:
      'The team is professional and responsive. They know exactly which companies offer sponsorship. Totally worth the subscription.',
    name: 'Arjun M.',
    role: 'ML Engineer, San Francisco CA',
  },
]

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            We Apply.{' '}
            <span className="text-indigo-400">You Interview.</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            CareerProxy is the job application service built for international MS graduates
            in the US. Subscribe, upload your resume, and let our expert team handle
            hundreds of applications every month — so you only show up to interviews.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-lg text-lg transition-colors shadow-lg"
            >
              Get Started — from ${PLAN_PRICES_USD.starter}/mo
            </Link>
            <Link
              href="/how-it-works"
              className="border border-slate-500 hover:border-slate-300 text-slate-300 hover:text-white font-semibold px-8 py-3 rounded-lg text-lg transition-colors"
            >
              See How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* Value proposition / feature cards */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Everything you need to land your next role
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Stop spending your evenings filling out the same forms. Our team handles
              the entire application process from start to finish.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-md transition-shadow"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              How it works
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Get started in minutes and have your first applications out within 24 hours.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col items-start">
                <div className="text-5xl font-extrabold text-indigo-200 mb-4 leading-none">
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              href="/how-it-works"
              className="text-indigo-600 hover:text-indigo-500 font-semibold underline underline-offset-2"
            >
              Learn more about our process &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Loved by international graduates
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Join hundreds of MS graduates who are landing interviews without the grind.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-slate-50 rounded-2xl p-8 border border-slate-100 flex flex-col"
              >
                <div className="flex-1">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className="h-5 w-5 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-slate-700 italic leading-relaxed mb-6">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{t.name}</p>
                  <p className="text-slate-500 text-sm">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="bg-indigo-700 py-20 px-4 sm:px-6 lg:px-8 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to stop applying manually?
          </h2>
          <p className="text-indigo-200 text-lg mb-10 leading-relaxed">
            Subscribe today and have our team submitting applications on your behalf by
            tomorrow morning. Cancel any time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-white text-indigo-700 hover:bg-indigo-50 font-bold px-8 py-3 rounded-lg text-lg transition-colors shadow-md"
            >
              Start Your Subscription
            </Link>
            <Link
              href="/pricing"
              className="border border-indigo-400 hover:border-white text-indigo-200 hover:text-white font-semibold px-8 py-3 rounded-lg text-lg transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
