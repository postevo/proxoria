"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function UsageOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ["usage", "month"],
    queryFn: () => api.get("/v1/usage?period=month").then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
            <div className="h-4 bg-gray-100 rounded w-24 mb-3" />
            <div className="h-8 bg-gray-100 rounded w-32" />
          </div>
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: "Total Requests",
      value: data?.total.requests?.toLocaleString() ?? "0",
      sub: "this month",
    },
    {
      label: "Tokens Used",
      value: formatTokens(data?.total.tokens ?? 0),
      sub: "across all models",
    },
    {
      label: "Total Cost",
      value: `$${(data?.total.costUsd ?? 0).toFixed(2)}`,
      sub: "USD this month",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {stats.map((s) => (
        <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <p className="text-sm text-gray-500 font-medium mb-1">{s.label}</p>
          <p className="text-3xl font-bold text-gray-900">{s.value}</p>
          <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
        </div>
      ))}
    </div>
  );
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}
