import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing — AI Gateway",
  description: "Simple, transparent pricing for AI gateway management. Start free, scale as you grow.",
};

const PLANS = [
  {
    name: "Starter",
    price: "€99",
    period: "/month",
    description: "For small teams centralising their AI spend.",
    features: [
      "Up to 1M tokens/day",
      "Up to 5 users",
      "Unified gateway for Claude, GPT-4, Gemini",
      "Real-time cost dashboards",
      "Budget controls & alerts",
      "Scoped API keys with instant revocation",
      "14-day free trial",
      "Email support",
    ],
    cta: "Start free trial",
    highlight: false,
  },
  {
    name: "Pro",
    price: "€299",
    period: "/month",
    description: "For growing teams with serious AI workloads.",
    features: [
      "Up to 10M tokens/day",
      "Up to 25 users",
      "Everything in Starter",
      "Usage-based overage billing",
      "Per-project budget caps",
      "Full audit log of every LLM request",
      "90-day usage history",
      "Priority support",
    ],
    cta: "Start free trial",
    highlight: true,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            AI Gateway
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="text-sm font-medium bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
          Simple, transparent pricing
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto">
          Start with a 14-day free trial. No credit card required.
        </p>
      </section>

      {/* Pricing cards */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-2xl p-8 shadow-sm ${
                plan.highlight
                  ? "border-2 border-brand-500 ring-1 ring-brand-500"
                  : "border border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-semibold text-gray-900">{plan.name}</span>
                {plan.highlight && (
                  <span className="text-xs font-medium bg-brand-50 text-brand-600 px-3 py-1 rounded-full">
                    Most popular
                  </span>
                )}
              </div>
              <div className="mb-2">
                <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                <span className="text-gray-400 text-sm">{plan.period}</span>
              </div>
              <p className="text-sm text-gray-500 mb-6">{plan.description}</p>
              <ul className="space-y-2.5 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="text-sm text-gray-600 flex items-start gap-2.5">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden="true"
                      className="mt-0.5 text-brand-500 shrink-0"
                    >
                      <path
                        d="M13.5 4.5L6 12L2.5 8.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className={`block text-center py-3 rounded-xl text-sm font-semibold transition-colors ${
                  plan.highlight
                    ? "bg-brand-600 text-white hover:bg-brand-700"
                    : "bg-gray-900 text-white hover:bg-gray-700"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Enterprise row */}
        <div className="mt-6 bg-gray-50 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-gray-900">Enterprise</p>
            <p className="text-sm text-gray-500">Custom pricing for large teams, SLAs, and dedicated support.</p>
          </div>
          <a
            href="mailto:sales@ai-gateway.dev"
            className="shrink-0 text-sm font-medium border border-gray-300 text-gray-700 px-5 py-2.5 rounded-xl hover:bg-gray-100 transition-colors"
          >
            Contact sales
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 py-16 border-t border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">Common questions</h2>
        <div className="space-y-8">
          {[
            {
              q: "What counts as a token?",
              a: "Tokens are the units your LLM provider charges for. The gateway tracks exact token counts per request and aggregates them across all models and providers.",
            },
            {
              q: "What happens if I exceed my daily token limit?",
              a: "On the Starter plan, requests that would exceed 1M tokens/day are rejected with a 402 error. On Pro, overages are billed via Stripe at the end of the month.",
            },
            {
              q: "Do you mark up LLM API costs?",
              a: "The gateway fee is a flat monthly subscription. You pay Anthropic/OpenAI/Google directly at their standard rates by bringing your own API keys.",
            },
            {
              q: "Can I cancel any time?",
              a: "Yes. Cancel from the billing dashboard and your subscription runs until the end of the current period.",
            },
          ].map(({ q, a }) => (
            <div key={q}>
              <h3 className="font-semibold text-gray-900 mb-2">{q}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <Link href="/" className="font-semibold text-gray-900">
            AI Gateway
          </Link>
          <a href="mailto:hello@ai-gateway.dev" className="hover:text-gray-700 transition-colors">
            hello@ai-gateway.dev
          </a>
          <span>&copy; {new Date().getFullYear()} AI Gateway.</span>
        </div>
      </footer>
    </div>
  );
}
