/**
 * Campaign Detail Page — /dashboard/campaigns/[id]
 *
 * Shows the post-send delivery report for a single campaign:
 *   • A stats row (Targeted / Sent / Delivered / Read / Failed / Skipped)
 *   • A filterable per-recipient message table with per-message delivery timestamps
 *   • A Cancel button for campaigns that are still in "scheduled" state
 *
 * Guest replies that created inbox conversations are linked back to /dashboard
 * so staff can continue the conversation thread.
 *
 * Access gate: ADMIN role required.
 */
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
// import { cancelCampaign, getCampaignById } from "@/lib/api"; // ← uncomment when backend is ready
import { getCurrentUser, getToken } from "@/lib/auth";
import type {
  CampaignDetail,
  CampaignMessage,
  CampaignMessageStatus,
  CampaignStatus,
  CampaignType,
} from "@/types";

// ─── MOCK DATA 
// Using the same function names as the real API so no call sites below need changing.

const MOCK_MESSAGES: CampaignMessage[] = [
  { id: "msg-001", campaign_id: "camp-001", guest_id: "g-01", hotel_id: "hotel-1", phone_number: "+1 555 000 0001", resolved_message_body: "Hi James! Enjoy a relaxing spa treatment today.", meta_message_id: "wamid-001", status: "read", failure_reason: null, sent_at: "2026-05-03T10:01:00Z", delivered_at: "2026-05-03T10:01:15Z", read_at: "2026-05-03T10:05:00Z", replied_at: "2026-05-03T10:08:00Z", conversation_id: "conv-42" },
  { id: "msg-002", campaign_id: "camp-001", guest_id: "g-02", hotel_id: "hotel-1", phone_number: "+1 555 000 0002", resolved_message_body: "Hi Sofia! Enjoy a relaxing spa treatment today.", meta_message_id: "wamid-002", status: "read", failure_reason: null, sent_at: "2026-05-03T10:01:02Z", delivered_at: "2026-05-03T10:01:20Z", read_at: "2026-05-03T10:06:30Z", replied_at: null, conversation_id: null },
  { id: "msg-003", campaign_id: "camp-001", guest_id: "g-03", hotel_id: "hotel-1", phone_number: "+1 555 000 0003", resolved_message_body: "Hi Liam! Enjoy a relaxing spa treatment today.", meta_message_id: "wamid-003", status: "read", failure_reason: null, sent_at: "2026-05-03T10:01:04Z", delivered_at: "2026-05-03T10:01:22Z", read_at: "2026-05-03T10:07:10Z", replied_at: null, conversation_id: null },
  { id: "msg-004", campaign_id: "camp-001", guest_id: "g-04", hotel_id: "hotel-1", phone_number: "+1 555 000 0004", resolved_message_body: "Hi Amara! Enjoy a relaxing spa treatment today.", meta_message_id: "wamid-004", status: "read", failure_reason: null, sent_at: "2026-05-03T10:01:06Z", delivered_at: "2026-05-03T10:01:25Z", read_at: "2026-05-03T10:09:00Z", replied_at: "2026-05-03T10:15:00Z", conversation_id: "conv-43" },
  { id: "msg-005", campaign_id: "camp-001", guest_id: "g-05", hotel_id: "hotel-1", phone_number: "+1 555 000 0005", resolved_message_body: "Hi Noah! Enjoy a relaxing spa treatment today.", meta_message_id: "wamid-005", status: "read", failure_reason: null, sent_at: "2026-05-03T10:01:08Z", delivered_at: "2026-05-03T10:01:28Z", read_at: "2026-05-03T10:11:00Z", replied_at: null, conversation_id: null },
  { id: "msg-006", campaign_id: "camp-001", guest_id: "g-06", hotel_id: "hotel-1", phone_number: "+1 555 000 0006", resolved_message_body: "Hi Chen! Enjoy a relaxing spa treatment today.", meta_message_id: "wamid-006", status: "read", failure_reason: null, sent_at: "2026-05-03T10:01:10Z", delivered_at: "2026-05-03T10:01:30Z", read_at: "2026-05-03T10:13:00Z", replied_at: null, conversation_id: null },
  { id: "msg-007", campaign_id: "camp-001", guest_id: "g-07", hotel_id: "hotel-1", phone_number: "+1 555 000 0007", resolved_message_body: "Hi Isla! Enjoy a relaxing spa treatment today.", meta_message_id: "wamid-007", status: "read", failure_reason: null, sent_at: "2026-05-03T10:01:12Z", delivered_at: "2026-05-03T10:01:32Z", read_at: "2026-05-03T10:14:00Z", replied_at: null, conversation_id: null },
  { id: "msg-008", campaign_id: "camp-001", guest_id: "g-08", hotel_id: "hotel-1", phone_number: "+1 555 000 0008", resolved_message_body: "Hi Omar! Enjoy a relaxing spa treatment today.", meta_message_id: "wamid-008", status: "read", failure_reason: null, sent_at: "2026-05-03T10:01:14Z", delivered_at: "2026-05-03T10:01:35Z", read_at: "2026-05-03T10:16:00Z", replied_at: null, conversation_id: null },
  { id: "msg-009", campaign_id: "camp-001", guest_id: "g-09", hotel_id: "hotel-1", phone_number: "+1 555 000 0009", resolved_message_body: "Hi Zara! Enjoy a relaxing spa treatment today.", meta_message_id: "wamid-009", status: "delivered", failure_reason: null, sent_at: "2026-05-03T10:01:16Z", delivered_at: "2026-05-03T10:01:38Z", read_at: null, replied_at: null, conversation_id: null },
  { id: "msg-010", campaign_id: "camp-001", guest_id: "g-10", hotel_id: "hotel-1", phone_number: "+1 555 000 0010", resolved_message_body: "Hi Ethan! Enjoy a relaxing spa treatment today.", meta_message_id: "wamid-010", status: "delivered", failure_reason: null, sent_at: "2026-05-03T10:01:18Z", delivered_at: "2026-05-03T10:01:40Z", read_at: null, replied_at: null, conversation_id: null },
  { id: "msg-011", campaign_id: "camp-001", guest_id: "g-11", hotel_id: "hotel-1", phone_number: "+1 555 000 0011", resolved_message_body: "Hi Mia! Enjoy a relaxing spa treatment today.", meta_message_id: "wamid-011", status: "delivered", failure_reason: null, sent_at: "2026-05-03T10:01:20Z", delivered_at: "2026-05-03T10:01:42Z", read_at: null, replied_at: null, conversation_id: null },
  { id: "msg-012", campaign_id: "camp-001", guest_id: "g-12", hotel_id: "hotel-1", phone_number: "+1 555 000 0012", resolved_message_body: "Hi Kai! Enjoy a relaxing spa treatment today.", meta_message_id: "wamid-012", status: "delivered", failure_reason: null, sent_at: "2026-05-03T10:01:22Z", delivered_at: "2026-05-03T10:01:44Z", read_at: null, replied_at: null, conversation_id: null },
  { id: "msg-013", campaign_id: "camp-001", guest_id: "g-13", hotel_id: "hotel-1", phone_number: "+1 555 000 0013", resolved_message_body: "Hi Ava! Enjoy a relaxing spa treatment today.", meta_message_id: "wamid-013", status: "sent", failure_reason: null, sent_at: "2026-05-03T10:01:24Z", delivered_at: null, read_at: null, replied_at: null, conversation_id: null },
  { id: "msg-014", campaign_id: "camp-001", guest_id: "g-14", hotel_id: "hotel-1", phone_number: "+1 555 000 0014", resolved_message_body: "Hi Leo! Enjoy a relaxing spa treatment today.", meta_message_id: "wamid-014", status: "sent", failure_reason: null, sent_at: "2026-05-03T10:01:26Z", delivered_at: null, read_at: null, replied_at: null, conversation_id: null },
  { id: "msg-015", campaign_id: "camp-001", guest_id: "g-15", hotel_id: "hotel-1", phone_number: "+1 555 000 0015", resolved_message_body: "Hi Nadia! Enjoy a relaxing spa treatment today.", meta_message_id: "wamid-015", status: "sent", failure_reason: null, sent_at: "2026-05-03T10:01:28Z", delivered_at: null, read_at: null, replied_at: null, conversation_id: null },
  { id: "msg-016", campaign_id: "camp-001", guest_id: "g-16", hotel_id: "hotel-1", phone_number: "+1 555 000 0016", resolved_message_body: "Hi Ivan! Enjoy a relaxing spa treatment today.", meta_message_id: "wamid-016", status: "failed", failure_reason: "invalid_number", sent_at: "2026-05-03T10:01:30Z", delivered_at: null, read_at: null, replied_at: null, conversation_id: null },
  { id: "msg-017", campaign_id: "camp-001", guest_id: "g-17", hotel_id: "hotel-1", phone_number: "+1 555 000 0017", resolved_message_body: "Hi Yuki! Enjoy a relaxing spa treatment today.", meta_message_id: null, status: "failed", failure_reason: "opt_out", sent_at: null, delivered_at: null, read_at: null, replied_at: null, conversation_id: null },
  { id: "msg-018", campaign_id: "camp-001", guest_id: "g-18", hotel_id: "hotel-1", phone_number: "+1 555 000 0018", resolved_message_body: "Hi Priya! Enjoy a relaxing spa treatment today.", meta_message_id: null, status: "skipped", failure_reason: "no_opt_in", sent_at: null, delivered_at: null, read_at: null, replied_at: null, conversation_id: null },
  { id: "msg-019", campaign_id: "camp-001", guest_id: "g-19", hotel_id: "hotel-1", phone_number: "+1 555 000 0019", resolved_message_body: "Hi Ben! Enjoy a relaxing spa treatment today.", meta_message_id: null, status: "skipped", failure_reason: "no_opt_in", sent_at: null, delivered_at: null, read_at: null, replied_at: null, conversation_id: null },
  { id: "msg-020", campaign_id: "camp-001", guest_id: "g-20", hotel_id: "hotel-1", phone_number: "+1 555 000 0020", resolved_message_body: "Hi Lena! Enjoy a relaxing spa treatment today.", meta_message_id: "wamid-020", status: "queued", failure_reason: null, sent_at: null, delivered_at: null, read_at: null, replied_at: null, conversation_id: null },
];

