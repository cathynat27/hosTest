"use client";

import { Fragment, FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getConversationById,
  getConversations,
  replyToConversation,
  resolveConversation,
  takeoverConversation,
} from "@/lib/api";
import { AuthTokenError, clearAuthSession, getCurrentUser, getToken, handleAuthFailure } from "@/lib/auth";
import { disconnectSocket, getSocket, isSocketAuthError } from "@/lib/socket";
import {
  Conversation,
  ConversationDetail,
  ConversationStatus,
  ConversationUpdatedPayload,
  EscalationAlertPayload,
  Message,
} from "@/types";
import AdminInvitePanel from "./admin-invite-panel";

// ─── Sorting ────────────────────────────────────────────────────────────────

const STATUS_ORDER: Record<ConversationStatus, number> = {
  ESCALATED: 0,
  HUMAN_ACTIVE: 1,
  ACTIVE_AI: 2,
  RESOLVED: 3,
};

function sortConversations(list: Conversation[]): Conversation[] {
  return [...list].sort((a, b) => {
    const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (byStatus !== 0) return byStatus;
    return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
  });
}

// ─── Formatting helpers ──────────────────────────────────────────────────────

function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length < 10) return phone;
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return `+${d.slice(0, d.length - 10)} ${d.slice(-10, -7)}-${d.slice(-7, -4)}-${d.slice(-4)}`;
}

function avatarChars(phone: string): string {
  return phone.replace(/\D/g, "").slice(-4, -2) || "··";
}

