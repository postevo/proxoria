"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";
import { clsx } from "clsx";

const STEPS = [
  { id: 0, label: "Connect AI provider" },
  { id: 1, label: "Invite team" },
  { id: 2, label: "Create gateway key" },
  { id: 3, label: "First call" },
];

const PROVIDERS = [
  {
    id: "anthropic",
    name: "Anthropic",
    logo: "🟠",
    placeholder: "sk-ant-api03-…",
    hint: "Find your key at console.anthropic.com",
  },
  {
    id: "openai",
    name: "OpenAI",
    logo: "🟢",
    placeholder: "sk-proj-…",
    hint: "Find your key at platform.openai.com/api-keys",
  },
  {
    id: "google",
    name: "Google",
    logo: "🔵",
    placeholder: "AIzaSy…",
    hint: "Find your key at aistudio.google.com/app/apikey",
  },
];

export function OnboardingSetupWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Step 0 state
  const [provider, setProvider] = useState("anthropic");
  const [providerKey, setProviderKey] = useState("");
  const [savingProvider, setSavingProvider] = useState(false);
  const [providerError, setProviderError] = useState("");

  // Step 1 state (team invite)
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"org:admin" | "org:member" | "org:viewer">("org:member");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSent, setInviteSent] = useState<string[]>([]);

  // Step 2 state
  const [keyName, setKeyName] = useState("Production");
  const [createdKey, setCreatedKey] = useState("");
  const [creatingKey, setCreatingKey] = useState(false);
  const [keyError, setKeyError] = useState("");
  const [copied, setCopied] = useState(false);

  async function saveProviderKey() {
    if (!providerKey.trim()) return;
    setSavingProvider(true);
    setProviderError("");
    try {
      await api.put(`/v1/provider-keys/${provider}`, { key: providerKey.trim() });
      setStep(1);
    } catch (err: any) {
      setProviderError(err.response?.data?.error ?? "Failed to save key. Check it and try again.");
    } finally {
      setSavingProvider(false);
    }
  }

  async function sendInvite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteError("");
    try {
      await api.post("/v1/teams/invite", { emailAddress: inviteEmail.trim(), role: inviteRole });
      setInviteSent((prev) => [...prev, inviteEmail.trim()]);
      setInviteEmail("");
    } catch (err: any) {
      setInviteError(err.response?.data?.error ?? "Failed to send invite.");
    } finally {
      setInviting(false);
    }
  }

  async function createGatewayKey() {
    setCreatingKey(true);
    setKeyError("");
    try {
      const res = await api.post("/v1/keys", { name: keyName || "Production" });
      setCreatedKey(res.data.key);
      setStep(3);
    } catch (err: any) {
      setKeyError(err.response?.data?.error ?? "Failed to create key.");
    } finally {
      setCreatingKey(false);
    }
  }

  function copyKey() {
    navigator.clipboard.writeText(createdKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const selectedProvider = PROVIDERS.find((p) => p.id === provider)!;

  const curlExample = `curl -X POST https://api.yourdomain.com/v1/gateway/chat \\
  -H "Authorization: Bearer ${createdKey || "YOUR_GATEWAY_KEY"}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "provider": "${provider}",
    "messages": [{"role": "user", "content": "Hello! What can you do?"}]
  }'`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Step indicator */}
      <div className="border-b border-gray-100 px-8 py-5">
        <div className="flex items-center gap-0">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className={clsx(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
                    step > s.id
                      ? "bg-brand-600 text-white"
                      : step === s.id
                      ? "bg-brand-600 text-white"
                      : "bg-gray-100 text-gray-400",
                  )}
                >
                  {step > s.id ? "✓" : s.id + 1}
                </div>
                <span
                  className={clsx(
                    "text-sm font-medium whitespace-nowrap",
                    step >= s.id ? "text-gray-900" : "text-gray-400",
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={clsx(
                    "h-px flex-1 mx-4",
                    step > s.id ? "bg-brand-600" : "bg-gray-200",
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="p-8">
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Connect your AI provider</h2>
              <p className="text-sm text-gray-500 mt-1">
                Add your API key for the provider you want to use. Keys are encrypted at rest.
              </p>
            </div>

            <div className="flex gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProvider(p.id)}
                  className={clsx(
                    "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                    provider === p.id
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300",
                  )}
                >
                  <span>{p.logo}</span>
                  {p.name}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {selectedProvider.name} API key
              </label>
              <input
                type="password"
                value={providerKey}
                onChange={(e) => setProviderKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveProviderKey()}
                placeholder={selectedProvider.placeholder}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-xs text-gray-400">{selectedProvider.hint}</p>
            </div>

            {providerError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{providerError}</p>
            )}

            <button
              onClick={saveProviderKey}
              disabled={!providerKey.trim() || savingProvider}
              className="w-full bg-brand-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {savingProvider ? "Saving…" : "Save key & continue →"}
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Invite your team <span className="text-gray-400 font-normal text-sm">(optional)</span></h2>
              <p className="text-sm text-gray-500 mt-1">
                Add teammates now so they can access usage and call the gateway. You can invite more later.
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendInvite()}
                placeholder="colleague@company.com"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as typeof inviteRole)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="org:admin">Admin</option>
                <option value="org:member">Member</option>
                <option value="org:viewer">Viewer</option>
              </select>
              <button
                onClick={sendInvite}
                disabled={!inviteEmail.trim() || inviting}
                className="bg-brand-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {inviting ? "Sending…" : "Send invite"}
              </button>
            </div>

            {inviteError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{inviteError}</p>
            )}

            {inviteSent.length > 0 && (
              <div className="space-y-1">
                {inviteSent.map((email) => (
                  <div key={email} className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-4 py-2">
                    <span>✓</span> <span>Invite sent to {email}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-brand-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
              >
                Continue →
              </button>
              {inviteSent.length === 0 && (
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Skip for now
                </button>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Create your gateway API key</h2>
              <p className="text-sm text-gray-500 mt-1">
                This is the key your apps use to call the AI Gateway. You can create more later.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Key name</label>
              <input
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="Production"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {keyError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{keyError}</p>
            )}

            <button
              onClick={createGatewayKey}
              disabled={creatingKey}
              className="w-full bg-brand-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {creatingKey ? "Creating…" : "Create key & continue →"}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">You're all set! Make your first call.</h2>
              <p className="text-sm text-gray-500 mt-1">
                Your gateway API key is shown below. Copy it now — it won't be shown again.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
              <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Gateway API key</p>
              <code className="text-sm text-green-800 font-mono break-all block">{createdKey}</code>
              <button
                onClick={copyKey}
                className="text-xs text-green-600 hover:underline font-medium"
              >
                {copied ? "Copied!" : "Copy to clipboard"}
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Try it now with curl:</p>
              <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 text-xs overflow-x-auto leading-relaxed font-mono">
                {curlExample}
              </pre>
              <button
                onClick={() => navigator.clipboard.writeText(curlExample)}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium"
              >
                Copy curl command
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="flex-1 bg-brand-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
              >
                Open dashboard →
              </button>
              <button
                onClick={() => router.push("/dashboard/quickstart")}
                className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                View quickstart guide
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
