"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function UsageLogs() {
  const { data, isLoading } = useQuery({
    queryKey: ["usage-logs"],
    queryFn: () => api.get("/v1/usage/logs?limit=50").then((r) => r.data),
  });

  const providerColor: Record<string, string> = {
    ANTHROPIC: "bg-orange-100 text-orange-700",
    OPENAI: "bg-green-100 text-green-700",
    GOOGLE: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      {isLoading ? (
        <div className="p-6 text-center text-gray-400">Loading…</div>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Provider", "Model", "Tokens", "Cost", "Latency", "Time"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data?.data ?? []).map((log: {
              id: string;
              provider: string;
              model: string;
              totalTokens: number;
              costUsd: number;
              latencyMs: number;
              createdAt: string;
            }) => (
              <tr key={log.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${providerColor[log.provider] || ""}`}>
                    {log.provider}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-gray-600 text-xs">{log.model}</td>
                <td className="px-4 py-3 text-gray-700">{log.totalTokens.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-700">${Number(log.costUsd).toFixed(6)}</td>
                <td className="px-4 py-3 text-gray-500">{log.latencyMs}ms</td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
