"use client";

import { useState, useEffect, Suspense } from "react";
import { CreateOrganization, useAuth } from "@clerk/nextjs";
import { useSearchParams, useRouter } from "next/navigation";

type Step = "org" | "key" | "test";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const STEPS: { id: Step; label: string }[] = [
  { id: "org", label: "Create org" },
  { id: "key", label: "Get API key" },
  { id: "test", label: "Test call" },
];

function StepIndicator({ current }: { current: Step }) {
  const idx = STEPS.findIndex((s) => s.id === current);
  return (
    <div className="flex items-center mb-10">
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                i < idx
                  ? "bg-blue-600 text-white"
                  : i === idx
                  ? "bg-blue-600 text-white ring-4 ring-blue-100"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {i < idx ? "✓" : i + 1}
            </div>
            <span
              className={`text-sm font-medium ${
                i === idx ? "text-gray-900" : "text-gray-400"
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`w-12 h-px mx-3 ${
                i < idx ? "bg-blue-600" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function OnboardingContent() {
  const { getToken, orgId, isLoaded } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlStep = searchParams.get("step");
  const [step, setStep] = useState<Step>(urlStep === "key" ? "key" : "org");
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // If user already has an org and lands on "org" step, skip to "key"
  useEffect(() => {
    if (isLoaded && orgId && step === "org") {
      setStep("key");
    }
  }, [isLoaded, orgId, step]);

  async function generateKey() {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/v1/keys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "Default" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setApiKey(data.key);
      setStep("test");
    } catch (e: any) {
      setError(e.message || "Failed to create API key. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyKey() {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const curlExample = `curl -X POST ${API_URL}/v1/gateway/chat \\
  -H "Authorization: Bearer ${apiKey ?? "YOUR_API_KEY"}" \\
  -H "Content-Type: application/json" \\
  -d '{"provider":"anthropic","model":"claude-haiku-4-5-20251001","messages":[{"role":"user","content":"Hello!"}]}'`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="mb-6 text-center">
        <span className="text-2xl font-bold text-blue-600">Proxoria</span>
        <p className="text-gray-400 mt-1 text-sm">Get set up in under 5 minutes</p>
      </div>

      <StepIndicator current={step} />

      {step === "org" && (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Create your organization
          </h2>
          <p className="text-gray-500 mb-6 text-sm">
            Give your team a workspace in the Proxoria.
          </p>
          <CreateOrganization afterCreateOrganizationUrl="/onboarding?step=key" />
        </div>
      )}

      {step === "key" && (
        <div className="bg-white border border-gray-100 rounded-2xl p-8 w-full max-w-md shadow-sm">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
              🔑
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Generate your API key
            </h2>
            <p className="text-gray-500 text-sm">
              This key lets your apps call the Proxoria. We only show it once
              — store it safely.
            </p>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
              {error}
            </div>
          )}
          <button
            onClick={generateKey}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Generating…" : "Generate API Key"}
          </button>
        </div>
      )}

      {step === "test" && apiKey && (
        <div className="w-full max-w-lg space-y-5">
          <div className="text-center">
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
              ✅
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              You&apos;re all set!
            </h2>
            <p className="text-gray-500 text-sm">
              Copy your API key now — this is the only time we&apos;ll show it.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-green-800 uppercase tracking-wide">
                Your API Key
              </span>
              <button
                onClick={copyKey}
                className="text-xs text-green-600 hover:text-green-800 font-medium transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <code className="text-sm text-green-800 bg-green-100 px-3 py-2 rounded-lg block font-mono break-all">
              {apiKey}
            </code>
          </div>

          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wide">
              Test your key with curl
            </p>
            <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-all leading-relaxed">
              {curlExample}
            </pre>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Open Dashboard →
          </button>
        </div>
      )}
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
