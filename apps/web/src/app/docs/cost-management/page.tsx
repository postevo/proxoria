import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cost Management",
  description: "Set budgets, configure spend alerts, and prevent overruns with hard caps.",
};

export default function CostManagementPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Reference</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Cost Management</h1>
        <p className="text-gray-500 text-lg">
          Set monthly budgets, receive alerts before you overspend, and enforce hard caps per key or organisation.
        </p>
      </div>

      <div className="space-y-12">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">How budgets work</h2>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Budgets are measured in USD and reset on the first of each calendar month. You can set budgets at three levels:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              {
                title: "Organisation",
                desc: "Global monthly cap across all keys, projects, and models.",
                badge: "Highest priority",
              },
              {
                title: "API Key",
                desc: "Per-key cap. Useful for scoping spend to individual teams or services.",
                badge: "Per key",
              },
              {
                title: "Project",
                desc: "Tag requests with a project ID; budgets apply across any key used for that project.",
                badge: "Per project",
              },
            ].map((b) => (
              <div key={b.title} className="border border-gray-200 rounded-xl p-4">
                <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                  {b.badge}
                </span>
                <p className="font-semibold text-gray-900 mt-2 mb-1">{b.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500">
            When multiple budgets apply, the most restrictive one wins.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Setting a budget via the dashboard</h2>
          <ol className="space-y-3 text-sm text-gray-600">
            <li className="flex gap-3">
              <span className="shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-semibold">1</span>
              <span>Go to <strong>Settings → Billing</strong> in the dashboard.</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-semibold">2</span>
              <span>Under <strong>Budget Controls</strong>, enter a monthly limit in USD for the organisation.</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-semibold">3</span>
              <span>Optionally set alert thresholds at 50%, 80%, and 100%.</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-semibold">4</span>
              <span>Save. The budget takes effect immediately for all new requests.</span>
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Setting a budget via the API</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-3">Set an organisation-wide monthly cap:</p>
              <CodeBlock lang="bash">{`curl -X PATCH https://api.ai-gateway.dev/v1/organisations/me \\
  -H "Authorization: Bearer YOUR_GATEWAY_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "monthlyBudgetUsd": 500,
    "budgetAlertThresholds": [50, 80, 100]
  }'`}</CodeBlock>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-3">Set a per-key monthly cap when creating a key:</p>
              <CodeBlock lang="bash">{`curl -X POST https://api.ai-gateway.dev/v1/keys \\
  -H "Authorization: Bearer YOUR_GATEWAY_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "frontend-service",
    "monthlyBudgetUsd": 50
  }'`}</CodeBlock>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-3">Update a key budget after creation:</p>
              <CodeBlock lang="bash">{`curl -X PATCH https://api.ai-gateway.dev/v1/keys/{keyId} \\
  -H "Authorization: Bearer YOUR_GATEWAY_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"monthlyBudgetUsd": 100}'`}</CodeBlock>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Alert notifications</h2>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Alerts are sent by email to all organisation admins. Configure thresholds as percentages of the monthly budget.
            When a threshold is crossed, a single email is sent per threshold per billing cycle.
          </p>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Threshold</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { threshold: "80% of budget", action: "Warning email to all admins. Requests continue." },
                  { threshold: "100% of budget (hard cap)", action: "All gateway requests rejected with HTTP 402. Email sent to all admins." },
                  { threshold: "Custom threshold", action: "Optional. Set any percentage; email only, no traffic impact." },
                ].map((row, i) => (
                  <tr key={row.threshold} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <td className="px-4 py-3 text-xs font-medium text-gray-900">{row.threshold}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{row.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">What happens when the budget is hit</h2>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            When a hard cap is reached, the gateway returns a{" "}
            <code className="font-mono text-xs bg-gray-100 px-1 rounded">402 Payment Required</code> response:
          </p>
          <CodeBlock lang="json">{`{
  "error": {
    "code": "budget_exceeded",
    "message": "Monthly budget of $500.00 exceeded. Requests have been paused.",
    "budgetUsd": 500,
    "spentUsd": 502.14,
    "resetAt": "2026-07-01T00:00:00Z"
  }
}`}</CodeBlock>
          <p className="text-sm text-gray-500 mt-4">
            Budgets reset automatically on the 1st of the next month. You can also raise the budget limit immediately from <strong>Settings → Billing</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Viewing cost breakdowns</h2>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Use the Usage dashboard or API to see costs broken down by model, provider, API key, or date range.
          </p>
          <CodeBlock lang="bash">{`# Monthly cost by model
curl "https://api.ai-gateway.dev/v1/usage?period=month&groupBy=model" \\
  -H "Authorization: Bearer ak_live_..."

# Cost for a specific date range
curl "https://api.ai-gateway.dev/v1/usage?from=2026-06-01&to=2026-06-30" \\
  -H "Authorization: Bearer ak_live_..."`}</CodeBlock>
        </section>
      </div>
    </div>
  );
}

function CodeBlock({ children, lang }: { children: string; lang: string }) {
  return (
    <div className="relative">
      <div className="absolute top-2.5 right-3 text-xs text-gray-500 font-mono select-none">{lang}</div>
      <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 text-xs overflow-x-auto leading-relaxed font-mono pr-16 whitespace-pre">
        {children}
      </pre>
    </div>
  );
}
