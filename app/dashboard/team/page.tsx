"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { changeTeamMemberRole, createInvite, deactivateTeamMember, getTeamMembers } from "@/lib/api";
import { getCurrentUser, getToken } from "@/lib/auth";
import { TeamMember, UserRole } from "@/types";

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function avatarChars(name: string, email: string): string {
  if (name) {
    const parts = name.trim().split(" ");
    return parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  STAFF: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
};

export default function TeamPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("STAFF");
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [actionTarget, setActionTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) { router.replace("/login"); return; }
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user?.role !== "ADMIN") { router.replace("/dashboard"); return; }
    load();
  }, []);

  const load = () => {
    setLoading(true);
    setError(null);
    getTeamMembers()
      .then(setMembers)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load team"))
      .finally(() => setLoading(false));
  };

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteError(null);
    setInviteSuccess(null);
    try {
      const res = await createInvite({ email: inviteEmail.trim(), role: inviteRole });
      setInviteSuccess(`Invite sent to ${res.email}. Expires in 48 hours.`);
      setInviteEmail("");
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setInviting(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    setActionTarget(id);
    try {
      const updated = await deactivateTeamMember(id);
      setMembers((prev) => prev.map((m) => (m.id === id ? updated : m)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deactivate member");
    } finally {
      setActionTarget(null);
    }
  };

  const handleRoleChange = async (id: string, role: UserRole) => {
    setActionTarget(id);
    try {
      const updated = await changeTeamMemberRole(id, role);
      setMembers((prev) => prev.map((m) => (m.id === id ? updated : m)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change role");
    } finally {
      setActionTarget(null);
    }
  };

  const activeMembers = members.filter((m) => m.is_active);
  const inactiveMembers = members.filter((m) => !m.is_active);

  return (
    <main className="flex h-full flex-col overflow-hidden bg-slate-50/50 p-3 sm:p-4">
      {/* Header */}
      <header className="glass-card mb-3 flex flex-shrink-0 items-center justify-between gap-3 rounded-2xl px-4 py-2.5 sm:h-12">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-tight text-slate-900">Team</span>
          <span className="rounded-full bg-blue-600/10 px-2 py-px text-[10px] font-semibold text-blue-700">
            Admin
          </span>
          {!loading && (
            <span className="rounded-full bg-slate-100 px-2 py-px text-[10px] font-semibold text-slate-600">
              {activeMembers.length} / 20 members
            </span>
          )}
        </div>
      </header>

      <div className="light-scroll min-h-0 flex-1 overflow-y-auto space-y-4">
        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}

        {/* Invite form */}
        <div className="glass-card rounded-2xl p-5">
          <h2 className="text-sm font-bold text-slate-900">Invite Team Member</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            An invite link will be sent by email and expires in 48 hours.
          </p>
          <form onSubmit={(e) => void handleInvite(e)} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="invite-email" className="ui-label">Email Address</label>
              <input
                id="invite-email"
                type="email"
                className="ui-input"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="staff@hotel.com"
                required
              />
            </div>
            <div className="sm:w-36">
              <label htmlFor="invite-role" className="ui-label">Role</label>
              <select
                id="invite-role"
                className="ui-input"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as UserRole)}
              >
                <option value="STAFF">Staff</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={inviting || !inviteEmail.trim()}
              className="btn-primary px-5 py-[0.72rem] text-sm disabled:opacity-60 sm:self-end"
            >
              {inviting ? "Sending…" : "Send Invite"}
            </button>
          </form>
          {inviteSuccess && (
            <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
              {inviteSuccess}
            </p>
          )}
          {inviteError && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {inviteError}
            </p>
          )}
        </div>

        {/* Active members */}
        <div className="glass-card overflow-hidden rounded-2xl">
          <div className="border-b border-slate-200/70 px-5 py-3">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Active Members ({activeMembers.length})
            </h2>
          </div>

          {loading && (
            <div className="space-y-px px-2 py-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 rounded-lg p-3">
                  <div className="skeleton-light h-9 w-9 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton-light h-3 w-32 rounded" />
                    <div className="skeleton-light h-2.5 w-48 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && activeMembers.length === 0 && (
            <p className="px-5 py-6 text-sm text-slate-400">No active members yet.</p>
          )}

          <div>
            {activeMembers.map((member, idx) => {
              const isSelf = member.id === currentUser?.id;
              const isProcessing = actionTarget === member.id;
              return (
                <div
                  key={member.id}
                  className={`px-4 py-3.5 sm:px-5 ${idx < activeMembers.length - 1 ? "border-b border-slate-100" : ""}`}
                >
                  {/* Main row: avatar + info + desktop actions */}
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                      {avatarChars(member.name, member.email)}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {member.name || member.email}
                          {isSelf && <span className="ml-1 text-[10px] font-normal text-slate-400">(you)</span>}
                        </p>
                        <span className={`flex-shrink-0 rounded-full px-2 py-px text-[10px] font-semibold ${ROLE_COLORS[member.role]}`}>
                          {member.role}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-400">
                        {member.email} · Last login: {formatDate(member.last_login_at)}
                      </p>
                    </div>

                    {/* Desktop-only inline actions */}
                    {!isSelf && (
                      <div className="hidden sm:flex flex-shrink-0 items-center gap-2">
                        <select
                          value={member.role}
                          onChange={(e) => void handleRoleChange(member.id, e.target.value as UserRole)}
                          disabled={isProcessing}
                          aria-label={`Change role for ${member.name || member.email}`}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:opacity-50"
                        >
                          <option value="STAFF">Staff</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => void handleDeactivate(member.id)}
                          disabled={isProcessing}
                          className="rounded-lg border border-red-100 px-2.5 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          {isProcessing ? "…" : "Deactivate"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Mobile-only action row — indented to align with info text */}
                  {!isSelf && (
                    <div className="mt-2.5 flex items-center gap-2 pl-12 sm:hidden">
                      <select
                        value={member.role}
                        onChange={(e) => void handleRoleChange(member.id, e.target.value as UserRole)}
                        disabled={isProcessing}
                        aria-label={`Change role for ${member.name || member.email}`}
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:opacity-50"
                      >
                        <option value="STAFF">Staff</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => void handleDeactivate(member.id)}
                        disabled={isProcessing}
                        className="rounded-lg border border-red-100 px-2.5 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        {isProcessing ? "…" : "Deactivate"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Deactivated members */}
        {inactiveMembers.length > 0 && (
          <div className="glass-card overflow-hidden rounded-2xl">
            <div className="border-b border-slate-200/70 px-5 py-3">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Deactivated ({inactiveMembers.length})
              </h2>
            </div>
            {inactiveMembers.map((member, idx) => (
              <div
                key={member.id}
                className={`flex items-center gap-4 px-5 py-3.5 opacity-50 ${idx < inactiveMembers.length - 1 ? "border-b border-slate-100" : ""}`}
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-400">
                  {avatarChars(member.name, member.email)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-slate-500">{member.name || member.email}</p>
                  <p className="text-xs text-slate-400">{member.email}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-px text-[10px] font-semibold text-slate-400">
                  Deactivated
                </span>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-slate-400">
          Max 20 team members per hotel. At least one Admin must remain active.
        </p>
      </div>
    </main>
  );
}
