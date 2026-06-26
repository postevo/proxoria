import type { Metadata } from "next";
import Link from "next/link";
import { WaitlistForm } from "../../components/WaitlistForm";

export const metadata: Metadata = {
  title: "Pricing — AI Gateway",
  description: "Enterprise AI management pricing. Contact sales for custom pricing and volume discounts.",
};

const included = [
  "Unified gateway for Claude, GPT-4, and Gemini",
  "Real-time usage and cost dashboards",
  "Per-team and per-project budget controls",
  "Scoped API keys with instant revocation",
  "Full audit log of every LLM request",
  "Budget alerts and hard spend caps",
  "Dedicated onboarding and Slack channel",
  "SOC 2 compliance (in progress)",
  "Custom data retention policies",
  "SLA-backed uptime guarantee",
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
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to home
          </Link>
        </div>
      </nav>

      {/* Header */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
          Simple, transparent pricing
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto">
          We&apos;re finalizing our pricing tiers. Join the waitlist to lock in early-access rates — our beta users will always get the best deal.
        </p>
      </section>

      {/* Pricing card */}
      <section className="max-w-lg mx-auto px-4 sm:px-6 pb-16">
        <div className="bg-white border-2 border-brand-500 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-semibold text-gray-900">Enterprise</span>
            <span className="text-xs font-medium bg-brand-50 text-brand-600 px-3 py-1 rounded-full">Pricing TBD</span>
          </div>
          <div className="mb-6">
            <span className="text-4xl font-bold text-gray-900">Contact sales</span>
          </div>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Usage-based pricing with volume discounts. Designed for teams that spend $500+/month on LLM APIs and need visibility and control.
          </p>

          <ul className="space-y-3 mb-8">
            {included.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-gray-600">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="mt-0.5 text-brand-500 shrink-0">
                  <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {item}
              </li>
            ))}
          </ul>

          <div className="space-y-3">
            <WaitlistForm />
            <a
              href="mailto:sales@ai-gateway.dev"
              className="block text-center text-sm text-gray-500 hover:text-gray-900 transition-colors py-2"
            >
              Or email us directly at sales@ai-gateway.dev
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 py-16 border-t border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">Common questions</h2>
        <div className="space-y-8">
          {[
            {
              q: "When will pricing be finalized?",
              a: "We're finalizing tiers with early design partners. Join the waitlist and we'll share details directly — waitlist members get first access and locked-in rates.",
            },
            {
              q: "Will there be a self-serve plan?",
              a: "Yes. We plan to offer a pay-as-you-go tier for smaller teams alongside our enterprise plan. Details TBD.",
            },
            {
              q: "Do you mark up LLM API costs?",
              a: "We charge a platform fee on top of provider cost. You pay Anthropic/OpenAI/Google at their standard rates; we add a flat margin for the gateway, analytics, and support.",
            },
            {
              q: "What data do you store?",
              a: "We log request metadata (model, token counts, latency, cost) and optionally prompt/response content depending on your data retention settings. No data is used to train models.",
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
          <Link href="/" className="font-semibold text-gray-900">AI Gateway</Link>
          <a href="mailto:hello@ai-gateway.dev" className="hover:text-gray-700 transition-colors">hello@ai-gateway.dev</a>
          <span>&copy; {new Date().getFullYear()} AI Gateway.</span>
        </div>
      </footer>
    </div>
  );
}
