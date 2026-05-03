
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAnalyticsOverview } from "@/lib/api";
import { getCurrentUser, getToken } from "@/lib/auth";
import { AnalyticsDateRange, AnalyticsOverview } from "@/types";

type DateOption = { key: AnalyticsDateRange; label: string };

const DATE_OPTIONS: DateOption[] = [
  { key: "today", label: "Today" },
  { key: "last_7_days", label: "Last 7 Days" },
  { key: "last_30_days", label: "Last 30 Days" },
];

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="glass-card flex flex-col gap-1 rounded-2xl p-5">
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
      <p className={`text-3xl font-bold tracking-tight ${accent ?? "text-slate-900"}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="glass-card flex flex-col gap-3 rounded-2xl p-5">
      <div className="skeleton-light h-3 w-24 rounded" />
      <div className="skeleton-light h-8 w-32 rounded" />
      <div className="skeleton-light h-2.5 w-16 rounded" />
    </div>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [range, setRange] = useState<AnalyticsDateRange>("last_7_days");
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) { router.replace("/login"); return; }
    if (getCurrentUser()?.role !== "ADMIN") { router.replace("/dashboard"); return; }
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getAnalyticsOverview(range)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, [range]);

  const formatMinutes = (mins: number) => {
    if (mins < 60) return `${Math.round(mins)}m`;
    return `${Math.floor(mins / 60)}h ${Math.round(mins % 60)}m`;
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);

  return (
    <main className="flex h-full flex-col overflow-hidden bg-slate-50/50 p-3 sm:p-4">
      {/* Header */}
      <header className="glass-card mb-3 flex flex-shrink-0 items-center justify-between gap-3 rounded-2xl px-4 py-2.5 sm:h-12">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-tight text-slate-900">Analytics</span>
          <span className="rounded-full bg-blue-600/10 px-2 py-px text-[10px] font-semibold text-blue-700">
            Admin
          </span>
        </div>

        {/* Date range */}
        <div className="flex items-center gap-1">
          {DATE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setRange(opt.key)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                range === opt.key
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="light-scroll min-h-0 flex-1 overflow-y-auto">
        {error && (
          <div className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}

        {/* Metric cards grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : data ? (
            <>
              <StatCard
                label="Total Conversations"
                value={data.total_conversations.toLocaleString()}
                sub="All conversations in period"
              />
              <StatCard
                label="New Guests"
                value={data.new_guests.toLocaleString()}
                sub="New profiles created"
                accent="text-sky-600"
              />
              <StatCard
                label="Avg. First Response"
                value={formatMinutes(data.avg_first_response_time_minutes)}
                sub="First inbound → first human reply"
                accent={data.avg_first_response_time_minutes <= 5 ? "text-emerald-600" : "text-amber-600"}
              />
              <StatCard
                label="Resolution Rate"
                value={`${Math.round(data.resolution_rate)}%`}
                sub="Conversations marked resolved"
                accent={data.resolution_rate >= 80 ? "text-emerald-600" : "text-amber-600"}
              />
              <StatCard
                label="Bookings Attributed"
                value={data.bookings_attributed.toLocaleString()}
                sub="Manually confirmed bookings"
                accent="text-blue-600"
              />
              <StatCard
                label="Revenue Attributed"
                value={formatCurrency(data.revenue_attributed)}
                sub="Sum of confirmed booking amounts"
                accent="text-emerald-700"
              />
            </>
          ) : null}
        </div>

        {/* Attribution note */}
        {!loading && data && (
          <p className="mt-4 text-xs text-slate-400">
            Bookings and revenue are manually attributed by staff marking conversations as &quot;Booking Confirmed&quot;.
            No PMS integration in v1.
          </p>
        )}
      </div>
    </main>
  );
}
