import type { Metadata } from "next";
import { BillingOverview } from "../../../components/BillingOverview";

export const metadata: Metadata = { title: "Billing — AI Gateway" };

export default function BillingPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-gray-500 mt-1">Manage your subscription and view invoices</p>
      </div>
      <BillingOverview />
    </div>
  );
}
