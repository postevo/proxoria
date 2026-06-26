import Link from "next/link";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-brand-600">AI Gateway</span>
          <span className="text-xs bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full font-medium">Beta</span>
        </div>
        <div className="flex items-center gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-gray-600 hover:text-gray-900 font-medium">Sign in</button>
            </SignInButton>
            <Link
              href="/sign-up"
              className="bg-brand-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-700 transition-colors"
            >
              Start free
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="bg-brand-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-700 transition-colors"
            >
              Dashboard
            </Link>
          </SignedIn>
        </div>
      </nav>

      <section className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          One API for all your{" "}
          <span className="text-brand-600">enterprise AI</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Route to Claude, GPT-4, and Gemini through a single gateway. Track costs, enforce budgets, and manage team access — all in one place.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/sign-up"
            className="bg-brand-600 text-white px-8 py-3 rounded-xl font-semibold text-lg hover:bg-brand-700 transition-colors shadow-lg"
          >
            Get started free
          </Link>
          <Link href="#how-it-works" className="text-gray-600 hover:text-gray-900 font-medium text-lg">
            See how it works →
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-24 grid grid-cols-1 md:grid-cols-3 gap-8" id="how-it-works">
        {[
          {
            icon: "🔀",
            title: "Multi-LLM Gateway",
            desc: "Switch between Claude, GPT-4, and Gemini without changing your code. One endpoint, all models.",
          },
          {
            icon: "📊",
            title: "Cost Dashboards",
            desc: "See exactly what each team, project, and model costs. Set budgets with automatic alerts before you overspend.",
          },
          {
            icon: "🔐",
            title: "Team Access Controls",
            desc: "Issue scoped API keys per team. Revoke instantly. Full audit log of every request.",
          },
        ].map((f) => (
          <div key={f.title} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
            <p className="text-gray-500">{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
