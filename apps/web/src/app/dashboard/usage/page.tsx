import { UsageLogs } from "../../../components/UsageLogs";

export default function UsagePage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Usage Logs</h1>
        <p className="text-gray-500 mt-1">Request-level audit trail</p>
      </div>
      <UsageLogs />
    </div>
  );
}