const MOCK_DETAIL: CampaignDetail = {

  id: "camp-001",
  hotel_id: "hotel-1",
  name: "Weekend Spa Offer — May 2026",
  campaign_type: "in_stay_offer",
  template_id: "tmpl-002",
  variable_overrides: {},
  audience_filters: { check_in_from: "2026-05-01", check_in_to: "2026-05-31" },
  status: "completed",
  scheduled_at: null,
  sent_at: "2026-05-03T10:01:00Z",
  completed_at: "2026-05-03T10:05:22Z",
  created_by: "admin-1",
  recipient_count_targeted: 20,
  recipient_count_sent: 18,
  recipient_count_skipped: 2,
  created_at: "2026-05-02T14:30:00Z",
  messages: MOCK_MESSAGES,
  template: null,
};

async function getCampaignById(_id: string): Promise<CampaignDetail> {
  await new Promise((r) => setTimeout(r, 700));
  return MOCK_DETAIL;
}

async function cancelCampaign(_id: string): Promise<{ status: CampaignStatus }> {
  await new Promise((r) => setTimeout(r, 500));
  return { status: "cancelled" };
}
// ─────────────────────────────────────────────────────────────────────────────

// ─── Display constants ────────────────────────────────────────────────────────

const TYPE_LABELS: Record<CampaignType, string> = {
  pre_arrival_upsell: "Pre-Arrival Upsell",
  in_stay_offer: "In-Stay Offer",
  fnb_promotion: "F&B Promotion",
  late_checkout: "Late Checkout",
  post_stay_reengagement: "Post-Stay Re-engagement",
  seasonal_event: "Seasonal / Event",
};

