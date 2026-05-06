"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { disconnectSocket, getSocket } from "@/lib/socket";
import { clearAuthSession, getCurrentUser, handleAuthFailure } from "@/lib/auth";
import type { AuthUser } from "@/types";

function IconHotel({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M1 21V9.525L12 3l11 6.525V21H1zm2-2h4v-4H3v4zm0-6h4v-4H3v4zm6 6h4v-4H9v4zm0-6h4v-4H9v4zm6 6h4v-4h-4v4zm0-6h4v-4h-4v4z" />
    </svg>
  );
}

function IconInbox({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
    </svg>
  );
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function IconBolt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.268a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
    </svg>
  );
}

function IconChart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function IconTeam({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  );
}

/** Paper-airplane icon — represents outbound campaign sending. */
function IconCampaigns({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
    </svg>
  );
}

function IconLogout({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
    </svg>
  );
}

type NavItemProps = {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
};

function NavItem({ href, icon, label, active }: NavItemProps) {
  return (
    <Link
      href={href}
      title={label}
      className={`group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${active
        ? "bg-slate-900 text-white shadow-sm shadow-slate-900/25"
        : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        }`}
    >
      <span className="h-5 w-5">{icon}</span>
      {/* Tooltip */}
      <span className="pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-all group-hover:opacity-100">
        {label}
      </span>
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // ── All state starts as "unknown" on server and client alike ──────────────
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    // Resolve user
    const user = getCurrentUser();
    setCurrentUser(user);

    // Attempt to initialise the socket.
    //  • null   → no valid session (token missing/expired) → redirect to login
    //  • throws → configuration problem               → show error in UI
    try {
      const socket = getSocket();
      if (socket === null) {
        console.warn("[dashboard-layout] No socket/session, redirecting.");
        handleAuthFailure("missing");
        return;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setConfigError(
        `Dashboard configuration error${message ? ` (${message})` : ""} — contact your administrator.`
      );
    }

    // Mark as mounted last so the shell only shows once auth is confirmed
    setMounted(true);

    return () => {
      disconnectSocket();
    };
  }, []);

  const logout = () => {
    clearAuthSession();
    router.replace("/login");
  };

  const isAdmin = currentUser?.role === "ADMIN";

  const navItems = [
    { href: "/dashboard", label: "Inbox", icon: <IconInbox /> },
    { href: "/dashboard/guests", label: "Guests", icon: <IconUsers /> },
    ...(isAdmin
      ? [
        { href: "/dashboard/campaigns", label: "Campaigns", icon: <IconCampaigns /> },
        { href: "/dashboard/automations", label: "Automations", icon: <IconBolt /> },
        { href: "/dashboard/analytics", label: "Analytics", icon: <IconChart /> },
        { href: "/dashboard/team", label: "Team", icon: <IconTeam /> },
      ]
      : []),
  ];

  // ── Always render the same outer shell on server + initial client paint ───
  // Only swap in error UI or user-specific content after mount.
  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* ── Left nav rail ──────────────────────────────────────────────────── */}
      <nav className="relative z-40 flex w-[60px] flex-shrink-0 flex-col items-center gap-1 border-r border-slate-200 bg-white py-3 shadow-sm">
        {/* Brand mark */}
        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 shadow shadow-slate-900/25">
          <IconHotel className="h-4 w-4 text-white" />
        </div>

        <div className="h-px w-8 bg-slate-200" />

        {/* Nav items — only rendered after mount so server/client match */}
        <div className="mt-2 flex flex-col items-center gap-1">
          {mounted &&
            navItems.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
              return (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={active}
                />
              );
            })}
        </div>

        {/* Bottom: avatar + sign out */}
        <div className="mt-auto flex flex-col items-center gap-2">
          {mounted && currentUser && (
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold uppercase text-slate-600"
              title={currentUser.email}
            >
              {currentUser.email.slice(0, 2)}
            </div>
          )}
          <button
            type="button"
            onClick={logout}
            title="Sign out"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-500"
          >
            <IconLogout className="h-5 w-5" />
          </button>
        </div>
      </nav>

      {/* ── Page content ───────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Config error overlay — shown client-side only after mount */}
        {mounted && configError ? (
          <div className="flex flex-1 items-center justify-center px-6 text-center">
            <div className="glass-card rounded-3xl px-7 py-8">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/15 ring-1 ring-red-500/20">
                <svg className="h-6 w-6 text-red-400" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="mt-4 text-base font-semibold text-slate-900">{configError}</p>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}