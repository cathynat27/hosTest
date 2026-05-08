"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createAutomation, deleteAutomation, getAutomations, toggleAutomation, updateAutomation } from "@/lib/api";
import { getCurrentUser, getToken } from "@/lib/auth";
import { Automation, AutomationTriggerType, CreateAutomationRequest } from "@/types";

// ─── Default rules from spec section 7 ───────────────────────────────────────

const DEFAULT_RULES: Omit<CreateAutomationRequest, "is_active">[] = [
  {
    name: "Welcome / First Contact",
    trigger_type: "first_message",
    response_message:
      "Hi {{guest_name}}! 👋 Welcome to {{hotel_name}}.\nWe'll be with you shortly. Feel free to ask us anything about availability, rates, or your stay.",
    delay_seconds: 0,
    follow_up_message:
      "Just checking in — our team will respond very shortly.\nIf you're looking to book, we have rooms available this week. Would you like to know more?",
    follow_up_delay_seconds: 600,
  },
  {
    name: "Price Inquiry Detection",
    trigger_type: "keyword",
    trigger_value: "price",
    response_message:
      "Thanks for asking, {{guest_name}}! 👋\nHere's a quick overview of our room types and rates:\n• Standard Room — [PRICE]/night\n• Deluxe Room — [PRICE]/night\n• Suite — [PRICE]/night\nAll rates include [INCLUSIONS].\nWhich dates are you looking at? I'll check availability right now.",
    delay_seconds: 0,
    follow_up_message: "Still thinking it over? Let us know your dates and we'll hold a room for you 👋",
    follow_up_delay_seconds: 1800,
  },
  {
    name: "After-Hours Message",
    trigger_type: "after_hours",
    response_message:
      "Hi {{guest_name}}, thank you for reaching out to {{hotel_name}}!\nOur team is currently offline but will respond first thing when we open at [OPENING_TIME].\nIf urgent, please call us at [PHONE_NUMBER].\nWe look forward to hearing from you! 👋",
    delay_seconds: 0,
  },
  {
    name: "Booking Confirmation Acknowledgement",
    trigger_type: "keyword",
    trigger_value: "confirm",
    response_message:
      "Wonderful! We're excited to host you, {{guest_name}}. 👋\nOur team will confirm your reservation details shortly.\nIs there anything special we can prepare for your arrival?\n(e.g. early check-in, dietary needs, special occasion)",
    delay_seconds: 0,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TRIGGER_LABELS: Record<AutomationTriggerType, string> = {
  keyword: "Keyword",
  first_message: "First Message",
  after_hours: "After Hours",
};

const TRIGGER_COLORS: Record<AutomationTriggerType, string> = {
  keyword: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  first_message: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  after_hours: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Empty form state ─────────────────────────────────────────────────────────

function emptyForm(): CreateAutomationRequest {
  return {
    name: "",
    trigger_type: "keyword",
    trigger_value: "",
    response_message: "",
    delay_seconds: 0,
    follow_up_message: "",
    follow_up_delay_seconds: undefined,
    is_active: true,
  };
}

// ─── Rule form modal ─────────────────────────────────────────────────────────

type RuleFormProps = {
  initial: CreateAutomationRequest;
  onSave: (data: CreateAutomationRequest) => Promise<void>;
  onClose: () => void;
  saving: boolean;
  error: string | null;
};

function RuleFormModal({ initial, onSave, onClose, saving, error }: RuleFormProps) {
  const [form, setForm] = useState<CreateAutomationRequest>(initial);

  const set = <K extends keyof CreateAutomationRequest>(key: K, value: CreateAutomationRequest[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="glass-card animate-scale-in w-full max-w-lg rounded-2xl p-6">
        <h3 className="text-base font-bold text-slate-900">
          {initial.name ? "Edit Rule" : "New Automation Rule"}
        </h3>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="rule-name" className="ui-label">Rule Name</label>
            <input
              id="rule-name"
              className="ui-input"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Welcome Message"
              required
            />
          </div>

          {/* Trigger type */}
          <div>
            <label htmlFor="trigger-type" className="ui-label">Trigger Type</label>
            <select
              id="trigger-type"
              className="ui-input"
              value={form.trigger_type}
              onChange={(e) => set("trigger_type", e.target.value as AutomationTriggerType)}
            >
              <option value="keyword">Keyword — inbound message contains text</option>
              <option value="first_message">First Message — guest&apos;s first ever message</option>
              <option value="after_hours">After Hours — outside business hours</option>
            </select>
          </div>

          {/* Keyword value (only when keyword trigger) */}
          {form.trigger_type === "keyword" && (
            <div>
              <label htmlFor="trigger-value" className="ui-label">Keyword(s)</label>
              <input
                id="trigger-value"
                className="ui-input"
                value={form.trigger_value ?? ""}
                onChange={(e) => set("trigger_value", e.target.value)}
                placeholder="e.g. price, rate, cost"
                required
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Case-insensitive, partial match. Separate multiple keywords with commas.
              </p>
            </div>
          )}

          {/* Response message */}
          <div>
            <label htmlFor="response-msg" className="ui-label">Response Message</label>
            <textarea
              id="response-msg"
              rows={4}
              className="ui-input resize-none"
              value={form.response_message}
              onChange={(e) => set("response_message", e.target.value)}
              placeholder="Use {{guest_name}} and {{hotel_name}} as variables"
              required
            />
          </div>

          {/* Delay */}
          <div>
            <label htmlFor="delay" className="ui-label">Send Delay (seconds)</label>
            <input
              id="delay"
              type="number"
              min={0}
              className="ui-input"
              value={form.delay_seconds ?? 0}
              onChange={(e) => set("delay_seconds", parseInt(e.target.value) || 0)}
            />
          </div>

          {/* Follow-up message */}
          <div>
            <label htmlFor="followup-msg" className="ui-label">Follow-up Message <span className="font-normal text-slate-400">(optional)</span></label>
            <textarea
              id="followup-msg"
              rows={3}
              className="ui-input resize-none"
              value={form.follow_up_message ?? ""}
              onChange={(e) => set("follow_up_message", e.target.value || undefined)}
              placeholder="Sent if no reply after the follow-up delay"
            />
          </div>

          {form.follow_up_message && (
            <div>
              <label htmlFor="followup-delay" className="ui-label">Follow-up Delay (seconds)</label>
              <input
                id="followup-delay"
                type="number"
                min={60}
                className="ui-input"
                value={form.follow_up_delay_seconds ?? 600}
                onChange={(e) => set("follow_up_delay_seconds", parseInt(e.target.value) || 600)}
              />
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2 text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 py-2 text-sm disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Rule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AutomationsPage() {
  const router = useRouter();
  const [rules, setRules] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Automation | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) { router.replace("/login"); return; }
    if (getCurrentUser()?.role !== "ADMIN") { router.replace("/dashboard"); return; }
    loadRules();
  }, []);

  const loadRules = () => {
    setLoading(true);
    setError(null);
    getAutomations()
      .then(setRules)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load automations"))
      .finally(() => setLoading(false));
  };

  const handleToggle = async (id: string) => {
    setTogglingId(id);
    try {
      const updated = await toggleAutomation(id);
      setRules((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle rule");
    } finally {
      setTogglingId(null);
    }
  };

  const handleSave = async (data: CreateAutomationRequest) => {
    setSaving(true);
    setFormError(null);
    try {
      if (editTarget) {
        const updated = await updateAutomation(editTarget.id, data);
        setRules((prev) => prev.map((r) => (r.id === editTarget.id ? updated : r)));
        setEditTarget(null);
      } else {
        const created = await createAutomation({ ...data, is_active: false });
        setRules((prev) => [...prev, created]);
        setShowCreate(false);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save rule");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteAutomation(id);
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete rule");
    } finally {
      setDeletingId(null);
      setShowDeleteConfirm(null);
    }
  };

  const handleSeedDefaults = async () => {
    setSaving(true);
    try {
      const created = await Promise.all(
        DEFAULT_RULES.map((rule) => createAutomation({ ...rule, is_active: false }))
      );
      setRules((prev) => [...prev, ...created]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to seed default rules");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="flex h-full flex-col overflow-hidden bg-slate-50/50 p-3 sm:p-4">
      {/* Header */}
      <header className="glass-card mb-3 flex flex-shrink-0 items-center justify-between gap-3 rounded-2xl px-4 py-2.5 sm:h-12">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-tight text-slate-900">Automations</span>
          <span className="rounded-full bg-blue-600/10 px-2 py-px text-[10px] font-semibold text-blue-700">
            Admin
          </span>
          {!loading && (
            <span className="rounded-full bg-slate-100 px-2 py-px text-[10px] font-semibold text-slate-600">
              {rules.length} rules
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {rules.length === 0 && !loading && (
            <button
              type="button"
              onClick={() => void handleSeedDefaults()}
              disabled={saving}
              className="btn-secondary px-3 py-1.5 text-xs"
            >
              Load Defaults
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="btn-primary px-3 py-1.5 text-xs"
          >
            + New Rule
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="light-scroll min-h-0 flex-1 overflow-y-auto">
        {error && (
          <div className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}

        {loading && (
          <div className="glass-card overflow-hidden rounded-2xl">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b border-slate-100 px-5 py-4">
                <div className="skeleton-light h-4 w-40 rounded" />
                <div className="skeleton-light h-5 w-24 rounded-full" />
                <div className="ml-auto skeleton-light h-5 w-12 rounded-full" />
              </div>
            ))}
          </div>
        )}

        {!loading && rules.length === 0 && (
          <div className="glass-card flex flex-col items-center justify-center gap-3 rounded-2xl py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
              <svg className="h-6 w-6 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.268a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-slate-700">No automation rules yet</p>
              <p className="mt-1 text-sm text-slate-500">
                Load the 4 default rules from the spec or create your own.
              </p>
            </div>
          </div>
        )}

        {!loading && rules.length > 0 && (
          <div className="glass-card overflow-hidden rounded-2xl">
            {/* Desktop-only table header */}
            <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 border-b border-slate-200 bg-slate-50/60 px-5 py-2.5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Name</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Trigger</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Status</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Modified</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Actions</span>
            </div>

            {rules.map((rule, idx) => (
              <div
                key={rule.id}
                className={idx < rules.length - 1 ? "border-b border-slate-100" : ""}
              >
                {/* ── Mobile card layout ────────────────────────────────────── */}
                <div className="md:hidden px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{rule.name}</p>
                      {rule.trigger_value && (
                        <p className="mt-0.5 truncate text-[11px] text-slate-400">
                          keyword: &quot;{rule.trigger_value}&quot;
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleToggle(rule.id)}
                      disabled={togglingId === rule.id}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                        rule.is_active ? "bg-emerald-500" : "bg-slate-200"
                      }`}
                      role="switch"
                      aria-checked={rule.is_active}
                      aria-label={`Toggle ${rule.name}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                          rule.is_active ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${TRIGGER_COLORS[rule.trigger_type]}`}>
                        {TRIGGER_LABELS[rule.trigger_type]}
                      </span>
                      <span className="text-[11px] text-slate-400">{relativeTime(rule.updated_at)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditTarget(rule)}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                      >
                        Edit
                      </button>
                      {showDeleteConfirm === rule.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(null)}
                            className="rounded-lg px-2 py-1.5 text-xs text-slate-400 hover:bg-slate-100"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(rule.id)}
                            disabled={deletingId === rule.id}
                            className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                          >
                            {deletingId === rule.id ? "…" : "Delete"}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(rule.id)}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Desktop table row ─────────────────────────────────────── */}
                <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{rule.name}</p>
                    {rule.trigger_value && (
                      <p className="mt-0.5 truncate text-[11px] text-slate-400">
                        keyword: &quot;{rule.trigger_value}&quot;
                      </p>
                    )}
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${TRIGGER_COLORS[rule.trigger_type]}`}>
                    {TRIGGER_LABELS[rule.trigger_type]}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleToggle(rule.id)}
                    disabled={togglingId === rule.id}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                      rule.is_active ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                    role="switch"
                    aria-checked={rule.is_active}
                    aria-label={`Toggle ${rule.name}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                        rule.is_active ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span className="whitespace-nowrap text-[11px] text-slate-400">
                    {relativeTime(rule.updated_at)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditTarget(rule)}
                      className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                    >
                      Edit
                    </button>
                    {showDeleteConfirm === rule.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(null)}
                          className="rounded-lg px-2 py-1.5 text-xs text-slate-400 hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(rule.id)}
                          disabled={deletingId === rule.id}
                          className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                        >
                          {deletingId === rule.id ? "…" : "Delete"}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(rule.id)}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-4 text-xs text-slate-400">
          Only one rule fires per inbound message. Priority order: First Message → After Hours → Keyword.
        </p>
      </div>

      {/* Create modal */}
      {showCreate && (
        <RuleFormModal
          initial={emptyForm()}
          onSave={handleSave}
          onClose={() => { setShowCreate(false); setFormError(null); }}
          saving={saving}
          error={formError}
        />
      )}

      {/* Edit modal */}
      {editTarget && (
        <RuleFormModal
          initial={{
            name: editTarget.name,
            trigger_type: editTarget.trigger_type,
            trigger_value: editTarget.trigger_value ?? "",
            response_message: editTarget.response_message,
            delay_seconds: editTarget.delay_seconds,
            follow_up_message: editTarget.follow_up_message ?? "",
            follow_up_delay_seconds: editTarget.follow_up_delay_seconds ?? undefined,
            is_active: editTarget.is_active,
          }}
          onSave={handleSave}
          onClose={() => { setEditTarget(null); setFormError(null); }}
          saving={saving}
          error={formError}
        />
      )}
    </main>
  );
}