const STATUS_STYLES: Record<CampaignStatus, string> = {
  draft: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  scheduled: "bg-blue-50  text-blue-700  ring-1 ring-blue-200",
  processing: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  completed: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  cancelled: "bg-slate-100 text-slate-400 ring-1 ring-slate-200",
  failed: "bg-red-50   text-red-700   ring-1 ring-red-200",
};

/** Status pill colors for individual message rows in the delivery report table. */
const MSG_STATUS_STYLES: Record<CampaignMessageStatus, string> = {
  queued: "bg-slate-100 text-slate-500",
  sent: "bg-blue-50   text-blue-600",
  delivered: "bg-sky-50    text-sky-700",
  read: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50    text-red-700",
  skipped: "bg-slate-100 text-slate-400",
};

type MessageFilter = "all" | CampaignMessageStatus;

const MESSAGE_FILTER_TABS: { key: MessageFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "delivered", label: "Delivered" },
  { key: "read", label: "Read" },
  { key: "sent", label: "Sent" },
  { key: "failed", label: "Failed" },
  { key: "skipped", label: "Skipped" },
];

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconArrowLeft({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * A single stat card in the delivery stats row.
 * accent overrides the default text color for the number when the stat is
 * meaningful (e.g. failed = red, read = green).
 */
function StatBadge({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="glass-card flex flex-col items-center rounded-xl px-4 py-3 text-center">
      <span className={`text-2xl font-bold tabular-nums ${accent ?? "text-slate-900"}`}>
        {value.toLocaleString()}
      </span>
      <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </span>
    </div>
  );
}

/** Page-level loading skeleton — avoids layout shift while the API responds. */
function LoadingSkeleton() {
  return (
    <main className="flex h-full flex-col overflow-hidden bg-slate-50/50 p-3 sm:p-4">
      <div className="glass-card mb-3 h-14 animate-pulse rounded-2xl bg-slate-100" />
      <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass-card h-16 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
      <div className="glass-card flex-1 animate-pulse rounded-2xl bg-slate-100" />
    </main>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msgFilter, setMsgFilter] = useState<MessageFilter>("all");
  const [cancelling, setCancelling] = useState(false);

  /* Admin-only guard */
  useEffect(() => {
    if (!getToken()) { router.replace("/login"); return; }
    if (getCurrentUser()?.role !== "ADMIN") { router.replace("/dashboard"); return; }
  }, []);

  useEffect(() => {
    if (!id) return;

    (async () => {
      setLoading(true);
      try {
        const data = await getCampaignById(id);
        setCampaign(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load campaign");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  /**
   * Cancels a scheduled campaign.
   * Uses a native confirm() dialog as a lightweight guard — the spec's
   * two-step confirmation requirement applies at launch, not at cancel.
   */
  async function handleCancel() {
    if (!campaign) return;
    if (!window.confirm("Cancel this scheduled campaign? This cannot be undone.")) return;
    setCancelling(true);
    try {
      const updated = await cancelCampaign(campaign.id);
      setCampaign((prev) => (prev ? { ...prev, status: updated.status } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel campaign");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) return <LoadingSkeleton />;

  if (error || !campaign) {
    return (
      <main className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <p className="text-sm font-semibold text-red-700">
            {error ?? "Campaign not found"}
          </p>
          <Link
            href="/dashboard/campaigns"
            className="mt-3 block text-xs text-slate-500 underline"
          >
            Back to Campaigns
          </Link>
        </div>
      </main>
    );
  }

  /* Derived delivery counts — computed from the message list rather than the
   * campaign-level counts so the detail view is always consistent with the table. */
  const deliveredCount = campaign.messages.filter(
    (m) => m.status === "delivered" || m.status === "read"
  ).length;
  const readCount = campaign.messages.filter((m) => m.status === "read").length;
  const failedCount = campaign.messages.filter((m) => m.status === "failed").length;

  const filteredMessages =
    msgFilter === "all"
      ? campaign.messages
      : campaign.messages.filter((m) => m.status === msgFilter);

  return (
    <main className="flex h-full flex-col overflow-hidden bg-slate-50/50 p-3 sm:p-4">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="glass-card mb-3 flex flex-shrink-0 flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Link
            href="/dashboard/campaigns"
            className="flex flex-shrink-0 items-center gap-1 text-xs font-medium text-slate-400 transition hover:text-slate-700"
          >
            <IconArrowLeft className="h-3.5 w-3.5" />
            Campaigns
          </Link>
          <span className="text-slate-300">/</span>
          <span className="truncate text-sm font-bold text-slate-900">{campaign.name}</span>
          <span
            className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_STYLES[campaign.status]}`}
          >
            {campaign.status}
          </span>
          <span className="flex-shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
            {TYPE_LABELS[campaign.campaign_type]}
          </span>
        </div>

        {/* Cancel is only meaningful for campaigns waiting to be sent. */}
        {campaign.status === "scheduled" && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelling}
            className="flex-shrink-0 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            {cancelling ? "Cancelling…" : "Cancel Campaign"}
          </button>
        )}
      </header>

      {/* Error banner for cancel failures */}
      {error && (
        <div className="mb-3 flex-shrink-0 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      {/* ── Stats row ───────────────────────────────────────────────────────── */}
      <div className="mb-3 grid flex-shrink-0 grid-cols-3 gap-2 sm:grid-cols-6">
        <StatBadge label="Targeted" value={campaign.recipient_count_targeted} />
        <StatBadge label="Sent" value={campaign.recipient_count_sent} accent="text-blue-600" />
        <StatBadge label="Delivered" value={deliveredCount} accent="text-sky-600" />
        <StatBadge
          label="Read"
          value={readCount}
          accent={readCount > 0 ? "text-emerald-600" : undefined}
        />
        <StatBadge
          label="Failed"
          value={failedCount}
          accent={failedCount > 0 ? "text-red-500" : undefined}
        />
        <StatBadge
          label="Skipped"
          value={campaign.recipient_count_skipped}
          accent={campaign.recipient_count_skipped > 0 ? "text-amber-600" : undefined}
        />
      </div>

      {/* ── Delivery report table ────────────────────────────────────────────── */}
      <div className="glass-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl">
        {/* Filter tabs */}
        <div className="flex flex-shrink-0 items-center gap-1 overflow-x-auto border-b border-slate-100 px-4 py-2">
          <span className="mr-2 flex-shrink-0 text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Filter
          </span>
          {MESSAGE_FILTER_TABS.map((f) => {
            const count =
              f.key === "all"
                ? campaign.messages.length
                : campaign.messages.filter((m) => m.status === f.key).length;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setMsgFilter(f.key)}
                className={`flex-shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${msgFilter === f.key
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:bg-slate-100"
                  }`}
              >
                {f.label}
                <span className="ml-1 opacity-60">({count})</span>
              </button>
            );
          })}
          <span className="ml-auto flex-shrink-0 text-[11px] text-slate-400">
            {filteredMessages.length.toLocaleString()} message
            {filteredMessages.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Message list */}
        <div className="light-scroll min-h-0 flex-1 overflow-y-auto">
          {filteredMessages.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-slate-400">
              No messages with this status.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white/80 backdrop-blur-sm">
                <tr className="border-b border-slate-100 text-left">
                  <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Phone
                  </th>
                  <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Status
                  </th>
                  <th className="hidden px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 sm:table-cell">
                    Sent
                  </th>
                  <th className="hidden px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 sm:table-cell">
                    Delivered
                  </th>
                  <th className="hidden px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 sm:table-cell">
                    Read
                  </th>
                  <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Reply
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredMessages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-slate-50/60">
                    {/* Phone number used at send time — may differ from the
                        current guest profile if they changed numbers. */}
                    <td className="px-4 py-3 text-xs font-medium text-slate-700">
                      {msg.phone_number}
                    </td>

                    {/* Delivery status + failure reason */}
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${MSG_STATUS_STYLES[msg.status]}`}
                      >
                        {msg.status}
                      </span>
                      {msg.failure_reason && (
                        <span className="ml-1.5 text-[10px] text-red-400">
                          {msg.failure_reason}
                        </span>
                      )}
                    </td>

                    {/* Timestamps — hidden on mobile to keep the table readable. */}
                    <td className="hidden px-4 py-3 text-[11px] text-slate-400 sm:table-cell">
                      {msg.sent_at
                        ? new Date(msg.sent_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-[11px] text-slate-400 sm:table-cell">
                      {msg.delivered_at
                        ? new Date(msg.delivered_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-[11px] text-slate-400 sm:table-cell">
                      {msg.read_at
                        ? new Date(msg.read_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : "—"}
                    </td>

                    {/* Reply link — routes to the inbox conversation if the guest replied. */}
                    <td className="px-4 py-3 text-[11px] text-slate-400">
                      {msg.replied_at ? (
                        msg.conversation_id ? (
                          <Link
                            href={`/dashboard?conversation=${msg.conversation_id}`}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            View
                          </Link>
                        ) : (
                          "Replied"
                        )
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Skipped count warning — spec requires alerting staff when >20% of audience was skipped. */}
        {campaign.status === "completed" &&
          campaign.recipient_count_targeted > 0 &&
          campaign.recipient_count_skipped / campaign.recipient_count_targeted > 0.2 && (
            <div className="flex-shrink-0 border-t border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-800">
              <strong>More than 20% of your audience was skipped</strong> due to missing opt-in
              records. Review opt-in collection at check-in to improve future campaign reach.
            </div>
          )}
      </div>
    </main>
  );
}
