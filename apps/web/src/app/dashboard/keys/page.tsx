import { ApiKeyManager } from "../../../components/ApiKeyManager";

export default function ApiKeysPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
        <p className="text-gray-500 mt-1">Create and manage API keys for your team</p>
      </div>
      <ApiKeyManager />
    </div>
  );
}
