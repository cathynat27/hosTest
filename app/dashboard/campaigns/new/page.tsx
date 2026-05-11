/**
 * New Campaign Wizard — /dashboard/campaigns/new
 *
 * A 5-stage creation flow that walks hotel staff through:
 *   1. Create   — internal name + campaign type (revenue intent)
 *   2. Audience — segment filters + live opted-in recipient count
 *   3. Template — pick a Meta-approved template + map variables
 *   4. Schedule — send immediately or at a future datetime
 *   5. Review   — summary + confirmation modal before launch
 *
 * Draft persistence strategy: after Stage 1 completes, a campaign record is
 * created in "draft" state via POST /api/campaigns. Every subsequent stage
 * calls PUT /api/campaigns/:id so that if staff exits mid-flow, the draft is
 * saved and resumable from the Campaigns list.
 *
 * Access gate: ADMIN role required.
 */
"use client";

export const dynamic = "force-dynamic";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  createCampaign,
  getAudiencePreview,
  getCampaignById,
  getTemplates,
  launchCampaign,
  updateCampaign,
} from "@/lib/api";
import { getCurrentUser, getToken } from "@/lib/auth";
import type {
  AudienceFilters,
  AudiencePreview,
  CampaignType,
  Template,
} from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const CAMPAIGN_TYPES: {
  value: CampaignType;
  label: string;
  description: string;
}[] = [
    {
      value: "pre_arrival_upsell",
      label: "Pre-Arrival Upsell",
      description: "Room upgrades, add-ons, and services before check-in",
    },
    {
      value: "in_stay_offer",
      label: "In-Stay Offer",
      description: "Spa, room upgrades, or in-room dining during the stay",
    },
    {
      value: "fnb_promotion",
      label: "F&B Promotion",
      description: "Restaurant, bar, or meal package offers",
    },
    {
      value: "late_checkout",
      label: "Late Checkout",
      description: "Extended stay and late departure upsell",
    },
    {
      value: "post_stay_reengagement",
      label: "Post-Stay Re-engagement",
      description: "Win back guests after they have checked out",
    },
    {
      value: "seasonal_event",
      label: "Seasonal / Event",
      description: "Holiday promotions or special event packages",
    },
  ];

/** Step definitions for the progress indicator. */
const STAGES = [
  { n: 1 as const, label: "Create" },
  { n: 2 as const, label: "Audience" },
  { n: 3 as const, label: "Template" },
  { n: 4 as const, label: "Schedule" },
  { n: 5 as const, label: "Review" },
];

