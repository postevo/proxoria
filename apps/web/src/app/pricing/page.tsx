import type { Metadata } from "next";
import Link from "next/link";
import { PricingCtaButton } from "../../components/PricingCtaButton";

export const metadata: Metadata = {
  title: "Pricing — Proxoria",
  description: "Simple, transparent pricing for AI gateway management. Start free, scale as you grow.",
};

const PLANS = [
  {
    key: "FREE" as const,
    name: "Free",
    price: "€0",
    period: "/month",
    description: "Try the gateway with no commitment.",
    features: [
      "500 requests / month",
      "1 user",
      "Unified gateway for Claude, GPT-4, Gemini",
      "Basic usage dashboard",
      "30-day log retention",
      "Community support",
    ],
    cta: "Start for free",
    highlight: false,
  },
  {
    key: "STARTER" as const,
    name: "Starter",
    price: "€49",
    period: "/month",
    description: "For small teams centralising their AI spend.",
    features: [
      "Up to 1M tokens/day",
      "Up to 5 users",
      "Unified gateway for Claude, GPT-4, Gemini",
      "Real-time cost dashboards",
      "Budget controls & alerts",
      "Scoped API keys with instant revocation",
      "30-day log retention",
      "Email support",
    ],
    cta: "Start free trial",
    highlight: false,
  },
  {
    key: "PRO" as const,
    name: "Pro",
    price: "€199",
    period: "/month",
    description: "For growing teams with serious AI workloads.",
    features: [
      "Up to 10M tokens/day",
      "Up to 25 users",
      "Everything in Starter",
      "Usage-based overage billing",
      "Per-project budget caps",
      "Full audit log of every LLM request",
      "90-day log retention",
      "Priority support",
    ],
    cta: "Start free trial",
    highlight: true,
  },
];

type FeatureVal = string | boolean;

