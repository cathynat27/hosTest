/**
 * Campaigns List Page — /dashboard/campaigns
 *
 * Admin-only entry point for the WhatsApp Campaign Messaging module.
 * Shows all campaigns for the hotel (across all statuses) with live filters
 * and quick-glance delivery stats. Clicking a card opens the delivery report.
 *
 * Access gate: ADMIN role required. Staff are redirected to /dashboard.
 */
"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteCampaign, getCampaigns } from "@/lib/api";
import { getCurrentUser, getToken } from "@/lib/auth";
import type { Campaign, CampaignStatus, CampaignType } from "@/types";

// ─── Display constants ────────────────────────────────────────────────────────

/** Human-readable labels for each campaign type value. */
const TYPE_LABELS: Record<CampaignType, string> = {
  pre_arrival_upsell:     "Pre-Arrival Upsell",
  in_stay_offer:          "In-Stay Offer",
  fnb_promotion:          "F&B Promotion",
  late_checkout:          "Late Checkout",
  post_stay_reengagement: "Post-Stay Re-engagement",
  seasonal_event:         "Seasonal / Event",
};

/**
 * Tailwind classes for status pills.
 * Colors follow the existing analytics/team pattern: emerald = good, amber = in-flight,
 * red = problem, slate = neutral.
 */
const STATUS_STYLES: Record<CampaignStatus, string> = {
  draft:      "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  scheduled:  "bg-blue-50  text-blue-700  ring-1 ring-blue-200",
  processing: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  completed:  "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  cancelled:  "bg-slate-100 text-slate-400 ring-1 ring-slate-200",
  failed:     "bg-red-50   text-red-700   ring-1 ring-red-200",
};

type StatusFilter = "all" | CampaignStatus;

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all",        label: "All" },
  { key: "draft",      label: "Draft" },
  { key: "scheduled",  label: "Scheduled" },
  { key: "processing", label: "Sending" },
  { key: "completed",  label: "Completed" },
  { key: "failed",     label: "Failed" },
];

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconCampaign({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
    </svg>
  );
}

function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function IconPencil({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
    </svg>
  );
}

function IconTrash({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  );
}

function IconAlertTriangle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5z" clipRule="evenodd" />
    </svg>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Loading placeholder card that matches the CampaignCard layout. */
function SkeletonCard() {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="skeleton-light mb-2 h-4 w-48 rounded" />
          <div className="skeleton-light h-3 w-28 rounded" />
        </div>
        <div className="skeleton-light h-5 w-20 rounded-full" />
      </div>
      <div className="mt-4 flex gap-5 border-t border-slate-100 pt-3">
        <div className="skeleton-light h-3 w-16 rounded" />
        <div className="skeleton-light h-3 w-16 rounded" />
        <div className="skeleton-light h-3 w-16 rounded" />
      </div>
    </div>
  );
}

