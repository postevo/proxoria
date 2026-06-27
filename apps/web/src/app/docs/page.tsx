import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Documentation Overview",
  description: "Proxoria documentation — quickstart, provider reference, cost management, and team management.",
};

const GUIDES = [
  {
    href: "/docs/quickstart",
    title: "Quickstart",
    description: "Get your API key, configure a provider, and make your first call in under 5 minutes.",
    time: "5 min",
  },
  {
    href: "/docs/providers",
    title: "Provider Reference",
    description: "Supported models, parameters, and provider-specific configuration for Anthropic, OpenAI, and Google.",
    time: "10 min read",
  },
  {
    href: "/docs/cost-management",
    title: "Cost Management",
    description: "Set budgets per project or team, configure alerts, and prevent overruns with hard caps.",
    time: "8 min read",
  },
  {
    href: "/docs/team-management",
    title: "Team Management",
    description: "Invite members, issue scoped API keys, set per-key limits, and revoke access instantly.",
    time: "8 min read",
  },
];

export default function DocsIndexPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Documentation</h1>
        <p className="text-gray-500 text-lg leading-relaxed">
          Everything you need to integrate the Proxoria, control costs, and manage your team.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        {GUIDES.map((g) => (
          <Link
            key={g.href}
            href={g.href}
            className="group block border border-gray-200 rounded-xl p-5 hover:border-brand-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
                {g.title}
              </span>
              <span className="text-xs text-gray-400">{g.time}</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">{g.description}</p>
          </Link>
        ))}
      </div>

      <div className="bg-brand-50 border border-brand-100 rounded-xl p-6">
        <h2 className="font-semibold text-brand-900 mb-2">Need help?</h2>
        <p className="text-sm text-brand-700 mb-4">
          Our team is available on Slack and email during the beta.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="mailto:support@ai-gateway.dev"
            className="text-sm font-medium text-brand-600 hover:text-brand-800 transition-colors"
          >
            support@ai-gateway.dev
          </a>
          <span className="text-brand-300">·</span>
          <a
            href="/sign-up"
            className="text-sm font-medium text-brand-600 hover:text-brand-800 transition-colors"
          >
            Create account →
          </a>
        </div>
      </div>
    </div>
  );
}
