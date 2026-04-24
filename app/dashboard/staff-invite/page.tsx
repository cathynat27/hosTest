"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminInvitePanel from "@/app/dashboard/admin-invite-panel";
import { getCurrentUser } from "@/lib/auth";

export default function StaffInvitePage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace("/login?reason=missing-token");
      return;
    }
    setIsAdmin(user.role === "ADMIN");
    setReady(true);
  }, [router]);

  if (!ready) return null;

  return (
    <main className="app-shell">
      <div className="glass-card mx-auto max-w-4xl overflow-hidden rounded-[1.75rem]">
        <header className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-200/70 bg-white/65 px-4 py-3 sm:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Admin Tools</p>
            <p className="card-title text-lg font-semibold">Staff Invite Center</p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="btn-secondary flex items-center gap-1.5 px-3 py-2 text-xs"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </header>

        <div className="px-4 py-6 sm:px-6 sm:py-8">
          <AdminInvitePanel isAdmin={isAdmin} />
        </div>
      </div>
    </main>
  );
}
