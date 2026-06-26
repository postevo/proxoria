"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

type Provider = "ANTHROPIC" | "OPENAI" | "GOOGLE";

interface ProviderKeyRecord {
  id: string;
  provider: Provider;
  label: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const PROVIDERS: { key: Provider; name: string; placeholder: string; docs: string }[] = [
  {
    key: "ANTHROPIC",
    name: "Anthropic",
    placeholder: "sk-ant-api03-…",
    docs: "https://console.anthropic.com/settings/keys",
  },
  {
    key: "OPENAI",
    name: "OpenAI",
    placeholder: "sk-proj-…",
    docs: "https://platform.openai.com/api-keys",
  },
  {
    key: "GOOGLE",
    name: "Google AI",
    placeholder: "AIza…",
    docs: "https://aistudio.google.com/app/apikey",
  },
];

export function ProviderKeyManager() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Provider | null>(null);
  const [keyValue, setKeyValue] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: keys = [], isLoading } = useQuery<ProviderKeyRecord[]>({
    queryKey: ["provider-keys"],
    queryFn: () => api.get("/v1/provider-keys").then((r) => r.data),
  });

  const upsertMutation = useMutation({
    mutationFn: ({ provider, key, label }: { provider: Provider; key: string; label?: string }) =>
      api.put(`/v1/provider-keys/${provider.toLowerCase()}`, { key, label }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["provider-keys"] });
      setEditing(null);
      setKeyValue("");
      setLabel("");
      setError(null);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error ?? "Failed to save key");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (provider: Provider) =>
      api.delete(`/v1/provider-keys/${provider.toLowerCase()}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["provider-keys"] }),
  });

  const configuredProviders = new Set(keys.map((k) => k.provider));

  function startEdit(provider: Provider) {
    setEditing(provider);
    setKeyValue("");
    setLabel("");
    setError(null);
  }

  function cancelEdit() {
    setEditing(null);
    setKeyValue("");
    setLabel("");
    setError(null);
  }

  function handleSave(provider: Provider) {
    if (!keyValue.trim()) {
      setError("API key is required");
      return;
    }
    upsertMutation.mutate({ provider, key: keyValue.trim(), label: label.trim() || undefined });
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">LLM Provider Keys</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Store your own provider API keys (BYOK). Keys are encrypted at rest with AES-256-GCM.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 animate-pulse h-16" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {PROVIDERS.map((p) => {
            const isConfigured = configuredProviders.has(p.key);
            const isEditingThis = editing === p.key;

            return (
              <div key={p.key} className="bg-white border border-gray-100 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                      {p.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-400">
                        {isConfigured ? (
                          <span className="text-green-600 font-medium">Configured</span>
                        ) : (
                          <span className="text-gray-400">Not configured</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isConfigured && !isEditingThis && (
                      <button
                        onClick={() => deleteMutation.mutate(p.key)}
                        disabled={deleteMutation.isPending}
                        className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                    {!isEditingThis && (
                      <button
                        onClick={() => startEdit(p.key)}
                        className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                      >
                        {isConfigured ? "Update" : "Configure"}
                      </button>
                    )}
                  </div>
                </div>

                {isEditingThis && (
                  <div className="mt-4 space-y-3 border-t border-gray-50 pt-4">
                    {error && (
                      <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        API Key <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={keyValue}
                        onChange={(e) => setKeyValue(e.target.value)}
                        placeholder={p.placeholder}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoComplete="off"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Label <span className="text-gray-400">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="e.g. production, team-a"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-2 justify-between">
                      <a
                        href={p.docs}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Get {p.name} API key →
                      </a>
                      <div className="flex gap-2">
                        <button
                          onClick={cancelEdit}
                          className="text-xs text-gray-500 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSave(p.key)}
                          disabled={upsertMutation.isPending}
                          className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {upsertMutation.isPending ? "Saving…" : "Save key"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
