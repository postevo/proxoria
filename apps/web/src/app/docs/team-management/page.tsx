import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team Management",
  description: "Invite members, issue scoped API keys, and manage access control.",
};

export default function TeamManagementPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Reference</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Team Management</h1>
        <p className="text-gray-500 text-lg">
          Invite team members, create scoped API keys per service or team, and revoke access instantly.
        </p>
      </div>

      <div className="space-y-12">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Roles</h2>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 w-28">Role</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Permissions</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    role: "Admin",
                    perms: "Full access: billing, team management, API keys, provider keys, usage data.",
                  },
                  {
                    role: "Member",
                    perms: "Create and view their own API keys. Read usage for keys they own. Cannot access billing or invite new members.",
                  },
                  {
                    role: "Viewer",
                    perms: "Read-only access to usage dashboards. Cannot create keys or change settings.",
                  },
                ].map((r, i) => (
                  <tr key={r.role} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-900">{r.role}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 leading-relaxed">{r.perms}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Inviting members</h2>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Admins can invite new members from <strong>Settings → Team</strong> in the dashboard, or via the API.
            Invitees receive an email with a link to create their account and join the organisation.
          </p>
          <CodeBlock lang="bash">{`curl -X POST https://api.ai-gateway.dev/v1/invitations \\
  -H "Authorization: Bearer YOUR_GATEWAY_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "alice@example.com",
    "role": "member"
  }'

# Response
{
  "id": "inv_01abc...",
  "email": "alice@example.com",
  "role": "member",
  "expiresAt": "2026-07-03T10:00:00Z",
  "status": "pending"
}`}</CodeBlock>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Scoped API keys</h2>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Each API key can be restricted to specific scopes, models, or providers. This lets you issue a key to a
            specific service or team that can only call certain models — reducing blast radius if a key is leaked.
          </p>

          <div className="mb-5">
            <p className="text-sm font-medium text-gray-900 mb-2">Available scopes</p>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 w-44">Scope</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Grants</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { scope: "gateway:read", grants: "Make chat completion requests through the gateway." },
                    { scope: "usage:read", grants: "Read usage logs and cost summaries for this key." },
                    { scope: "keys:write", grants: "Create and rotate API keys (admin only)." },
                    { scope: "team:write", grants: "Invite and remove team members (admin only)." },
                  ].map((s, i) => (
                    <tr key={s.scope} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                      <td className="px-4 py-3 font-mono text-xs text-brand-700">{s.scope}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{s.grants}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <CodeBlock lang="bash">{`# Key scoped to gateway calls only, limited to Claude models
curl -X POST https://api.ai-gateway.dev/v1/keys \\
  -H "Authorization: Bearer YOUR_GATEWAY_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "frontend-chatbot",
    "scopes": ["gateway:read"],
    "allowedProviders": ["anthropic"],
    "allowedModels": ["claude-sonnet-4-6", "claude-haiku-4-5-20251001"],
    "monthlyBudgetUsd": 25
  }'`}</CodeBlock>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Rotating and revoking keys</h2>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Keys can be revoked instantly from the dashboard or API. Revoked keys return{" "}
            <code className="font-mono text-xs bg-gray-100 px-1 rounded">401 Unauthorized</code> immediately — no propagation delay.
          </p>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Revoke a key:</p>
              <CodeBlock lang="bash">{`curl -X DELETE https://api.ai-gateway.dev/v1/keys/{keyId} \\
  -H "Authorization: Bearer YOUR_GATEWAY_API_KEY"`}</CodeBlock>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Rotate a key (creates a new secret, deactivates the old one):</p>
              <CodeBlock lang="bash">{`curl -X POST https://api.ai-gateway.dev/v1/keys/{keyId}/rotate \\
  -H "Authorization: Bearer YOUR_GATEWAY_API_KEY"

# Response includes the new key secret — save it immediately
{
  "id": "key_01abc...",
  "key": "ak_live_NEWVALUE...",
  "rotatedAt": "2026-06-26T10:00:00Z"
}`}</CodeBlock>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Audit log</h2>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Every gateway request is logged with the key ID, user ID (if authenticated via session), model, token counts, cost, and latency.
            Logs are retained for 90 days on the Pro plan and 30 days on Starter.
          </p>
          <CodeBlock lang="bash">{`# Fetch the 50 most recent log entries
curl "https://api.ai-gateway.dev/v1/usage/logs?limit=50&order=desc" \\
  -H "Authorization: Bearer ak_live_..."

# Filter by a specific API key
curl "https://api.ai-gateway.dev/v1/usage/logs?keyId=key_01abc..." \\
  -H "Authorization: Bearer ak_live_..."`}</CodeBlock>
          <p className="text-sm text-gray-500 mt-4">
            Logs are also available in the dashboard under <strong>Usage → Request Log</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Removing a member</h2>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            When you remove a member, their personal session is invalidated immediately. Any API keys they created remain active
            until explicitly revoked — rotate or delete those separately to prevent continued access.
          </p>
          <CodeBlock lang="bash">{`curl -X DELETE https://api.ai-gateway.dev/v1/members/{userId} \\
  -H "Authorization: Bearer YOUR_GATEWAY_API_KEY"`}</CodeBlock>
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
