import Link from 'next/link'
import { PLAN_FEATURES, PLAN_PRICES_USD, type SubscriptionPlan } from '@/types'

const plans: { key: SubscriptionPlan; name: string; highlight: boolean }[] = [
  { key: 'starter', name: 'Starter', highlight: false },
  { key: 'pro', name: 'Pro', highlight: true },
  { key: 'premium', name: 'Premium', highlight: false },
]

// All features across all plans for comparison table
const allFeatures = [
  'Applications per month',
  'Application tracker',
  'Weekly email reports',
  'Team chat / messaging',
  'Cover letter customisation',
  'LinkedIn profile review',
  'Priority assignment',
  'Support',
]

const planFeatureMap: Record<SubscriptionPlan, Record<string, string | boolean>> = {
  starter: {
    'Applications per month': '50',
    'Application tracker': true,
    'Weekly email reports': false,
    'Team chat / messaging': false,
    'Cover letter customisation': false,
    'LinkedIn profile review': false,
    'Priority assignment': false,
    'Support': 'Email',
  },
  pro: {
    'Applications per month': '100',
    'Application tracker': true,
    'Weekly email reports': true,
    'Team chat / messaging': true,
    'Cover letter customisation': false,
    'LinkedIn profile review': false,
    'Priority assignment': false,
    'Support': 'Email + Chat',
  },
  premium: {
    'Applications per month': 'Unlimited',
    'Application tracker': true,
    'Weekly email reports': true,
    'Team chat / messaging': true,
    'Cover letter customisation': true,
    'LinkedIn profile review': true,
    'Priority assignment': true,
    'Support': 'Dedicated',
  },
}

function FeatureCell({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <svg className="h-5 w-5 text-indigo-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    ) : (
      <svg className="h-5 w-5 text-slate-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    )
  }
  return <span className="text-sm text-slate-700">{value}</span>
}

export default function PricingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            Pick the plan that fits your job search intensity. Cancel any time.
          </p>
        </div>
      </section>

      {/* Plan cards */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {plans.map((plan) => (
              <div
                key={plan.key}
                className={`rounded-2xl border p-8 flex flex-col relative ${
                  plan.highlight
                    ? 'border-indigo-600 shadow-xl ring-2 ring-indigo-600'
                    : 'border-slate-200 shadow-sm'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                      Most Popular
                    </span>
                  </div>
                )}

                <h2 className="text-2xl font-bold text-slate-900 mb-1">{plan.name}</h2>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold text-slate-900">
                    ${PLAN_PRICES_USD[plan.key]}
                  </span>
                  <span className="text-slate-500 text-sm">/month</span>
                </div>

                <ul className="space-y-3 flex-1 mb-8">
                  {PLAN_FEATURES[plan.key].map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                      <svg
                        className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/signup?plan=${plan.key}`}
                  className={`text-center font-semibold py-3 px-6 rounded-lg transition-colors ${
                    plan.highlight
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      : 'border border-indigo-600 text-indigo-600 hover:bg-indigo-50'
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature comparison table */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">
            Full feature comparison
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-4 px-6 text-left text-sm font-semibold text-slate-700 w-1/3">
                    Feature
                  </th>
                  {plans.map((plan) => (
                    <th
                      key={plan.key}
                      className={`py-4 px-6 text-center text-sm font-semibold w-1/5 ${
                        plan.highlight ? 'text-indigo-700 bg-indigo-50' : 'text-slate-700'
                      }`}
                    >
                      {plan.name}
                      <div
                        className={`text-xs font-normal mt-0.5 ${
                          plan.highlight ? 'text-indigo-500' : 'text-slate-500'
                        }`}
                      >
                        ${PLAN_PRICES_USD[plan.key]}/mo
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allFeatures.map((feature, idx) => (
                  <tr
                    key={feature}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                  >
                    <td className="py-3 px-6 text-sm font-medium text-slate-800">
                      {feature}
                    </td>
                    {plans.map((plan) => (
                      <td
                        key={plan.key}
                        className={`py-3 px-6 text-center ${
                          plan.highlight ? 'bg-indigo-50/40' : ''
                        }`}
                      >
                        <FeatureCell value={planFeatureMap[plan.key][feature]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ / guarantee */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            No contracts. No hidden fees.
          </h2>
          <p className="text-slate-600 leading-relaxed mb-8">
            All plans are billed monthly. You can upgrade, downgrade, or cancel at any
            time from your billing settings. If you cancel before your next billing date,
            you keep access until the end of your current period.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-10 py-3 rounded-lg text-lg transition-colors shadow-md"
          >
            Start Today
          </Link>
        </div>
      </section>
    </div>
  )
}
