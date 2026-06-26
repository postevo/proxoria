import { TeamManager } from "../../../components/TeamManager";

export default function TeamPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Team</h1>
        <p className="text-gray-500 mt-1">Invite teammates and manage their access</p>
      </div>
      <TeamManager />
    </div>
  );
}
