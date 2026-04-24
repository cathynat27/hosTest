"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, registerFromInvite, validateInviteToken } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { InviteTokenValidation } from "@/types";

type InviteStatus = "loading" | "valid" | "invalid";

function mapInviteValidationError(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return "Invite token is malformed. Please use the full link from your email.";
      case 404:
        return "Invite not found. Request a fresh invite from your hotel admin.";
      case 410:
        return "This invite has expired or was already used. Request a new invite.";
      default:
        return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to validate invite. Please retry from your invite email link.";
}

function mapRegisterError(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return "Please provide a valid password and retry.";
      case 404:
        return "Invite not found. Request a fresh invite and try again.";
      case 409:
        return "An account already exists for this invite email. Sign in instead.";
      case 410:
        return "This invite is no longer valid. Request a new invite.";
      default:
        return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Signup from invite failed. Please try again.";
}

function formatExpiry(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function InviteSignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);

  const [inviteState, setInviteState] = useState<InviteStatus>("loading");
  const [invite, setInvite] = useState<InviteTokenValidation | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (getToken()) {
      router.replace("/dashboard");
      return;
    }

    if (!token) {
      setInviteState("invalid");
      setInviteError("Missing invite token. Use the exact link from your invite email.");
      return;
    }

    let isMounted = true;

    const validate = async () => {
      setInviteState("loading");
      setInviteError(null);
      setInvite(null);

      try {
        const response = await validateInviteToken(token);
        if (!isMounted) return;
        setInvite(response);
        setInviteState("valid");
      } catch (err) {
        if (!isMounted) return;
        setInviteState("invalid");
        setInviteError(mapInviteValidationError(err));
      }
    };

    void validate();

    return () => {
      isMounted = false;
    };
  }, [router, token]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token || !invite) {
      setSubmitError("Invite validation is required before signup.");
      return;
    }

    if (password.length < 8) {
      setSubmitError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError("Password confirmation does not match.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      await registerFromInvite({
        token,
        password,
        fullName: fullName.trim() || undefined,
      });
      router.replace("/login");
    } catch (err) {
      setSubmitError(mapRegisterError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="app-shell">
      <div className="mx-auto max-w-3xl">
        <div className="glass-card rounded-[2rem] p-5 sm:p-7">
        <div className="mb-6">
          <p className="pill inline-flex px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">Invite Signup</p>
          <h1 className="card-title mt-3 text-3xl font-semibold tracking-tight">Complete Your Account</h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Your invite determines hotel and role access. These values are locked for security.
          </p>
        </div>

        {inviteState === "loading" && (
          <div className="soft-panel rounded-2xl p-5 text-sm text-slate-700">
            Validating your invite link...
          </div>
        )}

        {inviteState === "invalid" && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm font-semibold text-red-800">Invite link is invalid</p>
            <p className="mt-2 text-sm text-red-700">{inviteError}</p>
            <p className="mt-4 text-sm text-red-700">
              Next step: Ask your hotel administrator to send a new invite from the admin dashboard.
            </p>
            <div className="mt-4">
              <Link href="/login" className="text-sm font-semibold text-red-800 hover:text-red-900">
                Go to login
              </Link>
            </div>
          </div>
        )}

        {inviteState === "valid" && invite && (
          <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-white/75 bg-white/65 p-5 shadow-[0_18px_40px_rgba(20,42,78,0.12)] md:p-6">
            <section className="soft-panel rounded-2xl p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Invite Details</p>
              <div className="mt-3 grid gap-3 text-sm text-slate-800 md:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Invited Email</p>
                  <p className="font-semibold">{invite.email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Role</p>
                  <p className="font-semibold">{invite.role}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Hotel</p>
                  <p className="font-semibold">{invite.hotel.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Hotel Code</p>
                  <p className="font-semibold">{invite.hotel.code}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-slate-500">Invite Expires</p>
                  <p className="font-semibold">{formatExpiry(invite.expiresAt)}</p>
                </div>
              </div>
            </section>

            <div>
              <label htmlFor="fullName" className="ui-label">
                Full Name (optional)
              </label>
              <input
                id="fullName"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="ui-input"
              />
            </div>

            <div>
              <label htmlFor="password" className="ui-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="ui-input"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="ui-label">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                className="ui-input"
              />
            </div>

            {submitError && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
                {submitError}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                Back to login
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Creating account..." : "Create account and continue"}
              </button>
            </div>
          </form>
        )}
      </div>
      </div>
    </main>
  );
}

export default function InviteSignupPage() {
  return (
    <Suspense
      fallback={(
        <main className="app-shell">
          <div className="glass-card mx-auto max-w-2xl rounded-2xl p-5 text-sm text-slate-600">
            Loading invite...
          </div>
        </main>
      )}
    >
      <InviteSignupContent />
    </Suspense>
  );
}
