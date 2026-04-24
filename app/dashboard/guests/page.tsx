"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getGuests, updateGuest } from "@/lib/api";
import { getCurrentUser, getToken } from "@/lib/auth";
import { GuestProfile } from "@/types";

const SOURCE_LABELS: Record<string, string> = {
  whatsapp_inbound: "WhatsApp",
  csv_import: "CSV Import",
  manual: "Manual",
};

const SOURCE_COLORS: Record<string, string> = {
  whatsapp_inbound: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  csv_import: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  manual: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length > 10) return `+${d.slice(0, d.length - 10)} ${d.slice(-10, -7)}-${d.slice(-7, -4)}-${d.slice(-4)}`;
  return phone;
}

function avatarChars(name: string | null, phone: string): string {
  if (name) {
    const parts = name.trim().split(" ");
    return parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }
  return phone.replace(/\D/g, "").slice(-4, -2) || "··";
}

// ─── Guest detail panel ───────────────────────────────────────────────────────

function GuestDetail({
  guest,
  isAdmin,
  onUpdated,
  onClose,
}: {
  guest: GuestProfile;
  isAdmin: boolean;
  onUpdated: (g: GuestProfile) => void;
  onClose: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(guest.name ?? "");
  const [email, setEmail] = useState(guest.email ?? "");
  const [notes, setNotes] = useState(guest.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateGuest(guest.id, { name, email, notes });
      onUpdated(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card flex h-full flex-col overflow-hidden rounded-2xl">
      {/* Panel header */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
            {avatarChars(guest.name, guest.whatsapp_number)}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{guest.name ?? "Unknown"}</p>
            <p className="text-xs text-slate-500">{formatPhone(guest.whatsapp_number)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Close guest panel"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="light-scroll flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Source + stats row */}
        <div className="flex flex-wrap gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${SOURCE_COLORS[guest.source] ?? SOURCE_COLORS.manual}`}>
            {SOURCE_LABELS[guest.source] ?? guest.source}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
            {guest.total_conversations} conversation{guest.total_conversations !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Editable fields */}
        {editing ? (
          <div className="space-y-3">
            <div>
              <label htmlFor="guest-name" className="ui-label">Name</label>
              <input id="guest-name" className="ui-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Guest name" />
            </div>
            <div>
              <label htmlFor="guest-email" className="ui-label">Email</label>
              <input id="guest-email" type="email" className="ui-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="guest@example.com" />
            </div>
            <div>
              <label htmlFor="guest-notes" className="ui-label">Notes</label>
              <textarea id="guest-notes" rows={3} className="ui-input resize-none" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes…" />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditing(false)} className="btn-secondary flex-1 py-1.5 text-xs">Cancel</button>
              <button type="button" onClick={() => void handleSave()} disabled={saving} className="btn-primary flex-1 py-1.5 text-xs disabled:opacity-60">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2 text-sm">
                {guest.email && (
                  <p className="text-slate-700"><span className="font-medium text-slate-500">Email:</span> {guest.email}</p>
                )}
                {guest.notes && (
                  <p className="text-slate-700 whitespace-pre-wrap"><span className="font-medium text-slate-500">Notes:</span> {guest.notes}</p>
                )}
                {!guest.email && !guest.notes && (
                  <p className="text-xs text-slate-400">No additional info</p>
                )}
              </div>
              {isAdmin && (
                <button type="button" onClick={() => setEditing(true)} className="btn-secondary px-3 py-1.5 text-xs">
                  Edit
                </button>
              )}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-xs text-slate-500 space-y-1">
          <p><span className="font-medium">First contact:</span> {formatDate(guest.first_contact_at)}</p>
          <p><span className="font-medium">Last contact:</span> {formatDate(guest.last_contact_at)}</p>
        </div>

        {/* Stay history */}
        {guest.stay_history?.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">Stay History</p>
            <div className="space-y-2">
              {guest.stay_history.map((stay, i) => (
                <div key={i} className="rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{stay.room_type}</span>
                    <span className="font-bold text-emerald-700">${stay.amount.toLocaleString()}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {formatDate(stay.check_in)} — {formatDate(stay.check_out)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function GuestsPage() {
  const router = useRouter();
  const isAdmin = getCurrentUser()?.role === "ADMIN";
  const [guests, setGuests] = useState<GuestProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<GuestProfile | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!getToken()) { router.replace("/login"); return; }
    load();
  }, []);

  const load = (q?: string) => {
    setLoading(true);
    setError(null);
    getGuests(q)
      .then(setGuests)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load guests"))
      .finally(() => setLoading(false));
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (value.length === 0) { load(); return; }
    if (value.length < 3) return;
    searchTimer.current = setTimeout(() => load(value), 350);
  };

  const handleUpdated = (updated: GuestProfile) => {
    setGuests((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    setSelected(updated);
  };

  return (
    <main className="flex h-full flex-col overflow-hidden bg-slate-50/50 p-3 sm:p-4">
      {/* Header */}
      <header className="glass-card mb-3 flex flex-shrink-0 items-center justify-between gap-3 rounded-2xl px-4 py-2.5 sm:h-12">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-tight text-slate-900">Guests</span>
          {!loading && (
            <span className="rounded-full bg-slate-100 px-2 py-px text-[10px] font-semibold text-slate-600">
              {guests.length}
            </span>
          )}
        </div>
        <div className="w-48 sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search name or number…"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </div>
      </header>

      {/* Body: list + detail */}
      <div className="flex min-h-0 flex-1 gap-3">
        {/* Guest list */}
        <div className={`glass-card flex flex-col overflow-hidden rounded-2xl ${selected ? "hidden md:flex md:w-[340px] md:flex-shrink-0" : "flex-1"}`}>
          {/* Column headers */}
          <div className="flex-shrink-0 border-b border-slate-200/70 bg-slate-50/60 px-4 py-2">
            <div className="grid grid-cols-[1fr_auto_auto] gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <span>Guest</span>
              <span>Source</span>
              <span>Conversations</span>
            </div>
          </div>

          <div className="light-scroll flex-1 overflow-y-auto">
            {loading && (
              <div className="space-y-px px-2 py-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg p-3">
                    <div className="skeleton-light h-9 w-9 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="skeleton-light h-3 w-32 rounded" />
                      <div className="skeleton-light h-2.5 w-24 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="mx-3 mt-2 rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-700">
                {error}
              </div>
            )}

            {!loading && !error && guests.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <p className="text-sm text-slate-500">No guests found</p>
                {search.length >= 3 && (
                  <button type="button" onClick={() => { setSearch(""); load(); }} className="text-xs text-blue-600 underline">
                    Clear search
                  </button>
                )}
              </div>
            )}

            <div className="space-y-px px-2 py-2">
              {guests.map((guest) => (
                <button
                  key={guest.id}
                  type="button"
                  onClick={() => setSelected(guest)}
                  className={`w-full rounded-lg p-3 text-left transition-all hover:bg-white/65 ${selected?.id === guest.id ? "bg-blue-600/10 ring-1 ring-blue-500/30" : ""}`}
                >
                  <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                        {avatarChars(guest.name, guest.whatsapp_number)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {guest.name ?? "Unknown"}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {formatPhone(guest.whatsapp_number)}
                        </p>
                      </div>
                    </div>
                    <span className={`rounded-full px-2 py-px text-[9px] font-semibold ${SOURCE_COLORS[guest.source] ?? SOURCE_COLORS.manual}`}>
                      {SOURCE_LABELS[guest.source] ?? guest.source}
                    </span>
                    <span className="text-center text-xs font-semibold text-slate-500">
                      {guest.total_conversations}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Guest detail panel */}
        {selected && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <GuestDetail
              guest={selected}
              isAdmin={isAdmin}
              onUpdated={handleUpdated}
              onClose={() => setSelected(null)}
            />
          </div>
        )}
      </div>
    </main>
  );
}