function truncate(text: string | undefined, max: number): string {
  if (!text) return "No messages yet";
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

function relativeTime(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  const m = Math.round(diffMs / 60_000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (Math.abs(m) < 60) return rtf.format(m, "minute");
  const h = Math.round(m / 60);
  if (Math.abs(h) < 24) return rtf.format(h, "hour");
  return rtf.format(Math.round(h / 24), "day");
}

function msgTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function msgDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

// ─── Status helpers ──────────────────────────────────────────────────────────

type StatusMeta = {
  label: string;
  cardBorder: string;
  badge: string;
  avatar: string;
  dot: string;
  reasonTag: string;
};

function statusMeta(status: ConversationStatus): StatusMeta {
  switch (status) {
    case "ESCALATED":
      return {
        label: "Escalated",
        cardBorder: "border-l-red-500",
        badge: "bg-red-500/15 text-red-400 ring-1 ring-inset ring-red-500/20",
        avatar: "bg-red-500/15 text-red-400",
        dot: "bg-red-500",
        reasonTag: "bg-red-500/10 text-red-400",
      };
    case "HUMAN_ACTIVE":
      return {
        label: "In Progress",
        cardBorder: "border-l-amber-500",
        badge: "bg-amber-500/15 text-amber-400 ring-1 ring-inset ring-amber-500/20",
        avatar: "bg-amber-500/15 text-amber-400",
        dot: "bg-amber-500",
        reasonTag: "bg-amber-500/10 text-amber-400",
      };
    case "ACTIVE_AI":
      return {
        label: "AI",
        cardBorder: "border-l-slate-600",
        badge: "bg-slate-700/80 text-slate-400 ring-1 ring-inset ring-slate-600/30",
        avatar: "bg-slate-700 text-slate-400",
        dot: "bg-slate-500",
        reasonTag: "bg-slate-700 text-slate-400",
      };
    default:
      return {
        label: "Resolved",
        cardBorder: "border-l-emerald-600",
        badge: "bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/20",
        avatar: "bg-emerald-500/15 text-emerald-400",
        dot: "bg-emerald-500",
        reasonTag: "bg-emerald-500/10 text-emerald-400",
      };
  }
}

// ─── Inline icon primitives ──────────────────────────────────────────────────

function IconBolt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.268a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function IconSend({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
  );
}

function IconChevronLeft({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
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

function IconHotel({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M1 21V9.525L12 3l11 6.525V21H1zm2-2h4v-4H3v4zm0-6h4v-4H3v4zm6 6h4v-4H9v4zm0-6h4v-4H9v4zm6 6h4v-4h-4v4zm0-6h4v-4h-4v4z" />
    </svg>
  );
}

function IconChat({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  );
}

function IconAlert({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ─── Skeleton components ─────────────────────────────────────────────────────

function SidebarSkeleton() {
  const titleWidths = ["w-full", "w-4/5", "w-11/12", "w-3/4"];

  return (
    <div className="space-y-1 px-2 py-2">
      {titleWidths.map((widthClass, i) => (
        <div key={i} className="rounded-lg p-3">
          <div className="flex items-start gap-3">
            <div className="skeleton-dark h-10 w-10 flex-shrink-0 rounded-full" />
            <div className="flex-1 space-y-2 pt-1">
              <div className={`skeleton-dark h-3 ${widthClass}`} />
              <div className="skeleton-dark h-2.5 w-full" />
              <div className="skeleton-dark h-2 w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ChatSkeleton() {
  const bubbleWidths = ["w-2/5", "w-[55%]", "w-[70%]", "w-2/5", "w-[55%]"];

  return (
    <div className="space-y-4 px-5 py-6">
      {[false, true, false, false, true].map((right, i) => (
        <div key={i} className={`flex ${right ? "justify-end" : "justify-start"}`}>
          <div className={`skeleton-light h-10 rounded-2xl ${bubbleWidths[i]}`} />
        </div>
      ))}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === "ADMIN";
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isTakingOver, setIsTakingOver] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [socketIssue, setSocketIssue] = useState<string | null>(null);

  const chatRef = useRef<HTMLDivElement | null>(null);
  const conversationsRef = useRef<Conversation[]>([]);

  const isMobileDetailOpen = !!selectedId;
  const escalatedCount = conversations.filter((c) => c.status === "ESCALATED").length;

  // ── Helpers ──────────────────────────────────────────────────────────────

  const updateInList = (patch: Partial<Conversation> & { id: string }) => {
    setConversations((prev) => {
      if (!prev.find((c) => c.id === patch.id)) return prev;
      const next = sortConversations(prev.map((c) => (c.id === patch.id ? { ...c, ...patch } : c)));
      conversationsRef.current = next;
      return next;
    });
  };

  const refreshList = async () => {
    const data = await getConversations();
    const sorted = sortConversations(data);
    conversationsRef.current = sorted;
    setConversations(sorted);
  };

  const loadDetail = async (id: string) => {
    setLoadingDetail(true);
    setDetailError(null);
    try {
      setDetail(await getConversationById(id));
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Failed to load conversation");
      setDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  // ── Mount / socket setup ─────────────────────────────────────────────────

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    const init = async () => {
      try {
        await refreshList();
        setListError(null);
      } catch (err) {
        if (err instanceof AuthTokenError) {
          handleAuthFailure(err.reason);
        }
        setListError(err instanceof Error ? err.message : "Failed to load conversations");
      } finally {
        setLoadingList(false);
      }
    };
    void init();

    const socket = getSocket();

    const handleEscalation = async (payload: EscalationAlertPayload) => {
      setToast(`${payload.escalationReason.replace(/_/g, " ")}`);
      const exists = conversationsRef.current.some((c) => c.id === payload.conversationId);
      if (exists) {
        const next = sortConversations(
          conversationsRef.current.map((c) =>
            c.id === payload.conversationId
              ? { ...c, status: "ESCALATED" as const, escalation_reason: payload.escalationReason }
              : c,
          ),
        );
        conversationsRef.current = next;
        setConversations(next);
      } else {
        try { await refreshList(); } catch { /* non-blocking */ }
      }
    };

    const handleConversationUpdated = (payload: ConversationUpdatedPayload) => {
      if (payload.status === "RESOLVED") {
        setConversations((prev) => {
          const filtered = prev.filter((c) => c.id !== payload.conversationId);
          conversationsRef.current = filtered;
          return filtered;
        });
      } else {
        updateInList({ id: payload.conversationId, status: payload.status, assigned_staff_id: payload.assignedStaffId });
      }
      setDetail((prev) => {
        if (!prev || prev.id !== payload.conversationId) return prev;
        return { ...prev, status: payload.status, assigned_staff_id: payload.assignedStaffId };
      });
    };

    const handleNewMessage = (message: Message) => {
      setConversations((prev) => {
        if (!prev.some((c) => c.id === message.conversation_id)) return prev;
        const next = sortConversations(
          prev.map((c) =>
            c.id === message.conversation_id
              ? { ...c, latest_message: message.body, last_message_at: message.sent_at }
              : c,
          ),
        );
        conversationsRef.current = next;
        return next;
      });
      setDetail((prev) => {
        if (!prev || prev.id !== message.conversation_id) return prev;
        if (prev.messages.some((m) => m.id === message.id)) return prev;
        return {
          ...prev,
          latest_message: message.body,
          last_message_at: message.sent_at,
          messages: [...prev.messages, message],
        };
      });
    };

    const handleConnected = () => {
      setSocketIssue(null);
    };

    const handleConnectError = (error: unknown) => {
      if (isSocketAuthError(error)) {
        handleAuthFailure("expired");
      }
      setSocketIssue("Realtime connection lost. Retrying automatically...");
    };

    const handleReconnectFailed = () => {
      setSocketIssue("Realtime updates are unstable. Retrying in the background...");
    };

    const handleReconnectSuccess = () => {
      setSocketIssue(null);
      void refreshList();
    };

    socket.on("escalation_alert", handleEscalation);
    socket.on("conversation_updated", handleConversationUpdated);
    socket.on("new_message", handleNewMessage);
    socket.on("connect", handleConnected);
    socket.on("connect_error", handleConnectError);
    socket.io.on("reconnect_failed", handleReconnectFailed);
    socket.io.on("reconnect", handleReconnectSuccess);

    return () => {
      socket.off("escalation_alert", handleEscalation);
      socket.off("conversation_updated", handleConversationUpdated);
      socket.off("new_message", handleNewMessage);
      socket.off("connect", handleConnected);
      socket.off("connect_error", handleConnectError);
      socket.io.off("reconnect_failed", handleReconnectFailed);
      socket.io.off("reconnect", handleReconnectSuccess);
      disconnectSocket();
    };
  }, [router]);

  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    void loadDetail(selectedId);
  }, [selectedId]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [detail?.messages.length]);

  useEffect(() => {
    document.title =
      escalatedCount > 0 ? `(${escalatedCount}) Hoscover Staff` : "Hoscover Staff Portal";
  }, [escalatedCount]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const onTakeOver = async () => {
    if (!detail) return;

    const detailSnapshot = detail;
    const listSnapshot = conversationsRef.current;
    const optimisticStatus: ConversationStatus = "HUMAN_ACTIVE";

    setIsTakingOver(true);
    setDetailError(null);

    updateInList({
      id: detail.id,
      status: optimisticStatus,
      escalation_reason: undefined,
    });
    setDetail((prev) => (prev ? { ...prev, status: optimisticStatus, escalation_reason: undefined } : prev));

    try {
      const updated = await takeoverConversation(detail.id);
      updateInList(updated);
      setDetail((prev) => (prev ? { ...prev, ...updated } : prev));
    } catch (err) {
      conversationsRef.current = listSnapshot;
      setConversations(listSnapshot);
      setDetail(detailSnapshot);
      setDetailError(err instanceof Error ? err.message : "Failed to take over conversation");
    } finally { setIsTakingOver(false); }
  };

  const onSendReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!detail || !replyText.trim() || detail.status !== "HUMAN_ACTIVE") return;

    const trimmed = replyText.trim();
    const detailSnapshot = detail;
    const listSnapshot = conversationsRef.current;
    const optimisticSentAt = new Date().toISOString();
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: detail.id,
      direction: "outbound",
      sender_type: "staff",
      body: trimmed,
      sent_at: optimisticSentAt,
    };

    setIsSending(true);
    setDetailError(null);
    setReplyText("");

    setDetail((prev) =>
      prev
        ? {
            ...prev,
            latest_message: optimisticMessage.body,
            last_message_at: optimisticMessage.sent_at,
            messages: [...prev.messages, optimisticMessage],
          }
        : prev,
    );
    updateInList({ id: detail.id, latest_message: optimisticMessage.body, last_message_at: optimisticMessage.sent_at });

    try {
      const saved = await replyToConversation(detail.id, trimmed);
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              latest_message: saved.body,
              last_message_at: saved.sent_at,
              messages: prev.messages.map((message) =>
                message.id === optimisticMessage.id ? saved : message,
              ),
            }
          : prev,
      );
      updateInList({ id: detail.id, latest_message: saved.body, last_message_at: saved.sent_at });
    } catch (err) {
      conversationsRef.current = listSnapshot;
      setConversations(listSnapshot);
      setDetail(detailSnapshot);
      setReplyText(trimmed);
      setDetailError(err instanceof Error ? err.message : "Failed to send message");
    } finally { setIsSending(false); }
  };

  const onResolve = async () => {
    if (!detail) return;

    const detailSnapshot = detail;
    const listSnapshot = conversationsRef.current;

    setIsResolving(true);
    setDetailError(null);

    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== detail.id);
      conversationsRef.current = filtered;
      return filtered;
    });
    setSelectedId(null);

    try {
      await resolveConversation(detail.id);
    } catch (err) {
      conversationsRef.current = listSnapshot;
      setConversations(listSnapshot);
      setDetail(detailSnapshot);
      setSelectedId(detailSnapshot.id);
      setDetailError(err instanceof Error ? err.message : "Failed to resolve conversation");
    } finally { setIsResolving(false); }
  };

  const logout = () => { clearAuthSession(); router.replace("/login"); };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-slate-950">

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="animate-toast-in pointer-events-none fixed right-4 top-4 z-50 flex items-start gap-3 rounded-xl bg-slate-900 p-3.5 pr-5 shadow-2xl ring-1 ring-white/10">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-500/20">
            <IconAlert className="h-4 w-4 text-red-400" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-red-400">
              New Escalation
            </p>
            <p className="mt-0.5 text-sm font-medium capitalize text-white">{toast}</p>
          </div>
        </div>
      )}

      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <header className="flex h-12 flex-shrink-0 items-center justify-between border-b border-white/5 bg-slate-950 px-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 shadow shadow-indigo-600/40">
            <IconHotel className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight text-white">hoscover</span>
          <span className="text-slate-700">·</span>
          <span className="text-sm text-slate-500">Staff Portal</span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-5">
          {/* Live indicator */}
          <div className="flex items-center gap-1.5">
            <div className="relative h-2 w-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-60" />
            </div>
            <span className="text-xs text-slate-500">{socketIssue ? "Reconnecting" : "Live"}</span>
          </div>

          {socketIssue && (
            <p className="hidden text-xs text-amber-500 md:block">{socketIssue}</p>
          )}

          {/* Logout */}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 transition-all hover:bg-slate-800 hover:text-slate-200"
          >
            <IconLogout className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </header>

      <div className="border-b border-white/5 bg-slate-100 px-3 py-3 md:px-4">
        <AdminInvitePanel isAdmin={isAdmin} />
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1">

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside
          className={`flex w-[320px] flex-shrink-0 flex-col border-r border-white/5 bg-slate-900 ${
            isMobileDetailOpen ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Sidebar header */}
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Conversations
              </h2>
              {!loadingList && conversations.length > 0 && (
                <span className="rounded-full bg-indigo-600 px-1.5 py-px text-[10px] font-bold text-white">
                  {conversations.length}
                </span>
              )}
            </div>
            {escalatedCount > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-400 ring-1 ring-inset ring-red-500/20">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                {escalatedCount} urgent
              </span>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto py-2">
            {loadingList && <SidebarSkeleton />}

            {listError && (
              <div className="mx-3 mt-2 rounded-lg bg-red-500/10 px-3 py-2.5 text-xs text-red-400 ring-1 ring-inset ring-red-500/20">
                {listError}
              </div>
            )}

            {!loadingList && !listError && conversations.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800">
                  <IconChat className="h-6 w-6 text-slate-600" />
                </div>
                <p className="text-sm text-slate-500">No active conversations</p>
                <p className="text-xs text-slate-600">Escalations will appear here in real time</p>
              </div>
            )}

            <div className="space-y-px px-2">
              {conversations.map((conv) => {
                const meta = statusMeta(conv.status);
                const isSelected = selectedId === conv.id;
                const isEscalated = conv.status === "ESCALATED";

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedId(conv.id)}
                    className={`group w-full rounded-lg border-l-2 p-3 text-left transition-all ${meta.cardBorder} ${
                      isSelected
                        ? "bg-indigo-600/15 ring-1 ring-inset ring-indigo-500/25"
                        : "hover:bg-slate-800/70"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ${meta.avatar}`}
                        >
                          {avatarChars(conv.guest.phone_number)}
                        </div>
                        {/* Status dot */}
                        <div
                          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-900 ${meta.dot}`}
                        />
                        {/* Escalated pulse */}
                        {isEscalated && (
                          <div
                            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 animate-ping rounded-full border-2 border-slate-900 ${meta.dot} opacity-75`}
                          />
                        )}
                      </div>

                      {/* Text */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-slate-100">
                            {formatPhone(conv.guest.phone_number)}
                          </p>
                          <span className="flex-shrink-0 text-[10px] tabular-nums text-slate-600">
                            {relativeTime(conv.last_message_at)}
                          </span>
                        </div>

                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {truncate(conv.latest_message, 55)}
                        </p>

                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className={`rounded-full px-1.5 py-px text-[10px] font-semibold ${meta.badge}`}>
                            {meta.label}
                          </span>
                          {conv.escalation_reason && (
                            <span className="truncate text-[10px] text-slate-600">
                              · {conv.escalation_reason.replace(/_/g, " ")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ── Chat panel ───────────────────────────────────────────────────── */}
        <section
          className={`flex min-w-0 flex-1 flex-col ${isMobileDetailOpen ? "flex" : "hidden md:flex"}`}
        >
          {/* Empty state */}
          {!selectedId && (
            <div className="flex h-full flex-col items-center justify-center gap-4 bg-slate-50">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200 shadow-inner">
                <IconChat className="h-8 w-8 text-slate-400" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-600">No conversation selected</p>
                <p className="mt-1 text-sm text-slate-400">
                  Choose a conversation from the sidebar to begin
                </p>
              </div>
            </div>
          )}

          {/* Conversation detail */}
          {selectedId && (
            <div className="flex h-full flex-col">
              {/* Detail header */}
              <div className="flex flex-shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
                {/* Back (mobile) */}
                <button
                  onClick={() => setSelectedId(null)}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 md:hidden"
                  title="Back"
                  aria-label="Back to conversations"
                >
                  <IconChevronLeft className="h-5 w-5" />
                </button>

                {/* Guest avatar */}
                {detail && (
                  <div
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      detail.status === "ESCALATED"
                        ? "bg-red-500/10"
                        : detail.status === "HUMAN_ACTIVE"
                          ? "bg-amber-500/10"
                          : "bg-slate-500/10"
                    }`}
                  >
                    <span
                      className={
                        detail.status === "ESCALATED"
                          ? "text-red-500"
                          : detail.status === "HUMAN_ACTIVE"
                            ? "text-amber-500"
                            : "text-slate-400"
                      }
                    >
                      {avatarChars(detail.guest.phone_number)}
                    </span>
                  </div>
                )}

                {/* Name + status */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-sm font-semibold text-slate-900">
                      {detail ? formatPhone(detail.guest.phone_number) : "Loading…"}
                    </h2>
                    {detail && (
                      <span
                        className={`flex-shrink-0 rounded-full px-2 py-px text-[10px] font-semibold ${statusMeta(detail.status).badge}`}
                      >
                        {statusMeta(detail.status).label}
                      </span>
                    )}
                  </div>
                  {detail?.escalation_reason && (
                    <p className="mt-px text-[11px] text-slate-500">
                      Escalation reason ·{" "}
                      <span className="font-medium capitalize text-slate-700">
                        {detail.escalation_reason.replace(/_/g, " ")}
                      </span>
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-shrink-0 items-center gap-2">
                  {detail?.status === "ESCALATED" && (
                    <button
                      onClick={onTakeOver}
                      disabled={isTakingOver}
                      className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-600/25 transition-all hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-indigo-400"
                    >
                      <IconBolt className="h-3.5 w-3.5" />
                      {isTakingOver ? "Taking over…" : "Take Over"}
                    </button>
                  )}
                  {detail?.status === "HUMAN_ACTIVE" && (
                    <button
                      onClick={onResolve}
                      disabled={isResolving}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-600/25 transition-all hover:bg-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-emerald-400"
                    >
                      <IconCheck className="h-3.5 w-3.5" />
                      {isResolving ? "Resolving…" : "Resolve"}
                    </button>
                  )}
                </div>
              </div>

              {/* Error banner */}
              {detailError && (
                <div className="flex-shrink-0 border-b border-red-100 bg-red-50 px-4 py-2.5 text-xs text-red-700">
                  {detailError}
                </div>
              )}

              {/* Messages */}
              <div
                ref={chatRef}
                className="chat-bg light-scroll min-h-0 flex-1 overflow-y-auto px-5 py-5"
              >
                {loadingDetail && <ChatSkeleton />}

                {!loadingDetail && detail && (
                  <div className="space-y-1">
                    {detail.messages.map((msg, idx) => {
                      const prev = detail.messages[idx - 1];
                      const showDate =
                        !prev ||
                        new Date(msg.sent_at).toDateString() !==
                          new Date(prev.sent_at).toDateString();
                      const isStaff = msg.sender_type === "staff";
                      const isAI = msg.sender_type === "ai";

                      return (
                        <Fragment key={msg.id}>
                          {/* Date separator */}
                          {showDate && (
                            <div className="flex items-center gap-3 py-3">
                              <div className="h-px flex-1 bg-slate-200" />
                              <span className="text-[11px] font-medium text-slate-400">
                                {msgDate(msg.sent_at)}
                              </span>
                              <div className="h-px flex-1 bg-slate-200" />
                            </div>
                          )}

                          {/* Bubble */}
                          <div
                            className={`animate-fade-up flex ${isStaff ? "justify-end" : "justify-start"} mb-1`}
                          >
                            <div className="max-w-[78%] md:max-w-[62%]">
                              {/* Label */}
                              {isAI && (
                                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                                  AI
                                </p>
                              )}
                              {isStaff && (
                                <p className="mb-1 text-right text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                                  You
                                </p>
                              )}

                              {/* Bubble body */}
                              <div
                                className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                                  isStaff
                                    ? "rounded-tr-md bg-indigo-600 text-white shadow-indigo-600/20"
                                    : isAI
                                      ? "rounded-tl-md bg-white text-indigo-900 ring-1 ring-inset ring-indigo-100"
                                      : "rounded-tl-md bg-white text-slate-800 ring-1 ring-inset ring-slate-200"
                                }`}
                              >
                                {msg.body}
                              </div>

                              {/* Time */}
                              <p
                                className={`mt-1 text-[10px] text-slate-400 ${isStaff ? "text-right" : "text-left"}`}
                              >
                                {msgTime(msg.sent_at)}
                              </p>
                            </div>
                          </div>
                        </Fragment>
                      );
                    })}

                    {detail.messages.length === 0 && (
                      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                        <p className="text-sm text-slate-400">No messages yet</p>
                        <p className="text-xs text-slate-300">Messages will appear here</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Compose */}
              {detail?.status === "HUMAN_ACTIVE" && (
                <form
                  onSubmit={onSendReply}
                  className="flex-shrink-0 border-t border-slate-200 bg-white px-4 py-3"
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply to the guest…"
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    />
                    <button
                      type="submit"
                      disabled={isSending || !replyText.trim()}
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/25 transition-all hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-indigo-300"
                    >
                      {isSending ? (
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <IconSend className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