type WizardStage = 1 | 2 | 3 | 4 | 5;

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconArrowLeft({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

function IconArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function IconSend({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
    </svg>
  );
}

// ─── Stage Progress Indicator ─────────────────────────────────────────────────

function StageProgress({ current }: { current: WizardStage }) {
  return (
    <div className="mb-8 flex items-center justify-center gap-0">
      {STAGES.map((s, i) => (
        <div key={s.n} className="flex items-center">
          {/* Step circle + label */}
          <div className="flex flex-col items-center gap-1">
            <div
              className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-[10px] sm:text-xs font-bold transition-all ${s.n < current
                ? "bg-emerald-500 text-white"
                : s.n === current
                  ? "bg-slate-900 text-white ring-4 ring-slate-900/10"
                  : "bg-slate-100 text-slate-400"
                }`}
            >
              {s.n < current ? <IconCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : s.n}
            </div>
            <span
              className={`text-[9px] sm:text-[10px] font-semibold ${s.n === current ? "text-slate-900" : "text-slate-400"
                }`}
            >
              {s.label}
            </span>
          </div>

          {/* Connector line between steps */}
          {i < STAGES.length - 1 && (
            <div
              className={`mx-1 sm:mx-2 mb-5 h-px w-6 sm:w-16 transition-all ${s.n < current ? "bg-emerald-400" : "bg-slate-200"
                }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Review Row (Stage 5) ─────────────────────────────────────────────────────

function ReviewRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-3.5">
      <span className="flex-shrink-0 text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span className={`text-right text-sm font-semibold ${accent ?? "text-slate-900"}`}>
        {value}
      </span>
    </div>
  );
}

// ─── Main Wizard Component ────────────────────────────────────────────────────

function NewCampaignPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  /* Admin-only guard */
  useEffect(() => {
    if (!getToken()) { router.replace("/login"); return; }
    if (getCurrentUser()?.role !== "ADMIN") { router.replace("/dashboard"); return; }
  }, []);

  // ── Wizard navigation ─────────────────────────────────────────────────────
  const [stage, setStage] = useState<WizardStage>(1);

  // ── Stage 1: Create ───────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [campaignType, setCampaignType] = useState<CampaignType | "">("");
  const [campaignId, setCampaignId] = useState<string | null>(null);



  // ── Stage 2: Audience ─────────────────────────────────────────────────────
  const [filters, setFilters] = useState<AudienceFilters>({});
  const [audiencePreview, setAudiencePreview] = useState<AudiencePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // ── Stage 3: Template ─────────────────────────────────────────────────────
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [variableOverrides, setVariableOverrides] = useState<Record<string, string>>({});

  // ── Stage 4: Schedule ─────────────────────────────────────────────────────
  const [sendImmediately, setSendImmediately] = useState(true);
  const [scheduledAt, setScheduledAt] = useState("");
  const [minScheduleTime] = useState(
    () => new Date(Date.now() + 5 * 60_000).toISOString().slice(0, 16)
  );

  // ── Shared ────────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Derived ───────────────────────────────────────────────────────────────
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) ?? null;
  const canAdvanceStage3 = selectedTemplateId !== "";
  const canAdvanceStage4 = sendImmediately || scheduledAt !== "";

  const refreshAudiencePreview = useCallback(async () => {
    setPreviewLoading(true);
    try {
      const preview = await getAudiencePreview(filters);
      setAudiencePreview(preview);
    } catch {
      /* Non-fatal */
    } finally {
      setPreviewLoading(false);
    }
  }, [filters]);
  //existing campaign
  useEffect(() => {
    if (!editId) return;
    getCampaignById(editId).then((c) => {
      setCampaignId(c.id);
      setName(c.name);
      setCampaignType(c.campaign_type);
      setFilters(c.audience_filters);
      setSelectedTemplateId(c.template_id ?? "");
      setVariableOverrides(c.variable_overrides);
      setSendImmediately(c.scheduled_at === null);
      setScheduledAt(c.scheduled_at ?? "");
    }).catch(() => { });
  }, [editId]);

  useEffect(() => {
    if (stage !== 3 || !campaignType) return;

    (async () => {
      setTemplatesLoading(true);
      try {
        const templates = await getTemplates(campaignType as CampaignType);
        setTemplates(templates);
      } catch {
        setTemplates([]);
      } finally {
        setTemplatesLoading(false);
      }
    })();
  }, [stage, campaignType]);

  // ── Stage advance handlers ────────────────────────────────────────────────

  async function advanceFromStage1() {
    if (!name.trim()) { setError("Campaign name is required"); return; }
    if (!campaignType) { setError("Campaign type is required"); return; }

    setSaving(true);
    setError(null);
    try {
      if (campaignId) {
        await updateCampaign(campaignId, {
          name: name.trim(),
          campaign_type: campaignType as CampaignType,
        });
      } else {
        const campaign = await createCampaign({
          name: name.trim(),
          campaign_type: campaignType as CampaignType,
        });
        setCampaignId(campaign.id);
      }
      setStage(2);
      setPreviewLoading(true);
      getAudiencePreview({})
        .then(setAudiencePreview)
        .catch(() => { })
        .finally(() => setPreviewLoading(false));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create campaign");
    } finally {
      setSaving(false);
    }
  }

  async function advanceFromStage2() {
    if (!campaignId) return;
    setSaving(true);
    setError(null);
    try {
      await updateCampaign(campaignId, { audience_filters: filters });
      setStage(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save audience filters");
    } finally {
      setSaving(false);
    }
  }

  async function advanceFromStage3() {
    if (!campaignId || !selectedTemplateId) return;
    setSaving(true);
    setError(null);
    try {
      await updateCampaign(campaignId, {
        template_id: selectedTemplateId,
        variable_overrides: variableOverrides,
      });
      setStage(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save template selection");
    } finally {
      setSaving(false);
    }
  }

  async function advanceFromStage4() {
    if (!campaignId || !canAdvanceStage4) return;
    setSaving(true);
    setError(null);
    try {
      await updateCampaign(campaignId, {
        scheduled_at: sendImmediately ? null : scheduledAt,
      });
      setStage(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save schedule");
    } finally {
      setSaving(false);
    }
  }

  async function handleLaunch() {
    if (!campaignId) return;
    setSaving(true);
    setError(null);
    try {
      await launchCampaign(campaignId, {
        send_immediately: sendImmediately,
        scheduled_at: sendImmediately ? undefined : scheduledAt,
      });
      router.replace(`/dashboard/campaigns/${campaignId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to launch campaign");
      setShowConfirm(false);
    } finally {
      setSaving(false);
    }
  }

  function handleContinue() {
    if (stage === 1) advanceFromStage1();
    else if (stage === 2) advanceFromStage2();
    else if (stage === 3) advanceFromStage3();
    else if (stage === 4) advanceFromStage4();
  }

  const continueDisabled =
    saving ||
    (stage === 3 && !canAdvanceStage3) ||
    (stage === 4 && !canAdvanceStage4);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="flex h-full flex-col overflow-hidden bg-slate-50/50">
      {/* ── Sticky breadcrumb bar ────────────────────────────────────────────── */}
      <div className="glass-card m-3 mb-0 flex flex-shrink-0 items-center gap-2 rounded-2xl px-4 py-3">
        <Link
          href="/dashboard/campaigns"
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-slate-800"
        >
          <IconArrowLeft className="h-3.5 w-3.5" />
          Campaigns
        </Link>
        <span className="text-slate-300">·</span>
        <span className="text-xs font-semibold text-slate-800">
          {editId ? "Edit Draft" : "New Campaign"}
        </span>
      </div>

      {/* ── Scrollable wizard body ───────────────────────────────────────────── */}
      <div className="light-scroll min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <StageProgress current={stage} />

        {/* Error banner */}
        {error && (
          <div className="mx-auto mb-6 max-w-xl rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}

        {/* ── Stage 1: Create ─────────────────────────────────────────────── */}
        {stage === 1 && (
          <div className="mx-auto max-w-xl">
            <h2 className="mb-1 text-lg font-bold text-slate-900">Name your campaign</h2>
            <p className="mb-6 text-sm text-slate-500">
              Give this campaign an internal label and choose the revenue outcome it is designed to drive.
              The campaign type determines which Meta-approved templates are available.
            </p>

            <label className="ui-label">Campaign Name</label>
            <input
              className="ui-input mb-6"
              placeholder="e.g. Weekend Spa Offer — May 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              autoFocus
              required
            />

            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
              Campaign Type
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {CAMPAIGN_TYPES.map((ct) => {
                const isSelected = campaignType === ct.value;
                return (
                  <button
                    key={ct.value}
                    type="button"
                    onClick={() => setCampaignType(ct.value)}
                    className={`rounded-xl border-2 p-4 text-left transition ${isSelected
                      ? "border-slate-900 bg-slate-900"
                      : "border-slate-200 bg-white hover:border-slate-400"
                      }`}
                  >
                    <p className={`text-sm font-semibold ${isSelected ? "text-white" : "text-slate-900"}`}>
                      {ct.label}
                    </p>
                    <p className={`mt-0.5 text-xs ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                      {ct.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Stage 2: Audience ─────────────────────────────────────────────── */}
        {stage === 2 && (
          <div className="mx-auto max-w-xl">
            <h2 className="mb-1 text-lg font-bold text-slate-900">Select your audience</h2>
            <p className="mb-6 text-sm text-slate-500">
              Filter guests by stay details. The opt-in check (
              <code className="rounded bg-slate-100 px-1 text-[11px]">opt_in_status = active</code>) is
              always enforced automatically — you cannot override it.
            </p>

            <div className="mb-6 rounded-xl bg-slate-900 px-4 py-3 text-white">
              {previewLoading ? (
                <p className="text-sm font-medium opacity-70">Calculating audience…</p>
              ) : audiencePreview ? (
                <>
                  <p className="text-sm font-semibold">
                    {audiencePreview.total_matched.toLocaleString()} guests match your filters.{" "}
                    <span className="text-emerald-400">
                      {audiencePreview.opted_in_count.toLocaleString()} are opted in
                    </span>{" "}
                    and eligible to receive this campaign.
                  </p>
                  {audiencePreview.opted_in_count === 0 && (
                    <p className="mt-1.5 text-xs text-red-300">
                      No eligible recipients. Adjust your filters or collect more WhatsApp opt-ins at
                      check-in before sending.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm font-medium opacity-70">
                  Apply filters below to preview the eligible audience.
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="ui-label">Check-In From</label>
                  <input
                    type="date"
                    className="ui-input"
                    value={filters.check_in_from ?? ""}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, check_in_from: e.target.value || undefined }))
                    }
                    onBlur={refreshAudiencePreview}
                  />
                </div>
                <div>
                  <label className="ui-label">Check-In To</label>
                  <input
                    type="date"
                    className="ui-input"
                    value={filters.check_in_to ?? ""}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, check_in_to: e.target.value || undefined }))
                    }
                    onBlur={refreshAudiencePreview}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="ui-label">Check-Out From</label>
                  <input
                    type="date"
                    className="ui-input"
                    value={filters.check_out_from ?? ""}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, check_out_from: e.target.value || undefined }))
                    }
                    onBlur={refreshAudiencePreview}
                  />
                </div>
                <div>
                  <label className="ui-label">Check-Out To</label>
                  <input
                    type="date"
                    className="ui-input"
                    value={filters.check_out_to ?? ""}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, check_out_to: e.target.value || undefined }))
                    }
                    onBlur={refreshAudiencePreview}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="ui-label">Min Stay (nights)</label>
                  <input
                    type="number"
                    min={1}
                    className="ui-input"
                    placeholder="Any"
                    value={filters.min_stay_nights ?? ""}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        min_stay_nights: e.target.value ? Number(e.target.value) : undefined,
                      }))
                    }
                    onBlur={refreshAudiencePreview}
                  />
                </div>
                <div>
                  <label className="ui-label">Room Type</label>
                  <input
                    className="ui-input"
                    placeholder="Any (e.g. Suites)"
                    value={filters.room_type ?? ""}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, room_type: e.target.value || undefined }))
                    }
                    onBlur={refreshAudiencePreview}
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={!!filters.repeat_guest}
                  onChange={() => {
                    setFilters((f) => ({ ...f, repeat_guest: f.repeat_guest ? undefined : true }));
                    setTimeout(refreshAudiencePreview, 0);
                  }}
                />
                <div
                  aria-hidden="true"
                  className={`flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-all ${filters.repeat_guest ? "bg-slate-900" : "bg-slate-200"
                    }`}
                >
                  <div
                    className={`h-4 w-4 rounded-full bg-white shadow transition-all ${filters.repeat_guest ? "translate-x-[18px]" : "translate-x-px"
                      }`}
                  />
                </div>
                <span className="text-sm text-slate-700">Repeat guests only</span>
              </label>
            </div>

            <p className="mt-4 text-xs text-slate-400">
              Leaving all filters empty targets every opted-in guest in the hotels database.
              The system re-verifies opt-in status at send time, not just at this stage.
            </p>
          </div>
        )}

        {/* ── Stage 3: Template ─────────────────────────────────────────────── */}
        {stage === 3 && (
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-1 text-lg font-bold text-slate-900">Choose a template</h2>
            <p className="mb-6 text-sm text-slate-500">
              Only templates matching your campaign type are
              shown to prevent transactional templates being used for promotional sends.
            </p>

            {templatesLoading ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="glass-card rounded-2xl p-4">
                    <div className="skeleton-light mb-2 h-4 w-40 rounded" />
                    <div className="skeleton-light mb-1 h-3 w-full rounded" />
                    <div className="skeleton-light h-3 w-3/4 rounded" />
                  </div>
                ))}
              </div>
            ) : templates.length === 0 ? (
              <div className="rounded-xl bg-amber-50 px-4 py-4 text-sm text-amber-800 ring-1 ring-amber-200">
                No approved templates for this campaign type. Create a template in Meta Business
                Manager and use the Sync Templates button to pull it into Hoscover.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {templates.map((t) => {
                  const isApproved = t.status === "approved";
                  const isSelected = selectedTemplateId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      disabled={!isApproved}
                      onClick={() => {
                        setSelectedTemplateId(t.id);
                        setVariableOverrides({});
                      }}
                      className={`rounded-2xl border-2 p-4 text-left transition ${!isApproved
                        ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-60"
                        : isSelected
                          ? "border-slate-900 bg-slate-900"
                          : "border-slate-200 bg-white hover:border-slate-400"
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold ${isSelected ? "text-white" : "text-slate-900"}`}>
                          {t.meta_template_name}
                        </p>
                        <span
                          className={`flex-shrink-0 rounded-full px-2 py-px text-[9px] font-semibold uppercase ring-1 ${t.status === "approved"
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            : t.status === "pending"
                              ? "bg-amber-50 text-amber-700 ring-amber-200"
                              : "bg-red-50 text-red-700 ring-red-200"
                            }`}
                        >
                          {t.status}
                        </span>
                      </div>

                      <p className={`mt-2 text-xs leading-relaxed ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                        {t.body_text.slice(0, 120)}
                        {t.body_text.length > 120 ? "…" : ""}
                      </p>

                      {t.variable_definitions.length > 0 && (
                        <p className={`mt-2 text-[11px] ${isSelected ? "text-slate-400" : "text-slate-400"}`}>
                          Variables:{" "}
                          {t.variable_definitions.map((v) => `{{${v.key}}}`).join(", ")}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedTemplate && selectedTemplate.variable_definitions.length > 0 && (
              <div className="mt-6">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                  Variable Mapping
                </p>
                <p className="mb-4 text-xs text-slate-400">
                  Each variable is auto-filled from the guest profile. Enter a static value in the
                  override field to send the same text to all recipients regardless of guest data.
                </p>
                <div className="space-y-3">
                  {selectedTemplate.variable_definitions.map((v) => (
                    <div key={v.key} className="flex flex-wrap items-center gap-3">
                      <code className="flex-shrink-0 rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                        {`{{${v.key}}}`}
                      </code>
                      <span className="flex-shrink-0 text-xs text-slate-400">
                        Auto:{" "}
                        <span className="font-medium text-slate-600">{v.source}</span>
                      </span>
                      <input
                        className="ui-input min-w-0 flex-1 text-xs"
                        placeholder="Static override (optional)"
                        value={variableOverrides[v.key] ?? ""}
                        onChange={(e) =>
                          setVariableOverrides((prev) => ({
                            ...prev,
                            [v.key]: e.target.value,
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Stage 4: Schedule ─────────────────────────────────────────────── */}
        {stage === 4 && (
          <div className="mx-auto max-w-md">
            <h2 className="mb-1 text-lg font-bold text-slate-900">Schedule your send</h2>
            <p className="mb-6 text-sm text-slate-500">
              Choose when to deliver the campaign. Scheduled sends can be cancelled up to 5 minutes
              before the scheduled time.
            </p>

            <div className="space-y-3">
              <label
                className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition ${sendImmediately
                  ? "border-slate-900 bg-slate-900"
                  : "border-slate-200 bg-white"
                  }`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  checked={sendImmediately}
                  onChange={() => setSendImmediately(true)}
                />
                <div
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${sendImmediately ? "border-white bg-white" : "border-slate-300 bg-white"
                    }`}
                >
                  {sendImmediately && (
                    <div className="h-2.5 w-2.5 rounded-full bg-slate-900" />
                  )}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${sendImmediately ? "text-white" : "text-slate-900"}`}>
                    Send Immediately
                  </p>
                  <p className={`text-xs ${sendImmediately ? "text-slate-300" : "text-slate-400"}`}>
                    Campaign is queued for delivery within 60 seconds of launch
                  </p>
                </div>
              </label>

              <label
                className={`flex cursor-pointer flex-col gap-3 rounded-xl border-2 p-4 transition ${!sendImmediately ? "border-slate-900 bg-white" : "border-slate-200 bg-white"
                  }`}
              >
                <div className="flex items-center gap-4">
                  <input
                    type="radio"
                    className="sr-only"
                    checked={!sendImmediately}
                    onChange={() => setSendImmediately(false)}
                  />
                  <div
                    className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${!sendImmediately
                      ? "border-slate-900 bg-slate-900"
                      : "border-slate-300 bg-white"
                      }`}
                  >
                    {!sendImmediately && (
                      <div className="h-2.5 w-2.5 rounded-full bg-white" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Schedule for Later</p>
                    <p className="text-xs text-slate-400">
                      Pick a date and time in your hotel&apos;s local timezone
                    </p>
                  </div>
                </div>

                {!sendImmediately && (
                  <input
                    type="datetime-local"
                    className="ui-input"
                    value={scheduledAt}
                    min={minScheduleTime}
                    onChange={(e) => setScheduledAt(e.target.value)}
                  />
                )}
              </label>
            </div>
          </div>
        )}

        {/* ── Stage 5: Review & Confirm ─────────────────────────────────────── */}
        {stage === 5 && (
          <div className="mx-auto max-w-xl">
            <h2 className="mb-1 text-lg font-bold text-slate-900">Review & Launch</h2>
            <p className="mb-6 text-sm text-slate-500">
              Check every detail before launching. Once confirmed, the campaign cannot be edited.
            </p>

            <div className="glass-card divide-y divide-slate-100 overflow-hidden rounded-2xl">
              <ReviewRow label="Campaign" value={name} />
              <ReviewRow
                label="Type"
                value={CAMPAIGN_TYPES.find((c) => c.value === campaignType)?.label ?? ""}
              />
              <ReviewRow
                label="Eligible Recipients"
                value={
                  audiencePreview
                    ? `${audiencePreview.opted_in_count.toLocaleString()} opted-in guests`
                    : "—"
                }
                accent={
                  audiencePreview?.opted_in_count === 0 ? "text-red-600" : "text-emerald-700"
                }
              />
              <ReviewRow label="Template" value={selectedTemplate?.meta_template_name ?? "—"} />
              <ReviewRow
                label="Send Time"
                value={
                  sendImmediately
                    ? "Immediately after launch"
                    : scheduledAt
                      ? new Date(scheduledAt).toLocaleString()
                      : "—"
                }
              />
            </div>

            {selectedTemplate && (
              <div className="mt-4">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Message Preview (example guest)
                </p>
                <div className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-100">
                  <p className="text-sm leading-relaxed text-slate-700">
                    {selectedTemplate.body_text
                      .replace(/\{\{guest_name\}\}/g, variableOverrides["guest_name"] ?? "James")
                      .replace(/\{\{room_type\}\}/g, variableOverrides["room_type"] ?? "Deluxe Suite")
                      .replace(/\{\{offer_amount\}\}/g, variableOverrides["offer_amount"] ?? "20%")
                      .replace(/\{\{checkout_date\}\}/g, variableOverrides["checkout_date"] ?? "tomorrow")
                      .replace(/\{\{([^}]+)\}\}/g, (_, key) => variableOverrides[key] ?? `[${key}]`)}
                  </p>
                </div>
              </div>
            )}

            {audiencePreview?.opted_in_count === 0 && (
              <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
                No opted-in guests match your audience filters. Go back to Stage 2 and adjust your
                segment before launching.
              </div>
            )}
          </div>
        )}

        {/* ── Navigation buttons ─────────────────────────────────────────────── */}
        <div className="mx-auto mt-8 flex max-w-xl items-center justify-between gap-3">
          {stage > 1 ? (
            <button
              type="button"
              onClick={() => setStage((s) => (s - 1) as WizardStage)}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:opacity-50"
            >
              <IconArrowLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {stage < 5 ? (
            <button
              type="button"
              disabled={continueDisabled}
              onClick={handleContinue}
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : "Continue"}
              {!saving && <IconArrowRight className="h-4 w-4" />}
            </button>
          ) : (
            <button
              type="button"
              disabled={saving || audiencePreview?.opted_in_count === 0}
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <IconSend className="h-4 w-4" />
              Launch Campaign
            </button>
          )}
        </div>
      </div>

      {/* ── Confirmation modal ───────────────────────────────────────────────── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="glass-card animate-scale-in mx-4 max-w-sm rounded-3xl p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
              <IconSend className="h-6 w-6 text-emerald-600" />
            </div>

            <h3 className="mt-4 text-base font-bold text-slate-900">Launch campaign?</h3>
            <p className="mt-2 text-sm text-slate-500">
              You are about to send{" "}
              <span className="font-semibold text-slate-900">
                {audiencePreview?.opted_in_count.toLocaleString() ?? "…"} WhatsApp messages
              </span>
              . This cannot be undone.
            </p>

            {error && (
              <p className="mt-3 text-xs text-red-600">{error}</p>
            )}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={saving}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleLaunch}
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? "Launching…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function NewCampaignPage() {
  return (
    <Suspense>
      <NewCampaignPageInner />
    </Suspense>
  );
}