"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import HoscoverLogo from "@/app/components/hoscover-logo";
import { getToken, setAuthSession } from "@/lib/auth";
import { login } from "@/lib/api";
import { isDevLoginEnabled } from "@/lib/runtime-config";

const ENABLE_DEV_LOGINS = isDevLoginEnabled();

type TestUser = { email: string; password: string; label: string };

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [testUsers, setTestUsers] = useState<TestUser[]>([]);

  const reason = searchParams.get("reason");

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && ENABLE_DEV_LOGINS) {
      import("@/lib/dev-logins").then((mod) => setTestUsers(mod.TEST_USERS));
    }
  }, []);

  useEffect(() => {
    // Only auto-redirect if there's a token AND no error reason
    // This prevents loops when a session is invalid but still present
    const token = getToken();
    if (token && !reason) {
      router.replace("/dashboard");
    }
  }, [router, reason]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await login(email.trim(), password);
      setAuthSession(result.token, result.user);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onTestUserLogin = async (userEmail: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await login(userEmail, pass);
      setAuthSession(result.token, result.user);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-3">
          <HoscoverLogo
            className="flex items-center gap-3"
            textClassName="space-y-0.5"
            markClassName="h-10 w-10 rounded-xl"
          />
          <Link
            href="/"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Back
          </Link>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Staff sign in</h1>
        <p className="mt-2 text-sm text-slate-600">Access the dashboard and manage guest conversations.</p>

        {ENABLE_DEV_LOGINS && testUsers.length > 0 && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Quick Logins</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {testUsers.map((user) => (
                <button
                  key={user.email}
                  type="button"
                  onClick={() => onTestUserLogin(user.email, user.password)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Login as {user.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">Email address</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@hotel.com"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-800 focus:ring-4 focus:ring-slate-200"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-4 pr-16 text-sm text-slate-900 outline-none transition focus:border-slate-800 focus:ring-4 focus:ring-slate-200"
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

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6 space-y-1 text-center text-xs text-slate-600">
          <p>
            Need access?{" "}
            <Link href="/signup/invite" className="font-semibold text-slate-900 hover:text-slate-700">
              Join from invite
            </Link>
          </p>
          <p>
            New hotel setup?{" "}
            <Link href="/onboarding" className="font-semibold text-slate-900 hover:text-slate-700">
              Start onboarding
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
