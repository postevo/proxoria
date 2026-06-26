import { auth } from "@clerk/nextjs/server";
import { UsageOverview } from "../../components/UsageOverview";
import { CostChart } from "../../components/CostChart";

export default async function DashboardPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-500 mt-1">This month&apos;s AI usage and costs</p>
      </div>
      <UsageOverview />
      <div className="mt-8">
        <CostChart />
      </div>
    </div>
  );
}
