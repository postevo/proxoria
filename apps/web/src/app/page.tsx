import Link from "next/link";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { WaitlistForm } from "../components/WaitlistForm";

const features = [
  {
    title: "API Gateway",
    description:
      "One endpoint for Claude, GPT-4, and Gemini. Switch models without touching your code. Built-in retries, fallbacks, and rate-limit handling.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M8 6H21M8 12H21M8 18H21M3 6H3.01M3 12H3.01M3 18H3.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    title: "Usage Analytics",
    description:
      "Real-time dashboards for token consumption and cost by team, project, and model. Spot waste before it becomes a line-item problem.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M18 20V10M12 20V4M6 20V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    title: "Cost Management",
    description:
      "Set monthly budgets per project or team. Get alerts at 80% and hard caps at 100%. No surprise invoices.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    title: "Team Controls",
    description:
      "Issue scoped API keys per team. Revoke in one click. Every request is logged — who called what, when, from which key.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
];

const steps = [
  {
    step: "01",
    title: "Get your API key",
    description: "Sign up and create an organization. Generate a scoped API key for your team in under a minute.",
  },
  {
    step: "02",
    title: "Replace the provider URL",
    description:
      "Point your existing Anthropic, OpenAI, or Google SDK to our gateway. One-line change — no SDK rewrites.",
  },
  {
    step: "03",
    title: "Ship with confidence",
    description:
      "Costs, usage, and audit logs update in real time. Set budgets. Sleep well.",
  },
];

const stats = [
  { value: "<10ms", label: "Median added latency" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "3", label: "LLM providers unified" },
  { value: "SOC 2", label: "Compliance in progress" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900">Proxoria</span>
            <span className="text-xs font-medium bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full">Beta</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg transition-colors hidden sm:block">
              Pricing
            </Link>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg transition-colors">
                  Sign in
                </button>
              </SignInButton>
              <Link
                href="#waitlist"
                className="text-sm bg-brand-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-700 transition-colors"
              >
                Join waitlist
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="text-sm bg-brand-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-700 transition-colors"
              >
                Dashboard
              </Link>
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-xs font-medium px-3 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
          Now in private beta — apply for early access
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-[1.1] tracking-tight">
          One API to manage{" "}
          <span className="text-brand-600">Claude, GPT-4, Gemini</span>
          {" "}— with cost controls and audit logs
        </h1>
        <p className="text-lg sm:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          Enterprise AI teams use Proxoria to unify their LLM stack, track spend by team and project, and enforce access policies — without rebuilding their integrations.
        </p>
        <div id="waitlist" className="max-w-md mx-auto">
          <WaitlistForm />
          <p className="text-xs text-gray-400 mt-3">No credit card required. Early access pricing locked in at signup.</p>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-gray-100 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-24" id="features">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Everything your AI team needs
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Stop juggling provider dashboards, API keys, and spreadsheet cost tracking. One platform to rule them all.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Code snippet / How it works */}
      <section className="bg-gray-900 py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Works with your existing code
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Change one URL. Keep your SDK. That&apos;s it.
            </p>
          </div>
          <div className="bg-gray-800 rounded-2xl p-6 sm:p-8 font-mono text-sm leading-loose overflow-x-auto">
            <div className="text-gray-500 text-xs mb-4">Before</div>
            <pre className="text-red-400">
              <code>{`import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  // baseURL: "https://api.anthropic.com"  ← default
});`}</code>
            </pre>
            <div className="border-t border-gray-700 my-6" />
            <div className="text-gray-500 text-xs mb-4">After — one line changed</div>
            <pre className="text-green-400">
              <code>{`import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.AI_GATEWAY_KEY,
  baseURL: "https://gateway.yourdomain.com",  // ← add this
});`}</code>
            </pre>
          </div>
          <p className="text-center text-gray-500 text-sm mt-6">
            Works identically with OpenAI and Google Gemini SDKs.
          </p>
        </div>
      </section>

      {/* How it works — steps */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Up and running in minutes
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.step} className="text-center">
              <div className="text-4xl font-bold text-brand-100 mb-3">{s.step}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-600 py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to take back control of your AI spend?
          </h2>
          <p className="text-brand-100 text-lg mb-10">
            Join the waitlist and lock in early-access pricing.
          </p>
          <WaitlistForm className="max-w-md mx-auto" />
          <p className="text-brand-200 text-xs mt-4">
            Or{" "}
            <Link href="/pricing" className="underline hover:text-white transition-colors">
              see enterprise pricing
            </Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <span className="font-semibold text-gray-900">Proxoria</span>
          <nav className="flex gap-6">
            <Link href="/pricing" className="hover:text-gray-700 transition-colors">Pricing</Link>
            <Link href="#features" className="hover:text-gray-700 transition-colors">Features</Link>
            <a href="mailto:hello@ai-gateway.dev" className="hover:text-gray-700 transition-colors">Contact</a>
          </nav>
          <span>&copy; {new Date().getFullYear()} Proxoria. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
