"use client";

import { ReactNode, useEffect, useState } from "react";
import { disconnectSocket, getSocket } from "@/lib/socket";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    try {
      getSocket();
    } catch {
      setConfigError("Dashboard configuration error — contact your administrator.");
    }

    return () => {
      disconnectSocket();
    };
  }, []);

  if (configError) {
    return (
      <main className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/15 ring-1 ring-inset ring-red-500/20">
          <svg className="h-6 w-6 text-red-400" viewBox="0 0 24 24" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <p className="text-base font-semibold text-slate-100">{configError}</p>
      </main>
    );
  }

  return <>{children}</>;
}
