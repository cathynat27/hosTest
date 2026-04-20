"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register } from "@/lib/api";
import { getToken, setAuthSession } from "@/lib/auth";

function mapSignupErrorMessage(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("email already exists")) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (normalized.includes("invalid hotelid")) {
    return "Hotel ID was not recognized. Please check it with your administrator.";
  }
  if (normalized.includes("email, password and hotelid are required")) {
    return "Please provide email, password, and hotel ID.";
  }
  if (normalized.includes("password must be at least 8 chars")) {
    return "Password must be at least 8 characters and include letters and numbers.";
  }
  if (normalized.includes("role must be admin or staff")) {
    return "Role must be either Staff or Admin.";
  }
  if (normalized.includes("request timed out")) {
    return "Signup timed out. Please check your connection and try again.";
  }
  if (normalized.includes("unable to reach the server")) {
    return "Cannot reach the server right now. Please try again in a moment.";
  }
  if (normalized.includes("registration failed")) {
    return "Signup failed on the server. Please try again shortly.";
  }

  return message;
}

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hotelId, setHotelId] = useState("");
  const [role, setRole] = useState<"ADMIN" | "STAFF">("STAFF");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getToken()) {
      router.replace("/dashboard");
    }
  }, [router]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await register({
        email: email.trim(),
        password,
        hotelId: hotelId.trim(),
        role,
      });
      setAuthSession(result.token, result.user);
      setSuccess("Account created successfully. Redirecting to dashboard...");
      router.replace("/dashboard");
    } catch (err) {
      const fallback = "Sign up failed. Please try again.";
      const rawMessage = err instanceof Error ? err.message : fallback;
      setError(mapSignupErrorMessage(rawMessage));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-shell flex items-center justify-center">
      <div className="glass-card w-full max-w-2xl rounded-[2rem] p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8">
          <section className="soft-panel rounded-2xl p-5">
            <p className="pill inline-flex px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]">Direct Signup</p>
            <h1 className="card-title mt-4 text-3xl font-semibold">Create account</h1>
            <p className="muted-note mt-3 text-sm leading-relaxed">
              Register a staff account with your hotel ID, then continue straight to live guest conversations.
            </p>
            <div className="mt-6 space-y-3 text-xs text-slate-600">
              <p className="rounded-xl border border-white/80 bg-white/70 px-3 py-2">Use invite-based setup if your admin has sent a secure invite link.</p>
              <p className="rounded-xl border border-white/80 bg-white/70 px-3 py-2">Role selection controls access level inside your dashboard.</p>
            </div>
          </section>

          <section>
            <p className="mb-4 text-xs text-slate-600">
              Invite-based registration available at <Link href="/signup/invite" className="font-semibold text-blue-700 hover:text-blue-900">signup from invite</Link>.
            </p>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="ui-label">Email address</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@hotel.com"
                  className="ui-input"
                />
              </div>

              <div>
                <label htmlFor="hotelId" className="ui-label">Hotel ID</label>
                <input
                  id="hotelId"
                  type="text"
                  required
                  value={hotelId}
                  onChange={(e) => setHotelId(e.target.value)}
                  placeholder="hotel_xxx"
                  className="ui-input"
                />
              </div>

              <div>
                <label htmlFor="role" className="ui-label">Role</label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as "ADMIN" | "STAFF")}
                  className="ui-input"
                >
                  <option value="STAFF">Staff</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div>
                <label htmlFor="password" className="ui-label">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 chars with letters and numbers"
                    className="ui-input pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 px-3 text-xs font-semibold text-slate-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">{error}</div>}

              {success && <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-200">{success}</div>}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary mt-1 w-full px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-slate-600">
              Already have an account? <Link href="/login" className="font-semibold text-blue-700 hover:text-blue-900">Sign in</Link>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
