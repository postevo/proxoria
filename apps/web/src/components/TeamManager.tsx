"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

interface Member {
  userId: string;
  role: string;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

export function TeamManager() {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"org:admin" | "org:member" | "org:viewer">("org:member");

  const { data: members = [], isLoading } = useQuery<Member[]>({
    queryKey: ["team-members"],
    queryFn: () => api.get("/v1/teams/members").then((r) => r.data),
  });

  const inviteMutation = useMutation({
    mutationFn: (payload: { emailAddress: string; role: string }) =>
      api.post("/v1/teams/invite", payload).then((r) => r.data),
    onSuccess: () => {
      setEmail("");
      qc.invalidateQueries({ queryKey: ["team-members"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => api.delete(`/v1/teams/members/${userId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team-members"] }),
  });

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Invite team member</h2>
        <div className="flex gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@company.com"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as typeof role)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="org:admin">Admin</option>
            <option value="org:member">Member</option>
            <option value="org:viewer">Viewer</option>
          </select>
          <button
            onClick={() => email && inviteMutation.mutate({ emailAddress: email, role })}
            disabled={!email || inviteMutation.isPending}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {inviteMutation.isPending ? "Sending…" : "Send invite"}
          </button>
        </div>
        {inviteMutation.isSuccess && (
          <p className="text-sm text-green-600 mt-2">Invitation sent.</p>
        )}
        {inviteMutation.isError && (
          <p className="text-sm text-red-600 mt-2">Failed to send invitation.</p>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Members</h2>
        </div>
        {isLoading ? (
          <div className="p-6 text-center text-gray-400">Loading…</div>
        ) : members.length === 0 ? (
          <div className="p-6 text-center text-gray-400">No members yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["User ID", "Role", "Joined", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.userId} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{m.userId}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                      {ROLE_LABELS[m.role] ?? m.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {m.role !== "OWNER" && (
                      <button
                        onClick={() => removeMutation.mutate(m.userId)}
                        disabled={removeMutation.isPending}
                        className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