const COMPARISON: { feature: string; free: FeatureVal; starter: FeatureVal; pro: FeatureVal; enterprise: FeatureVal }[] = [
  { feature: "Monthly requests", free: "500 req", starter: "Unlimited (1M tok/day)", pro: "Unlimited (10M tok/day)", enterprise: "Custom" },
  { feature: "Team members", free: "1", starter: "5", pro: "25", enterprise: "Unlimited" },
  { feature: "Log retention", free: "30 days", starter: "30 days", pro: "90 days", enterprise: "Custom" },
  { feature: "Providers (Anthropic, OpenAI, Google)", free: true, starter: true, pro: true, enterprise: true },
  { feature: "Real-time cost dashboard", free: false, starter: true, pro: true, enterprise: true },
  { feature: "Budget controls & alerts", free: false, starter: true, pro: true, enterprise: true },
  { feature: "Scoped API keys", free: false, starter: true, pro: true, enterprise: true },
  { feature: "Per-project budget caps", free: false, starter: false, pro: true, enterprise: true },
  { feature: "Usage-based overage billing", free: false, starter: false, pro: true, enterprise: true },
  { feature: "Full audit log", free: false, starter: false, pro: true, enterprise: true },
  { feature: "SSO / SAML", free: false, starter: false, pro: false, enterprise: true },
  { feature: "Dedicated support SLA", free: false, starter: false, pro: false, enterprise: true },
  { feature: "Support", free: "Community", starter: "Email", pro: "Priority email", enterprise: "Dedicated" },
];

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="text-brand-500 mx-auto">
      <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Cross() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="text-gray-300 mx-auto">
      <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function Cell({ val }: { val: FeatureVal }) {
  if (val === true) return <Check />;
  if (val === false) return <Cross />;
  return <span className="text-xs text-gray-600">{val}</span>;
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Proxoria
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/docs" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Docs
            </Link>
            <Link href="/sign-in" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
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
          Start free. No credit card required. Upgrade when your team is ready.
        </p>
      </section>

      {/* Pricing cards */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-2xl p-7 shadow-sm ${
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
              <PricingCtaButton plan={plan.key} label={plan.cta} highlight={plan.highlight} />
            </div>
          ))}
        </div>

        {/* Enterprise row */}
        <div className="mt-5 bg-gray-50 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-gray-900">Enterprise</p>
            <p className="text-sm text-gray-500">Custom pricing, SSO, dedicated SLAs, and white-glove onboarding for large teams.</p>
          </div>
          <a
            href="mailto:sales@ai-gateway.dev"
            className="shrink-0 text-sm font-medium border border-gray-300 text-gray-700 px-5 py-2.5 rounded-xl hover:bg-gray-100 transition-colors"
          >
            Contact sales
          </a>
        </div>
      </section>

      {/* Feature comparison table */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Full feature comparison</h2>
        <div className="border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-4 font-semibold text-gray-700 w-2/5">Feature</th>
                <th className="text-center px-4 py-4 font-semibold text-gray-700">Free</th>
                <th className="text-center px-4 py-4 font-semibold text-gray-700">Starter</th>
                <th className="text-center px-4 py-4 font-semibold text-brand-700 bg-brand-50/50">Pro</th>
                <th className="text-center px-4 py-4 font-semibold text-gray-700">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row, i) => (
                <tr key={row.feature} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}>
                  <td className="px-5 py-3.5 text-sm text-gray-700">{row.feature}</td>
                  <td className="px-4 py-3.5 text-center"><Cell val={row.free} /></td>
                  <td className="px-4 py-3.5 text-center"><Cell val={row.starter} /></td>
                  <td className="px-4 py-3.5 text-center bg-brand-50/20"><Cell val={row.pro} /></td>
                  <td className="px-4 py-3.5 text-center"><Cell val={row.enterprise} /></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200 bg-gray-50">
                <td className="px-5 py-4" />
                <td className="px-4 py-4 text-center">
                  <Link href="/sign-up" className="text-xs font-medium text-gray-700 hover:text-gray-900 underline">
                    Sign up free
                  </Link>
                </td>
                <td className="px-4 py-4 text-center">
                  <Link href="/sign-up" className="text-xs font-medium text-brand-600 hover:text-brand-800 underline">
                    Start trial
                  </Link>
                </td>
                <td className="px-4 py-4 text-center bg-brand-50/20">
                  <Link href="/sign-up" className="text-xs font-medium text-brand-600 hover:text-brand-800 underline">
                    Start trial
                  </Link>
                </td>
                <td className="px-4 py-4 text-center">
                  <a href="mailto:sales@ai-gateway.dev" className="text-xs font-medium text-gray-700 hover:text-gray-900 underline">
                    Contact sales
                  </a>
                </td>
              </tr>
            </tfoot>
          </table>
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
              a: "On the Starter plan, requests that would push you over 1M tokens/day are rejected with a 402 error. On Pro, overages are billed via Stripe at month-end at the provider's standard rates.",
            },
            {
              q: "Do you mark up LLM API costs?",
              a: "No. Proxoria charges a flat monthly subscription. You pay Anthropic, OpenAI, and Google directly at their standard rates using your own API keys.",
            },
            {
              q: "How does the Free tier work?",
              a: "The Free plan gives you 500 requests per month — no credit card required. It's designed for evaluation and personal projects. Upgrade to Starter when you're ready to use it in production.",
            },
            {
              q: "Can I change plans at any time?",
              a: "Yes. Upgrades take effect immediately and are prorated. Downgrades take effect at the end of the billing period.",
            },
            {
              q: "Can I cancel any time?",
              a: "Yes. Cancel from the billing dashboard and your subscription runs until the end of the current period. No lock-in.",
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
            Proxoria
          </Link>
          <nav className="flex gap-6">
            <Link href="/docs" className="hover:text-gray-700 transition-colors">Docs</Link>
            <a href="mailto:hello@ai-gateway.dev" className="hover:text-gray-700 transition-colors">
              hello@ai-gateway.dev
            </a>
          </nav>
          <span>&copy; {new Date().getFullYear()} Proxoria.</span>
        </div>
      </footer>
    </div>
  );
}
