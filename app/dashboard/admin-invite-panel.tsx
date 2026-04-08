"use client";

import { FormEvent, useMemo, useState } from "react";
import { ApiError, createInvite } from "@/lib/api";
import { CreateInviteResponse, InviteRole } from "@/types";

type AdminInvitePanelProps = {
  isAdmin: boolean;
};

function mapInviteError(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return "Please provide a valid email and role before sending the invite.";
      case 401:
        return "Your session has expired. Sign in again to continue.";
      case 403:
        return "Only hotel admins can send invites.";
      case 404:
        return "Invite service was not found. Please try again later.";
      case 409:
        return "An account or invite already exists for this email.";
      default:
        return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Failed to send invite. Please try again.";
}

function formatExpiry(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "Expiry date unavailable";
  }

  return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export default function AdminInvitePanel({ isAdmin }: AdminInvitePanelProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("STAFF");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateInviteResponse | null>(null);

  const roleLabel = useMemo(() => (role === "ADMIN" ? "Admin" : "Staff"), [role]);

  if (!isAdmin) {
    return null;
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      setError("Invite email is required.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await createInvite({ email: email.trim(), role });
      setResult(response);
      setEmail("");
      setRole("STAFF");
    } catch (err) {
      setError(mapInviteError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Admin Invites</h3>
        <p className="mt-1 text-xs text-slate-500">
          Send secure invitation links to staff and admins. Default role is Staff.
        </p>
      </div>

      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-[1fr_130px_auto] md:items-end">
        <div>
          <label htmlFor="invite-email" className="mb-1.5 block text-xs font-medium text-slate-700">
            Invite Email
          </label>
          <input
            id="invite-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            placeholder="new.staff@hotel.com"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
          />
        </div>

        <div>
          <label htmlFor="invite-role" className="mb-1.5 block text-xs font-medium text-slate-700">
            Role
          </label>
          <select
            id="invite-role"
            value={role}
            onChange={(event) => setRole(event.target.value as InviteRole)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
          >
            <option value="STAFF">Staff</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
        >
          {loading ? "Sending..." : `Send ${roleLabel} Invite`}
        </button>
      </form>

      {error && (
        <div className="mt-3 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700 ring-1 ring-inset ring-red-200">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2.5 ring-1 ring-inset ring-emerald-200">
          <p className="text-sm font-medium text-emerald-800">Invite sent to {result.email}</p>
          <p className="mt-1 text-xs text-emerald-700">
            Expires on {formatExpiry(result.expiresAt)}.
          </p>
        </div>
      )}
    </section>
  );
}
