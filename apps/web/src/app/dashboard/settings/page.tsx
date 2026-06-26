import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings — AI Gateway" };

export default function SettingsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Organization and account settings</p>
      </div>
      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm text-sm text-gray-500">
        Coming soon — provider key management, budget controls, and data retention settings.
      </div>
    </div>
  );
}
