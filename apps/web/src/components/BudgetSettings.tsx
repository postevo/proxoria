"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

interface OrgInfo {
  id: string;
  name: string;
  plan: string;
  monthlyBudget: number | null;
}

export function BudgetSettings() {
  const qc = useQueryClient();
  const [budget, setBudget] = useState("");
  const [saved, setSaved] = useState(false);

  const { data: org, isLoading } = useQuery<OrgInfo>({
    queryKey: ["org-me"],
    queryFn: () => api.get("/v1/orgs/me").then((r) => r.data),
  });

  useEffect(() => {
    if (org?.monthlyBudget != null) {
      setBudget(String(org.monthlyBudget));
    }
  }, [org?.monthlyBudget]);

  const updateMutation = useMutation({
    mutationFn: (monthlyBudget: number | null) =>
      api.patch("/v1/orgs/me", { monthlyBudget }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-me"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  function handleSave() {
    const parsed = budget.trim() === "" ? null : parseFloat(budget);
    if (parsed !== null && (isNaN(parsed) || parsed < 0)) return;
    updateMutation.mutate(parsed);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Monthly Budget</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Set a USD spending cap per month. Gateway requests will be blocked once the limit is reached.
          Leave empty for no limit.
        </p>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-6">
        {isLoading ? (
          <div className="h-10 bg-gray-50 rounded-lg animate-pulse" />
        ) : (
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="No limit"
                className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <span className="text-sm text-gray-400">USD / month</span>
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {updateMutation.isPending ? "Saving…" : saved ? "Saved ✓" : "Save"}
            </button>
          </div>
        )}

        {org?.monthlyBudget != null && (
          <p className="text-xs text-gray-400 mt-3">
            Current limit: <span className="font-medium text-gray-600">${org.monthlyBudget.toFixed(2)}/mo</span>
          </p>
        )}
        {updateMutation.isError && (
          <p className="text-xs text-red-600 mt-2">
            {(updateMutation.error as any)?.response?.data?.error ?? "Failed to update budget"}
          </p>
        )}
      </div>
    </div>
  );
}
