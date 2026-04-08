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
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-16">
      <div className="w-full max-w-[380px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create account</h1>
        <p className="mt-1.5 text-sm text-slate-500">Register your staff account to access the dashboard.</p>
        <p className="mt-2 text-xs text-slate-500">
          If your hotel uses invites, use{" "}
          <Link href="/signup/invite" className="font-semibold text-indigo-600 hover:text-indigo-700">
            invite signup
          </Link>
          .
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@hotel.com"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>

          <div>
            <label htmlFor="hotelId" className="mb-1.5 block text-sm font-medium text-slate-700">
              Hotel ID
            </label>
            <input
              id="hotelId"
              type="text"
              required
              value={hotelId}
              onChange={(e) => setHotelId(e.target.value)}
              placeholder="hotel_xxx"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>

          <div>
            <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-slate-700">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as "ADMIN" | "STAFF")}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            >
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 chars with letters and numbers"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-12 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-inset ring-emerald-200">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/25 outline-none transition-all hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:bg-indigo-400"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
