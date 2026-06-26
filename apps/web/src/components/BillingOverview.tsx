"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";

interface BillingStatus {
  plan: "FREE" | "STARTER" | "PRO" | "ENTERPRISE";
  subscriptionStatus: "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "UNPAID" | "PAUSED";
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

interface Invoice {
  id: string;
  number: string | null;
  status: string | null;
  amountPaid: number;
  amountDue: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
  pdfUrl: string | null;
  hostedUrl: string | null;
  createdAt: string;
}

const PLANS = [
  {
    key: "STARTER" as const,
    name: "Starter",
    price: "€99",
    period: "/month",
    description: "For small teams getting started with AI management.",
    features: ["Up to 1M tokens/day", "Up to 5 users", "Budget controls & alerts", "14-day trial", "Email support"],
  },
  {
    key: "PRO" as const,
    name: "Pro",
    price: "€299",
    period: "/month",
    description: "For growing teams with serious AI spend.",
    features: ["Up to 10M tokens/day", "Up to 25 users", "Usage-based overage billing", "90-day history", "Priority support"],
    highlight: true,
  },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  TRIALING: { label: "Trial", color: "bg-blue-50 text-blue-700" },
  ACTIVE: { label: "Active", color: "bg-green-50 text-green-700" },
  PAST_DUE: { label: "Past Due", color: "bg-red-50 text-red-700" },
  CANCELED: { label: "Canceled", color: "bg-gray-100 text-gray-600" },
  UNPAID: { label: "Unpaid", color: "bg-red-50 text-red-700" },
  PAUSED: { label: "Paused", color: "bg-yellow-50 text-yellow-700" },
};

export function BillingOverview() {
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const { data: status, isLoading } = useQuery<BillingStatus>({
    queryKey: ["billing-status"],
    queryFn: () => api.get("/v1/billing/status").then((r) => r.data),
  });

  const { data: invoicesData } = useQuery<{ data: Invoice[] }>({
    queryKey: ["billing-invoices"],
    queryFn: () => api.get("/v1/billing/invoices").then((r) => r.data),
    enabled: !!status?.stripeCustomerId,
  });

  const invoices = invoicesData?.data ?? [];

  async function handleUpgrade(plan: "STARTER" | "PRO") {
    setCheckoutLoading(plan);
    try {
      const { data } = await api.post("/v1/billing/checkout", {
        plan,
        successUrl: `${window.location.origin}/dashboard/billing?success=1`,
        cancelUrl: `${window.location.origin}/dashboard/billing`,
      });
      window.location.href = data.url;
    } catch {
      setCheckoutLoading(null);
    }
  }

  async function handleManageBilling() {
    setPortalLoading(true);
    try {
      const { data } = await api.post("/v1/billing/portal", {
        returnUrl: `${window.location.origin}/dashboard/billing`,
      });
      window.location.href = data.url;
    } catch {
      setPortalLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-32 bg-gray-100 rounded-xl" />
        <div className="h-48 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  const currentPlan = status?.plan ?? "FREE";
  const subStatus = status?.subscriptionStatus ?? "TRIALING";
  const badge = STATUS_LABELS[subStatus] ?? { label: subStatus, color: "bg-gray-100 text-gray-600" };

  return (
    <div className="space-y-8">
      {/* Current plan card */}
      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Current Plan</p>
            <p className="text-2xl font-bold text-gray-900">{currentPlan}</p>
            {status?.trialEndsAt && subStatus === "TRIALING" && (
              <p className="text-sm text-blue-600 mt-1">
                Trial ends {new Date(status.trialEndsAt).toLocaleDateString()}
              </p>
            )}
            {status?.currentPeriodEnd && subStatus === "ACTIVE" && (
              <p className="text-sm text-gray-400 mt-1">
                Renews {new Date(status.currentPeriodEnd).toLocaleDateString()}
                {status.cancelAtPeriodEnd && " (cancels)"}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badge.color}`}>
              {badge.label}
            </span>
            {status?.stripeCustomerId && (
              <button
                onClick={handleManageBilling}
                disabled={portalLoading}
                className="text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {portalLoading ? "Loading…" : "Manage billing"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade plans */}
      {currentPlan === "FREE" || currentPlan === "STARTER" ? (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {currentPlan === "FREE" ? "Choose a plan" : "Upgrade to Pro"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PLANS.filter((p) => p.key !== currentPlan).map((plan) => (
              <div
                key={plan.key}
                className={`bg-white border rounded-xl p-6 shadow-sm ${
                  plan.highlight ? "border-brand-500 ring-1 ring-brand-500" : "border-gray-100"
                }`}
              >
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-xl font-bold text-gray-900">{plan.name}</span>
                  {plan.highlight && (
                    <span className="text-xs font-medium bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full ml-2">
                      Most popular
                    </span>
                  )}
                </div>
                <div className="mb-3">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-400 text-sm">{plan.period}</span>
                </div>
                <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="text-sm text-gray-600 flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="text-brand-500 shrink-0">
                        <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleUpgrade(plan.key)}
                  disabled={checkoutLoading === plan.key}
                  className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
                    plan.highlight
                      ? "bg-brand-600 text-white hover:bg-brand-700"
                      : "bg-gray-900 text-white hover:bg-gray-700"
                  }`}
                >
                  {checkoutLoading === plan.key ? "Redirecting…" : `Upgrade to ${plan.name}`}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Invoice history */}
      {invoices.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice History</h2>
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Invoice</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Period</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Amount</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900 font-mono text-xs">{inv.number ?? inv.id.slice(0, 12)}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(inv.periodStart).toLocaleDateString()} – {new Date(inv.periodEnd).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      ${((inv.amountPaid || inv.amountDue) / 100).toFixed(2)} {inv.currency.toUpperCase()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        inv.status === "paid"
                          ? "bg-green-50 text-green-700"
                          : "bg-yellow-50 text-yellow-700"
                      }`}>
                        {inv.status ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {inv.pdfUrl && (
                        <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-brand-600 hover:underline">
                          PDF
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {invoices.length === 0 && currentPlan !== "FREE" && (
        <p className="text-sm text-gray-400">No invoices yet.</p>
      )}
    </div>
  );
}
