"use client";

import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { api } from "../lib/api";

export function CostChart() {
  const { data, isLoading } = useQuery({
    queryKey: ["usage", "month", "chart"],
    queryFn: () => api.get("/v1/usage?period=month").then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 h-72 animate-pulse">
        <div className="h-full bg-gray-50 rounded-lg" />
      </div>
    );
  }

  const chartData = (data?.byDay ?? []).map((d: { day: string; cost: string }) => ({
    day: new Date(d.day).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    cost: Number(d.cost).toFixed(4),
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Daily cost (USD)</h2>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v) => [`$${v}`, "Cost"]} />
          <Line type="monotone" dataKey="cost" stroke="#2563eb" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
