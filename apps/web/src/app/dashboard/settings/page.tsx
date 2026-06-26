import type { Metadata } from "next";
import { ProviderKeyManager } from "../../../components/ProviderKeyManager";
import { BudgetSettings } from "../../../components/BudgetSettings";

export const metadata: Metadata = { title: "Settings — Proxoria" };

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-2xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Organization settings and provider configuration</p>
      </div>
      <ProviderKeyManager />
      <BudgetSettings />
    </div>
  );
}
