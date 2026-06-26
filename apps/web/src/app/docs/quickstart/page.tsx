import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Quickstart",
  description: "Make your first AI Gateway call in under 5 minutes.",
};

export default function QuickstartPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Getting Started</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Quickstart</h1>
        <p className="text-gray-500 text-lg">
          Get from zero to your first successful API call in under 5 minutes.
        </p>
      </div>

      <div className="mb-8 bg-brand-50 border border-brand-100 rounded-xl p-4 text-sm text-brand-800">
        <strong>Prerequisites:</strong> An AI Gateway account and an API key from at least one provider (Anthropic, OpenAI, or Google).{" "}
        <Link href="/sign-up" className="underline hover:text-brand-900">Sign up free →</Link>
      </div>

      <div className="space-y-12">
        <Step step={1} title="Store your provider API key">
          <p className="text-sm text-gray-600 mb-4">
            The gateway uses your own provider keys (BYOK — bring your own key). Add one in the dashboard under{" "}
            <strong>Settings → AI Providers</strong>, or via the API:
          </p>
          <CodeBlock lang="bash">{`curl -X PUT https://api.ai-gateway.dev/v1/provider-keys/anthropic \\
  -H "Authorization: Bearer YOUR_GATEWAY_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"key": "sk-ant-api03-..."}'`}</CodeBlock>
          <p className="text-sm text-gray-500 mt-3">
            Keys are encrypted with AES-256-GCM and never logged. You can rotate or remove them at any time.
          </p>
        </Step>

        <Step step={2} title="Create a gateway API key">
          <p className="text-sm text-gray-600 mb-4">
            Gateway keys authenticate your application's requests. Create one with a descriptive name — the raw secret is returned only once.
          </p>
          <CodeBlock lang="bash">{`curl -X POST https://api.ai-gateway.dev/v1/keys \\
  -H "Authorization: Bearer YOUR_DASHBOARD_SESSION_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "production-backend"}'

# Response — save the "key" value, shown once
{
  "id": "key_01abc...",
  "name": "production-backend",
  "key": "ak_live_...",
  "keyPrefix": "ak_live_ab",
  "scopes": ["gateway:read", "usage:read"],
  "createdAt": "2026-01-15T10:00:00Z"
}`}</CodeBlock>
          <Note>
            You can also create keys with budget limits. Pass <code className="font-mono text-xs bg-amber-100 px-1 rounded">"monthlyBudgetUsd": 100</code> to cap spend at $100/month for that key.
          </Note>
        </Step>

        <Step step={3} title="Make your first call">
          <p className="text-sm text-gray-600 mb-5">
            Use your gateway key to route a chat completion to any connected provider.
          </p>

          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">cURL</p>
              <CodeBlock lang="bash">{`curl -X POST https://api.ai-gateway.dev/v1/gateway/chat \\
  -H "Authorization: Bearer ak_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "provider": "anthropic",
    "model": "claude-sonnet-4-6",
    "messages": [
      {"role": "user", "content": "Explain AI gateways in one sentence."}
    ]
  }'

# Response
{
  "id": "resp_01xyz...",
  "content": "An AI gateway is a unified API layer that routes requests...",
  "model": "claude-sonnet-4-6",
  "provider": "anthropic",
  "usage": {
    "inputTokens": 14,
    "outputTokens": 22,
    "totalTokens": 36
  },
  "costUsd": 0.000108,
  "latencyMs": 1240
}`}</CodeBlock>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Python</p>
              <CodeBlock lang="python">{`import requests

response = requests.post(
    "https://api.ai-gateway.dev/v1/gateway/chat",
    headers={"Authorization": "Bearer ak_live_..."},
    json={
        "provider": "anthropic",
        "model": "claude-sonnet-4-6",
        "messages": [
            {"role": "user", "content": "Explain AI gateways in one sentence."}
        ],
    },
)

data = response.json()
print(data["content"])
print(f"Tokens used: {data['usage']['totalTokens']}")
print(f"Cost: ${data['costUsd']:.6f}")`}</CodeBlock>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Node.js</p>
              <CodeBlock lang="typescript">{`const response = await fetch("https://api.ai-gateway.dev/v1/gateway/chat", {
  method: "POST",
  headers: {
    Authorization: "Bearer ak_live_...",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    provider: "anthropic",
    model: "claude-sonnet-4-6",
    messages: [
      { role: "user", content: "Explain AI gateways in one sentence." }
    ],
  }),
});

const data = await response.json();
console.log(data.content);
console.log(\`Cost: $\${data.costUsd}\`);`}</CodeBlock>
            </div>
          </div>
        </Step>

        <Step step={4} title="Check usage and costs">
          <p className="text-sm text-gray-600 mb-4">
            Every request is logged with token counts, cost, and latency. Query programmatically or view in the dashboard.
          </p>
          <CodeBlock lang="bash">{`# Usage summary for the current month
curl https://api.ai-gateway.dev/v1/usage?period=month \\
  -H "Authorization: Bearer ak_live_..."

# Paginated raw request log
curl "https://api.ai-gateway.dev/v1/usage/logs?page=1&limit=50" \\
  -H "Authorization: Bearer ak_live_..."`}</CodeBlock>
        </Step>
      </div>

      <div className="mt-12 border-t border-gray-100 pt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">What&apos;s next?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { href: "/docs/providers", label: "Provider Reference", desc: "Supported models and parameters" },
            { href: "/docs/cost-management", label: "Cost Management", desc: "Budgets and alert configuration" },
            { href: "/docs/team-management", label: "Team Management", desc: "Scoped keys and access control" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block border border-gray-200 rounded-xl p-4 hover:border-brand-300 transition-colors"
            >
              <p className="text-sm font-semibold text-gray-900 mb-1">{item.label}</p>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
          {step}
        </div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="ml-10">{children}</div>
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

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 flex gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
      <span className="shrink-0 mt-0.5">💡</span>
      <span>{children}</span>
    </div>
  );
}
