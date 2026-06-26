import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Provider Reference",
  description: "Supported AI models, parameters, and provider-specific configuration.",
};

const PROVIDERS = [
  {
    name: "Anthropic",
    id: "anthropic",
    models: [
      {
        id: "claude-opus-4-8",
        label: "Claude Opus 4.8",
        context: "200K tokens",
        inputPer1M: "$15.00",
        outputPer1M: "$75.00",
        notes: "Most capable. Best for complex reasoning and analysis.",
      },
      {
        id: "claude-sonnet-4-6",
        label: "Claude Sonnet 4.6",
        context: "200K tokens",
        inputPer1M: "$3.00",
        outputPer1M: "$15.00",
        notes: "Best balance of speed and intelligence. Recommended default.",
      },
      {
        id: "claude-haiku-4-5-20251001",
        label: "Claude Haiku 4.5",
        context: "200K tokens",
        inputPer1M: "$0.25",
        outputPer1M: "$1.25",
        notes: "Fastest and most affordable. Ideal for high-volume tasks.",
      },
    ],
  },
  {
    name: "OpenAI",
    id: "openai",
    models: [
      {
        id: "gpt-4o",
        label: "GPT-4o",
        context: "128K tokens",
        inputPer1M: "$2.50",
        outputPer1M: "$10.00",
        notes: "Multimodal flagship. Strong for structured output and function calling.",
      },
      {
        id: "gpt-4o-mini",
        label: "GPT-4o Mini",
        context: "128K tokens",
        inputPer1M: "$0.15",
        outputPer1M: "$0.60",
        notes: "Cost-efficient for classification, extraction, and simple tasks.",
      },
    ],
  },
  {
    name: "Google",
    id: "google",
    models: [
      {
        id: "gemini-1.5-pro",
        label: "Gemini 1.5 Pro",
        context: "2M tokens",
        inputPer1M: "$1.25",
        outputPer1M: "$5.00",
        notes: "Longest context window available. Excellent for document analysis.",
      },
      {
        id: "gemini-1.5-flash",
        label: "Gemini 1.5 Flash",
        context: "1M tokens",
        inputPer1M: "$0.075",
        outputPer1M: "$0.30",
        notes: "Fastest Gemini model. Great for real-time applications.",
      },
    ],
  },
];

const PARAMS = [
  { name: "provider", type: "string", required: true, description: 'Provider identifier. One of "anthropic", "openai", "google".' },
  { name: "model", type: "string", required: true, description: "Model ID as listed in the table above." },
  { name: "messages", type: "array", required: true, description: 'Array of message objects with "role" ("user" | "assistant") and "content" (string).' },
  { name: "system", type: "string", required: false, description: "System prompt. Mapped to the provider's native system field." },
  { name: "max_tokens", type: "integer", required: false, description: "Maximum output tokens. Provider default if omitted." },
  { name: "temperature", type: "number", required: false, description: "Sampling temperature 0–2. Provider default if omitted." },
  { name: "top_p", type: "number", required: false, description: "Nucleus sampling threshold. Mutually exclusive with temperature on some providers." },
  { name: "stream", type: "boolean", required: false, description: "Stream the response as SSE. Default: false." },
];

export default function ProvidersPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Reference</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Provider Reference</h1>
        <p className="text-gray-500 text-lg">
          Supported models, pricing, and request parameters for all connected providers.
        </p>
      </div>

      {/* Request parameters */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Request Parameters</h2>
        <p className="text-sm text-gray-500 mb-4">
          All chat completion requests share this schema. POST to{" "}
          <code className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
            https://api.ai-gateway.dev/v1/gateway/chat
          </code>
        </p>
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-700 w-32">Parameter</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 w-20">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 w-20">Required</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Description</th>
              </tr>
            </thead>
            <tbody>
              {PARAMS.map((p, i) => (
                <tr key={p.name} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="px-4 py-3 font-mono text-xs text-brand-700">{p.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.type}</td>
                  <td className="px-4 py-3">
                    {p.required ? (
                      <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                        required
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">optional</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs leading-relaxed">{p.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Providers */}
      {PROVIDERS.map((provider) => (
        <section key={provider.id} className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{provider.name}</h2>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Model</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Context</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Input / 1M</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Output / 1M</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Notes</th>
                </tr>
              </thead>
              <tbody>
                {provider.models.map((model, i) => (
                  <tr key={model.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 text-xs">{model.label}</p>
                      <p className="font-mono text-xs text-gray-400 mt-0.5">{model.id}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{model.context}</td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-700">{model.inputPer1M}</td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-700">{model.outputPer1M}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{model.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-sm text-gray-600">
        <p className="font-medium text-gray-900 mb-1">Pricing note</p>
        <p>
          Prices shown are the providers&apos; published rates. AI Gateway charges a flat monthly subscription —
          there is no per-token markup. You pay Anthropic, OpenAI, or Google directly via your own API keys.
        </p>
        <p className="mt-2">
          Run{" "}
          <code className="font-mono text-xs bg-white border border-gray-200 px-1.5 py-0.5 rounded">
            GET /v1/gateway/models
          </code>{" "}
          to get the live list of available models for your organisation.
        </p>
      </div>
    </div>
  );
}
