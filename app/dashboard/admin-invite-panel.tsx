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
    <section className="glass-card rounded-3xl p-4 md:p-6">
      <div className="mb-5">
        <h3 className="card-title text-lg font-semibold">Invite teammates</h3>
        <p className="mt-1 text-sm text-slate-600">
          Send secure invitation links to staff and admins. Default role is Staff.
        </p>
      </div>

      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-[1fr_150px_auto] md:items-end">
        <div>
          <label htmlFor="invite-email" className="ui-label">
            Invite Email
          </label>
          <input
            id="invite-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            placeholder="new.staff@hotel.com"
            className="ui-input"
          />
        </div>

        <div>
          <label htmlFor="invite-role" className="ui-label">
            Role
          </label>
          <select
            id="invite-role"
            value={role}
            onChange={(event) => setRole(event.target.value as InviteRole)}
            className="ui-input"
          >
            <option value="STAFF">Staff</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Sending..." : `Send ${roleLabel} Invite`}
        </button>
      </form>

      {error && (
        <div className="mt-3 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-sm font-medium text-emerald-800">Invite sent to {result.email}</p>
          <p className="mt-1 text-xs text-emerald-700">
            Expires on {formatExpiry(result.expiresAt)}.
          </p>
        </div>
      )}
    </section>
  );
}
