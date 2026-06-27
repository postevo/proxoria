export default function QuickstartPage() {
  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Quick Start Guide</h1>
        <p className="text-gray-500 mt-1">Make your first AI call in under 10 minutes.</p>
      </div>

      <div className="space-y-10">
        <Section step={1} title="Store your provider API key">
          <p className="text-sm text-gray-600 mb-4">
            The gateway uses your own provider keys (BYOK). Store one for Anthropic, OpenAI, or
            Google — it&apos;s encrypted with AES-256-GCM.
          </p>
          <CodeBlock lang="bash">{`curl -X PUT https://api.yourdomain.com/v1/provider-keys/anthropic \\
  -H "Authorization: Bearer YOUR_DASHBOARD_SESSION_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"key": "sk-ant-api03-..."}'`}</CodeBlock>
          <Note>
            Provider keys are also configurable from the dashboard under{" "}
            <strong>Settings → AI Providers</strong>.
          </Note>
        </Section>

        <Section step={2} title="Create a gateway API key">
          <p className="text-sm text-gray-600 mb-4">
            Gateway keys authenticate your app&apos;s requests. Create one with a descriptive name
            — the raw key is returned once.
          </p>
          <CodeBlock lang="bash">{`curl -X POST https://api.yourdomain.com/v1/keys \\
  -H "Authorization: Bearer YOUR_DASHBOARD_SESSION_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "production-backend"}'

# Response
{
  "id": "...",
  "name": "production-backend",
  "key": "ak_live_...",   # save this — shown once
  "keyPrefix": "ak_live_ab",
  "scopes": ["gateway:read", "usage:read"],
  "createdAt": "..."
}`}</CodeBlock>
        </Section>

        <Section step={3} title="Make your first chat completion">
          <p className="text-sm text-gray-600 mb-4">
            Use the gateway key to route a chat completion. Pick any provider you&apos;ve connected.
          </p>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Claude (Anthropic)</p>
              <CodeBlock lang="bash">{`curl -X POST https://api.yourdomain.com/v1/gateway/chat \\
  -H "Authorization: Bearer ak_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "provider": "anthropic",
    "model": "claude-sonnet-4-6",
    "messages": [{"role": "user", "content": "Summarize the key benefits of AI gateways."}]
  }'`}</CodeBlock>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">GPT-4o (OpenAI)</p>
              <CodeBlock lang="bash">{`curl -X POST https://api.yourdomain.com/v1/gateway/chat \\
  -H "Authorization: Bearer ak_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "provider": "openai",
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello! What can you do?"}]
  }'`}</CodeBlock>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Python SDK</p>
              <CodeBlock lang="python">{`import requests

resp = requests.post(
    "https://api.yourdomain.com/v1/gateway/chat",
    headers={"Authorization": "Bearer ak_live_..."},
    json={
        "provider": "anthropic",
        "model": "claude-sonnet-4-6",
        "messages": [{"role": "user", "content": "Hello!"}],
    },
)
data = resp.json()
print(data["content"])
print(f"Tokens: {data['usage']['totalTokens']}, Cost: \${data['costUsd']:.6f}")`}</CodeBlock>
            </div>
          </div>
        </Section>

        <Section step={4} title="Review usage & costs">
          <p className="text-sm text-gray-600 mb-4">
            Every request is logged with token counts, latency, and cost. Query via API or view in
            the dashboard.
          </p>
          <CodeBlock lang="bash">{`# Usage summary for the current month
curl https://api.yourdomain.com/v1/usage?period=month \\
  -H "Authorization: Bearer ak_live_..."

# Raw log (paginated)
curl "https://api.yourdomain.com/v1/usage/logs?page=1&limit=50" \\
  -H "Authorization: Bearer ak_live_..."`}</CodeBlock>
        </Section>

        <div className="bg-brand-50 border border-brand-100 rounded-xl p-6">
          <h3 className="font-semibold text-brand-900 mb-2">Available models</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            {[
              { provider: "Anthropic", models: ["claude-opus-4-8", "claude-sonnet-4-6", "claude-haiku-4-5-20251001"] },
              { provider: "OpenAI", models: ["gpt-4o", "gpt-4o-mini"] },
              { provider: "Google", models: ["gemini-1.5-pro", "gemini-1.5-flash"] },
            ].map((g) => (
              <div key={g.provider}>
                <p className="font-medium text-brand-700 mb-1">{g.provider}</p>
                {g.models.map((m) => (
                  <p key={m} className="text-brand-600 font-mono text-xs leading-relaxed">{m}</p>
                ))}
              </div>
            ))}
          </div>
          <p className="text-xs text-brand-600 mt-3">
            Run <code className="font-mono bg-brand-100 px-1 rounded">GET /v1/gateway/models</code> to
            get the live list.
          </p>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h3 className="font-semibold text-gray-900 mb-3">Need help?</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <a
              href="mailto:support@yourdomain.com"
              className="flex items-center gap-2 p-4 border border-gray-200 rounded-xl hover:border-brand-300 transition-colors"
            >
              <span className="text-xl">✉️</span>
              <div>
                <p className="font-medium text-gray-900">Email support</p>
                <p className="text-gray-500 text-xs">support@yourdomain.com</p>
              </div>
            </a>
            <a
              href="/dashboard/usage"
              className="flex items-center gap-2 p-4 border border-gray-200 rounded-xl hover:border-brand-300 transition-colors"
            >
              <span className="text-xl">📊</span>
              <div>
                <p className="font-medium text-gray-900">Usage dashboard</p>
                <p className="text-gray-500 text-xs">View logs and costs</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
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
      <div className="absolute top-2 right-3 text-xs text-gray-500 font-mono">{lang}</div>
      <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 text-xs overflow-x-auto leading-relaxed font-mono pr-16">
        {children}
      </pre>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 flex gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
      <span className="shrink-0">💡</span>
      <span>{children}</span>
    </div>
  );
}