/** A single stat column inside a campaign card. */
function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${accent ?? "text-slate-700"}`}>
        {value.toLocaleString()}
      </span>
    </div>
  );
}

/**
 * Statuses where deleting is safe — never allow delete while a send is in-flight.
 */
const DELETABLE_STATUSES: CampaignStatus[] = [
  "draft", "scheduled", "completed", "cancelled", "failed",
];

/**
 * Campaign card. The main body is a Link to the detail/report page.
 * An action row below exposes Edit (drafts only) and Delete (all except processing).
 */
function CampaignCard({
  campaign,
  onDelete,
}: {
  campaign: Campaign;
  onDelete: (c: Campaign) => void;
}) {
  const hasSentData = campaign.status !== "draft";
  const canDelete = DELETABLE_STATUSES.includes(campaign.status);
  const canEdit = campaign.status === "draft";

  return (
    <div className="glass-card overflow-hidden rounded-2xl">
      {/* Clickable body → detail / report page */}
      <Link
        href={`/dashboard/campaigns/${campaign.id}`}
        className="block p-5 transition hover:bg-slate-50/60"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{campaign.name}</p>
            <p className="mt-0.5 text-xs text-slate-500">{TYPE_LABELS[campaign.campaign_type]}</p>
          </div>
          <span
            className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_STYLES[campaign.status]}`}
          >
            {campaign.status}
          </span>
        </div>

        {hasSentData && (
          <div className="mt-4 flex flex-wrap gap-5 border-t border-slate-100 pt-3">
            <Stat label="Targeted" value={campaign.recipient_count_targeted} />
            <Stat label="Sent" value={campaign.recipient_count_sent} accent="text-blue-600" />
            <Stat
              label="Skipped"
              value={campaign.recipient_count_skipped}
              accent={campaign.recipient_count_skipped > 0 ? "text-amber-600" : undefined}
            />
          </div>
        )}

        {campaign.scheduled_at && campaign.status === "scheduled" && (
          <p className="mt-3 text-[11px] text-slate-400">
            Scheduled for {new Date(campaign.scheduled_at).toLocaleString()}
          </p>
        )}
        {campaign.completed_at && (
          <p className="mt-3 text-[11px] text-slate-400">
            Completed {new Date(campaign.completed_at).toLocaleString()}
          </p>
        )}
      </Link>

      {/* Action row — rendered only when at least one action is available */}
      {(canEdit || canDelete) && (
        <div className="flex items-center justify-end gap-1 border-t border-slate-100 px-3 py-2">
          {canEdit && (
            <Link
              href={`/dashboard/campaigns/new?edit=${campaign.id}`}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              <IconPencil className="h-3.5 w-3.5" />
              Edit
            </Link>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(campaign)}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 transition hover:bg-red-50 hover:text-red-600"
            >
              <IconTrash className="h-3.5 w-3.5" />
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* Admin-only guard — campaign creation is a privileged action. */
  useEffect(() => {
    if (!getToken()) { router.replace("/login"); return; }
    if (getCurrentUser()?.role !== "ADMIN") { router.replace("/dashboard"); return; }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const campaigns = await getCampaigns();
        setCampaigns(campaigns);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load campaigns");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteCampaign(deleteTarget.id);
      setCampaigns((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete campaign");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const filtered =
    statusFilter === "all"
      ? campaigns
      : campaigns.filter((c) => c.status === statusFilter);

  return (
    <main className="flex h-full flex-col overflow-hidden bg-slate-50/50 p-3 sm:p-4">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="glass-card mb-3 flex flex-shrink-0 items-center justify-between gap-3 rounded-2xl px-4 py-2.5 sm:h-12">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-tight text-slate-900">Campaigns</span>
          <span className="rounded-full bg-blue-600/10 px-2 py-px text-[10px] font-semibold text-blue-700">
            Admin
          </span>
        </div>
        <Link
          href="/dashboard/campaigns/new"
          className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700"
        >
          <IconPlus className="h-3.5 w-3.5" />
          New Campaign
        </Link>
      </header>

      {/* ── Status filter tabs ──────────────────────────────────────────────── */}
      <div className="mb-3 flex flex-shrink-0 items-center gap-1 overflow-x-auto">
        {STATUS_TABS.map((tab) => {
          const count =
            tab.key === "all"
              ? campaigns.length
              : campaigns.filter((c) => c.status === tab.key).length;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`flex-shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                statusFilter === tab.key
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {tab.label}
              {!loading && (
                <span className="ml-1 opacity-60">({count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="light-scroll min-h-0 flex-1 overflow-y-auto">
        {error && (
          <div className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <IconCampaign className="h-7 w-7 text-slate-400" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-900">
              {statusFilter === "all" ? "No campaigns yet" : `No ${statusFilter} campaigns`}
            </p>
            <p className="mt-1 max-w-xs text-xs text-slate-400">
              {statusFilter === "all"
                ? "Create your first WhatsApp campaign to reach opted-in guests at scale."
                : "No campaigns with this status right now."}
            </p>
            {statusFilter === "all" && (
              <Link
                href="/dashboard/campaigns/new"
                className="mt-5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Create Campaign
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Delete confirmation modal ────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="glass-card animate-scale-in mx-4 max-w-sm rounded-3xl p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
              <IconAlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">Delete campaign?</h3>
            <p className="mt-2 text-sm text-slate-500">
              <span className="font-semibold text-slate-800">{deleteTarget.name}</span> will be
              permanently removed. This cannot be undone.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
