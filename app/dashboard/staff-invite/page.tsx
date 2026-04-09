"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminInvitePanel from "@/app/dashboard/admin-invite-panel";
import { getCurrentUser } from "@/lib/auth";

export default function StaffInvitePage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace("/login?reason=missing-token");
      return;
    }
    setIsAdmin(user.role === "ADMIN");
    setChecked(true);
  }, [router]);

  if (!checked) return null;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="flex h-12 items-center gap-3 border-b border-slate-200 bg-white px-4">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <span className="text-sm font-semibold text-slate-700">Staff Invite</span>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <AdminInvitePanel isAdmin={isAdmin} />
      </div>
    </main>
  );
}
