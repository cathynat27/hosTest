"use client";

import { Component, ErrorInfo, Fragment, FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiError,
  assignConversation,
  confirmBooking,
  getConversationById,
  getConversations,
  getTeamMembers,
  replyToConversation,
  resolveConversation,
  sendNote,
  takeoverConversation,
  updateGuest,
} from "@/lib/api";
import {
  normalizeConversation,
  validateConversationPayload,
} from "@/lib/conversation-runtime";
import {
  AuthTokenError,
  clearAuthSession,
  decodeJwtPayload,
  getCurrentUser,
  getToken,
  handleAuthFailure,
} from "@/lib/auth";
import { getSocket, isSocketAuthError } from "@/lib/socket";
import {
  Conversation,
  ConversationDetail,
  ConversationStatus,
  ConversationUpdatedPayload,
  EscalationAlertPayload,
  Message,
  TeamMember,
} from "@/types";

type ConversationFilter = "ALL" | ConversationStatus;

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

function guestDisplayName(name: string | null | undefined, phone: string): string {
  return name?.trim() || formatPhone(phone);
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

// ─── Escalation reason display names ────────────────────────────────────────

const REASON_LABELS: Record<string, string> = {
  rate_limit_exceeded: "Rate limit exceeded",
  ai_failure: "AI failure",
  low_confidence: "Low confidence",
  emergency: "Emergency",
  human_request: "Human requested",
  complaint: "Complaint",
  booking: "Booking issue",
  repeated_frustration: "Repeated frustration",
  escalated_state: "Guest follow-up",
  injection_attempt: "Unusual message",
};

function formatReason(reason: string): string {
  return REASON_LABELS[reason] ?? reason.replace(/_/g, " ");
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
        badge: "bg-red-50 text-red-700 ring-1 ring-red-200",
        avatar: "bg-red-100 text-red-700",
        dot: "bg-red-500",
        reasonTag: "bg-red-50 text-red-700 ring-1 ring-red-200",
      };
    case "HUMAN_ACTIVE":
      return {
        label: "In Progress",
        cardBorder: "border-l-amber-500",
        badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
        avatar: "bg-amber-100 text-amber-700",
        dot: "bg-amber-500",
        reasonTag: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
      };
    case "ACTIVE_AI":
      return {
        label: "AI",
        cardBorder: "border-l-sky-500",
        badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
        avatar: "bg-sky-100 text-sky-700",
        dot: "bg-sky-500",
        reasonTag: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
      };
    default:
      return {
        label: "Resolved",
        cardBorder: "border-l-emerald-600",
        badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
        avatar: "bg-emerald-100 text-emerald-700",
        dot: "bg-emerald-500",
        reasonTag: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
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

// ─── Toast type ──────────────────────────────────────────────────────────────

type ToastData = {
  conversationId: string;
  guestPhone?: string;
  reason: string;
};

const MUTATION_PAYLOAD_WARNING = "Conversation update received incomplete data, please refresh";

type ConversationPaneErrorBoundaryProps = {
  children: ReactNode;
};

type ConversationPaneErrorBoundaryState = {
  hasError: boolean;
};

class ConversationPaneErrorBoundary extends Component<
  ConversationPaneErrorBoundaryProps,
  ConversationPaneErrorBoundaryState
> {
  state: ConversationPaneErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ConversationPaneErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[conversation-pane-boundary]", error, errorInfo.componentStack);
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="glass-card flex min-h-[320px] flex-1 flex-col items-center justify-center gap-2 rounded-2xl p-6 text-center">
        <p className="text-sm font-semibold text-slate-900">Conversation pane temporarily unavailable</p>
        <p className="text-xs text-slate-500">Please refresh to recover realtime state.</p>
      </div>
    );
  }
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [toast, setToast] = useState<ToastData | null>(null);
  const [updateWarning, setUpdateWarning] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isTakingOver, setIsTakingOver] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [showResolveConfirm, setShowResolveConfirm] = useState(false);
  const [socketIssue, setSocketIssue] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [reEscalationBanner, setReEscalationBanner] = useState<string | null>(null);
  const [sessionWarning, setSessionWarning] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ConversationFilter>("ALL");
  const [searchFilter, setSearchFilter] = useState("");
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingAmount, setBookingAmount] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  const chatRef = useRef<HTMLDivElement | null>(null);
  const conversationsRef = useRef<Conversation[]>([]);
  // Tracks real message IDs we sent so the socket echo doesn't create a duplicate bubble (CF-01)
  const pendingSentIds = useRef<Set<string>>(new Set());
  // Kept in sync with selectedId on every render — safe to read inside socket handlers
  const selectedIdRef = useRef<string | null>(null);
  selectedIdRef.current = selectedId;
  const composeInputRef = useRef<HTMLInputElement | null>(null);
  // Stale-request guard for loadDetail
  const loadDetailReqRef = useRef<number>(0);
  // Tracks whether the chat scroll was near the bottom before the last message arrived
  const wasAtBottomRef = useRef<boolean>(true);

  const isMobileDetailOpen = !!selectedId;
  const normalizedSearch = searchFilter.trim().toLowerCase();
  const filteredConversations = conversations.filter((conv) => {
    const statusMatches = statusFilter === "ALL" || conv.status === statusFilter;
    if (!statusMatches) return false;

    if (!normalizedSearch) return true;

    const haystack = [
      conv.guest.phone_number,
      conv.latest_message,
      conv.escalation_reason,
      formatReason(conv.escalation_reason ?? ""),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedSearch);
  });
  const escalatedCount = filteredConversations.filter((c) => c.status === "ESCALATED").length;

  // ── Helpers ──────────────────────────────────────────────────────────────

  const updateInList = (patch: Partial<Conversation> & { id: string }) => {
    setConversations((prev) => {
      if (!prev.find((c) => c.id === patch.id)) return prev;
      const next = sortConversations(prev.map((c) => (c.id === patch.id ? { ...c, ...patch } : c)));
      conversationsRef.current = next;
      return next;
    });
  };

  const applyMutationConversation = (
    endpoint: "assign" | "status" | "takeover" | "resolve" | "booking",
    payload: unknown,
  ): Conversation | null => {
    const validation = validateConversationPayload(payload);
    if (!validation.ok) {
      console.warn("[conversation-payload-validation-failed]", {
        endpoint,
        missingFields: validation.missingFields,
      });
      setUpdateWarning(MUTATION_PAYLOAD_WARNING);
      return null;
    }

    return normalizeConversation(payload);
  };

  const upsertConversation = (conversation: Conversation) => {
    setConversations((prev) => {
      const exists = prev.some((c) => c.id === conversation.id);
      const next = sortConversations(
        exists
          ? prev.map((c) => (c.id === conversation.id ? { ...c, ...conversation } : c))
          : [conversation, ...prev],
      );
      conversationsRef.current = next;
      return next;
    });

    setDetail((prev) => {
      if (!prev || prev.id !== conversation.id) return prev;
      return { ...prev, ...conversation };
    });
  };

  const refreshList = async () => {
    const data = await getConversations();
    const sorted = sortConversations(data);
    conversationsRef.current = sorted;
    setConversations(sorted);
  };

  const loadDetail = async (id: string) => {
    const reqId = ++loadDetailReqRef.current;
    setLoadingDetail(true);
    setDetailError(null);
    try {
      const result = await getConversationById(id);
      if (reqId !== loadDetailReqRef.current) return; // stale — newer request superseded this
      setDetail(result);
    } catch (err) {
      if (reqId !== loadDetailReqRef.current) return;
      setDetailError(err instanceof Error ? err.message : "Failed to load conversation");
      setDetail(null);
    } finally {
      if (reqId === loadDetailReqRef.current) setLoadingDetail(false);
    }
  };

  // ── Mount / socket setup ─────────────────────────────────────────────────

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    const me = getCurrentUser();
    setIsAdmin(me?.role === "ADMIN");
    setCurrentUserId(me?.id ?? null);

    // ── JWT expiry warning (P1-09) ─────────────────────────────────────────
    const expireTimers: ReturnType<typeof setTimeout>[] = [];
    const jwtPayload = decodeJwtPayload(token);
    if (jwtPayload?.exp) {
      const msUntilExpiry = jwtPayload.exp * 1000 - Date.now();
      const warnAt = msUntilExpiry - 60_000;
      if (warnAt > 0) {
        expireTimers.push(setTimeout(() => setSessionWarning(true), warnAt));
      } else if (msUntilExpiry > 0) {
        setSessionWarning(true);
      }
      if (msUntilExpiry > 0) {
        expireTimers.push(
          setTimeout(() => {
            clearAuthSession();
            router.replace("/login?reason=session-expired");
          }, msUntilExpiry),
        );
      }
    }

    const init = async () => {
      try {
        await refreshList();
        setListError(null);
      } catch (err) {
        if (err instanceof AuthTokenError) {
          console.warn("[dashboard-page] refreshList auth failure, redirecting.");
          handleAuthFailure(err.reason);
        }
        setListError(err instanceof Error ? err.message : "Failed to load conversations");
      } finally {
        setLoadingList(false);
      }
    };
    void init();

    // ── Socket init (P0-04) — wrapped in try/catch so env misconfiguration
    //    produces a human-readable message instead of a blank screen ─────────
    //    getSocket() returns null when there is no valid session (redirect to
    //    login) and throws only on a genuine config error (show error UI).
    let socket: NonNullable<ReturnType<typeof getSocket>>;
    try {
      const maybeSocket = getSocket();
      if (maybeSocket === null) {
        console.warn("[dashboard-page] No socket/session, redirecting.");
        expireTimers.forEach(clearTimeout);
        handleAuthFailure("missing");
        return;
      }
      socket = maybeSocket;
    } catch {
      setSocketIssue("Dashboard configuration error — contact your administrator.");
      expireTimers.forEach(clearTimeout);
      return;
    }

    // ── Socket event handlers ────────────────────────────────────────────────

    const handleEscalation = async (payload: EscalationAlertPayload) => {
      const convInList = conversationsRef.current.find((c) => c.id === payload.conversationId);
      setToast({
        conversationId: payload.conversationId,
        guestPhone: convInList?.guest.phone_number,
        reason: payload.escalationReason,
      });
      // Browser notification so staff don't miss escalations when the tab is in background (UX-01)
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        const phone = convInList?.guest.phone_number;
        new Notification("Guest Needs Attention", {
          body: `${phone ? formatPhone(phone) : "Guest"} — ${formatReason(payload.escalationReason)}`,
          tag: "escalation",
        });
      }

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
        // New guest — must appear in the list. One retry before surfacing error (P0-06).
        try {
          await refreshList();
        } catch {
          try {
            await refreshList();
          } catch {
            setListError("Failed to load new escalation — refresh the page.");
          }
        }
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
        if (!conversationsRef.current.some((c) => c.id === payload.conversationId)) {
          void refreshList().catch(() => {
            setListError("Failed to sync realtime updates. Please refresh.");
          });
          return;
        }
        updateInList({
          id: payload.conversationId,
          status: payload.status,
          assigned_staff_id: payload.assignedStaffId,
        });
      }
      setDetail((prev) => {
        if (!prev || prev.id !== payload.conversationId) return prev;
        // Detect re-escalation while staff is typing (P1-02) — show banner, keep draft
        if (prev.status === "HUMAN_ACTIVE" && payload.status === "ESCALATED") {
          setReEscalationBanner("This conversation was re-escalated. Take Over again to resume.");
        }
        return { ...prev, status: payload.status, assigned_staff_id: payload.assignedStaffId };
      });
    };

    const handleNewMessage = (message: Message) => {
      if (!conversationsRef.current.some((c) => c.id === message.conversation_id)) {
        void refreshList().catch(() => {
          setListError("Failed to sync realtime updates. Please refresh.");
        });
        return;
      }

      // Always update the sidebar preview regardless of source
      setConversations((prev) => {
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
      // If this is a message we already applied via optimistic update, skip the detail insert (CF-01)
      if (pendingSentIds.current.has(message.id)) {
        pendingSentIds.current.delete(message.id);
        return;
      }
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
      // Track unread count for non-selected conversations (P1-03)
      if (message.conversation_id !== selectedIdRef.current) {
        setUnreadCounts((prev) => ({
          ...prev,
          [message.conversation_id]: (prev[message.conversation_id] ?? 0) + 1,
        }));
      }
    };

    const handleConnected = () => {
      setSocketIssue(null);
    };

    const handleConnectError = (error: unknown) => {
      if (isSocketAuthError(error)) {
        console.error("[dashboard-page] Socket auth error (redirect disabled for debug):", error);
        // handleAuthFailure("expired"); // Disabled to debug persistent redirect issue
      }
      setSocketIssue("Realtime connection lost. Retrying automatically...");
    };

    const handleReconnectFailed = () => {
      setSocketIssue("Realtime updates are unstable. Retrying in the background...");
    };

    const handleReconnectSuccess = () => {
      setSocketIssue(null);
      void refreshList();
      // Refresh open detail view so messages from the disconnection window appear (P1-01)
      // RT-03: if the conversation was resolved while disconnected, handle 404 gracefully
      if (selectedIdRef.current) {
        const id = selectedIdRef.current;
        getConversationById(id)
          .then((result) => setDetail(result))
          .catch((err) => {
            if (err instanceof ApiError && err.status === 404) {
              setSelectedId(null);
              setDetail(null);
              setDetailError("This conversation was resolved by another staff member.");
            } else {
              void loadDetail(id);
            }
          });
      }
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
      // Socket connection itself is managed by DashboardLayout — do NOT disconnect here
      expireTimers.forEach(clearTimeout);
    };
  }, [router]);

  // ── Conversation selection ───────────────────────────────────────────────

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    // Clear unread badge and banner for newly selected conversation (P1-03)
    setUnreadCounts((prev) => {
      if (!prev[selectedId]) return prev;
      const next = { ...prev };
      delete next[selectedId];
      return next;
    });
    setReEscalationBanner(null);
    setShowResolveConfirm(false);
    wasAtBottomRef.current = true; // reset scroll tracking for new conversation
    void loadDetail(selectedId);
  }, [selectedId]);

  // ── Load team members for assignment (admin only) ───────────────────────

  useEffect(() => {
    if (!isAdmin) return;
    getTeamMembers()
      .then((members) => setTeamMembers(members.filter((m) => m.is_active)))
      .catch(() => {/* non-critical — assignment dropdown just shows empty */});
  }, [isAdmin]);

  // ── Toast auto-dismiss ───────────────────────────────────────────────────

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!updateWarning) return;
    const t = setTimeout(() => setUpdateWarning(null), 5000);
    return () => clearTimeout(t);
  }, [updateWarning]);

  // ── Browser notification permission (UX-01) ──────────────────────────────

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }, []);

  // ── Scroll tracking — track wasAtBottom via scroll events (P2-03) ────────
  // Dep array on selectedId so the listener re-attaches when a new conversation is opened (CF-02)

  useEffect(() => {
    const el = chatRef.current;
    if (!el) return;
    const handleScroll = () => {
      wasAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [selectedId]);

  // ── Auto-scroll to bottom only when user was already there (P2-03) ───────

  useEffect(() => {
    const el = chatRef.current;
    if (!el) return;
    if (wasAtBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [detail?.messages.length]);

  // ── Page title ───────────────────────────────────────────────────────────

  useEffect(() => {
    document.title =
      escalatedCount > 0 ? `(${escalatedCount}) Hoscover Staff` : "Hoscover Staff Portal";
  }, [escalatedCount]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const onTakeOver = async () => {
    if (!detail) return;

    setIsTakingOver(true);
    setDetailError(null);
    // No optimistic update — apply state change only on confirmed API response (P0-09)

    try {
      const updatedPayload = await takeoverConversation(detail.id);
      const normalized = applyMutationConversation("takeover", updatedPayload);
      if (!normalized) return;
      upsertConversation(normalized);
      setReEscalationBanner(null);
      // Auto-focus the compose input so staff can type immediately (P1-08)
      setTimeout(() => composeInputRef.current?.focus(), 0);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setDetailError("Claimed by another staff member — conversation updated.");
        void refreshList();
        if (selectedIdRef.current) void loadDetail(selectedIdRef.current);
      } else {
        setDetailError(err instanceof Error ? err.message : "Failed to take over conversation");
      }
    } finally {
      setIsTakingOver(false);
    }
  };

  const onSaveName = async () => {
    if (!detail || !nameInput.trim()) return;
    setIsSavingName(true);
    try {
      const updated = await updateGuest(detail.guest.id, { name: nameInput.trim() });
      setDetail((d) => d ? { ...d, guest: { ...d.guest, name: updated.name } } : d);
      setConversations((prev) =>
        prev.map((c) =>
          c.guest.id === detail.guest.id ? { ...c, guest: { ...c.guest, name: updated.name } } : c
        )
      );
      setIsEditingName(false);
    } catch {
      // silently fail — name stays as-is
    } finally {
      setIsSavingName(false);
    }
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
    updateInList({
      id: detail.id,
      latest_message: optimisticMessage.body,
      last_message_at: optimisticMessage.sent_at,
    });

    try {
      const saved = await replyToConversation(detail.id, trimmed);
      // Register the real ID before updating state so the socket echo (CF-01) is deduped
      pendingSentIds.current.add(saved.id);
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
    } finally {
      setIsSending(false);
    }
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
      const updatedPayload = await resolveConversation(detail.id);
      const normalized = applyMutationConversation("resolve", updatedPayload);
      if (!normalized) {
        conversationsRef.current = listSnapshot;
        setConversations(listSnapshot);
        setDetail(detailSnapshot);
        setSelectedId(detailSnapshot.id);
        return;
      }
    } catch (err) {
      conversationsRef.current = listSnapshot;
      setConversations(listSnapshot);
      setDetail(detailSnapshot);
      setSelectedId(detailSnapshot.id);
      setDetailError(err instanceof Error ? err.message : "Failed to resolve conversation");
    } finally {
      setIsResolving(false);
    }
  };

  const onAssign = async (staffId: string) => {
    if (!detail) return;
    setIsAssigning(true);
    try {
      const updatedPayload = await assignConversation(detail.id, staffId);
      const normalized = applyMutationConversation("assign", updatedPayload);
      if (!normalized) return;
      upsertConversation(normalized);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Failed to assign conversation");
    } finally {
      setIsAssigning(false);
    }
  };

  const onConfirmBooking = async () => {
    if (!detail) return;
    const amount = parseFloat(bookingAmount);
    if (isNaN(amount) || amount <= 0) {
      setDetailError("Please enter a valid booking amount");
      return;
    }
    try {
      const updatedPayload = await confirmBooking(detail.id, amount);
      const normalized = applyMutationConversation("booking", updatedPayload);
      if (!normalized) return;
      upsertConversation(normalized);
      setShowBookingModal(false);
      setBookingAmount("");
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Failed to confirm booking");
    }
  };

  const onSendNote = async (text: string) => {
    if (!detail) return;
    const optimisticNote: Message = {
      id: `temp-note-${Date.now()}`,
      conversation_id: detail.id,
      direction: "outbound",
      sender_type: "staff",
      body: text,
      sent_at: new Date().toISOString(),
      is_note: true,
    } as Message & { is_note: boolean };
    setDetail((prev) => prev ? { ...prev, messages: [...prev.messages, optimisticNote] } : prev);
    setReplyText("");
    setIsNoteMode(false);
    try {
      const saved = await sendNote(detail.id, text);
      setDetail((prev) =>
        prev ? { ...prev, messages: prev.messages.map((m) => m.id === optimisticNote.id ? saved : m) } : prev
      );
    } catch (err) {
      setDetail((prev) =>
        prev ? { ...prev, messages: prev.messages.filter((m) => m.id !== optimisticNote.id) } : prev
      );
      setDetailError(err instanceof Error ? err.message : "Failed to send note");
    }
  };

  const logout = () => {
    clearAuthSession();
    router.replace("/login");
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="flex h-full flex-col overflow-hidden bg-slate-50/50 p-3 sm:p-4">

      {/* ── Session expiry warning banner (P1-09) ───────────────────────────── */}
      {sessionWarning && (
        <div className="flex flex-shrink-0 items-center justify-between gap-3 rounded-xl bg-amber-500/12 px-4 py-2 ring-1 ring-amber-500/20">
          <p className="text-xs font-medium text-amber-400">
            Your session expires in 1 minute. Save your work.
          </p>
          <button
            type="button"
            onClick={() => { clearAuthSession(); router.replace("/login"); }}
            className="text-xs font-semibold text-amber-300 underline hover:text-amber-200"
          >
            Sign in again
          </button>
        </div>
      )}

      {/* ── Toast (P0-08) — clickable, shows guest phone + reason ───────────── */}
      {toast && (
        <button
          type="button"
          onClick={() => {
            setSelectedId(toast.conversationId);
            setToast(null);
          }}
          className="animate-toast-in fixed right-5 top-5 z-50 flex items-start gap-3 rounded-2xl bg-slate-900 p-3.5 pr-5 shadow-2xl ring-1 ring-white/10 transition-opacity hover:opacity-90"
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-500/20">
            <IconAlert className="h-4 w-4 text-red-400" />
          </div>
          <div className="text-left">
            <p className="text-[11px] font-bold uppercase tracking-widest text-red-400">
              New Escalation
            </p>
            {toast.guestPhone && (
              <p className="mt-0.5 text-sm font-semibold text-white">
                {formatPhone(toast.guestPhone)}
              </p>
            )}
            <p className="mt-px text-xs capitalize text-slate-400">{formatReason(toast.reason)}</p>
          </div>
        </button>
      )}

      {updateWarning && (
        <div
          role="status"
          className="animate-toast-in fixed right-5 top-24 z-50 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 ring-1 ring-amber-200"
        >
          {updateWarning}
        </div>
      )}

      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <header className="glass-card flex flex-shrink-0 items-center justify-between gap-3 rounded-2xl px-4 py-2.5 sm:h-12">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-tight text-slate-900">Inbox</span>
          {isAdmin && (
            <span className="rounded-full bg-blue-600/10 px-2 py-px text-[10px] font-semibold text-blue-700">
              Admin
            </span>
          )}
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-1.5">
          {socketIssue && (
            <p className="hidden text-xs text-amber-700 md:block">{socketIssue}</p>
          )}
          <div className="relative h-2 w-2">
            {socketIssue ? (
              <div className="h-2 w-2 rounded-full bg-amber-500" />
            ) : (
              <>
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-60" />
              </>
            )}
          </div>
          <span className="text-xs text-slate-500">{socketIssue ? "Reconnecting" : "Live"}</span>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <ConversationPaneErrorBoundary>
        <div className="mt-3 flex min-h-0 flex-1 justify-center gap-3 md:justify-start">

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside
          className={`glass-card flex w-full max-w-[640px] flex-shrink-0 flex-col overflow-hidden rounded-2xl md:w-[325px] md:max-w-none ${
            isMobileDetailOpen ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Sidebar header */}
          <div className="flex items-center justify-between border-b border-slate-200/70 px-4 py-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-600">
                Conversations
              </h2>
              {!loadingList && conversations.length > 0 && (
                <span className="rounded-full bg-blue-600 px-1.5 py-px text-[10px] font-bold text-white">
                  {filteredConversations.length}
                </span>
              )}
            </div>
            {escalatedCount > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-500 ring-1 ring-red-500/20">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                {escalatedCount} urgent
              </span>
            )}
          </div>

          <div className="border-b border-slate-200/70 px-3 py-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {([
                { key: "ALL", label: "All" },
                { key: "ESCALATED", label: "Escalated" },
                { key: "HUMAN_ACTIVE", label: "In Progress" },
                { key: "ACTIVE_AI", label: "AI" },
              ] as Array<{ key: ConversationFilter; label: string }>).map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setStatusFilter(option.key)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${
                    statusFilter === option.key
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={searchFilter}
              onChange={(event) => setSearchFilter(event.target.value)}
              placeholder="Search phone, message, or reason..."
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          {/* List */}
          <div className="light-scroll flex-1 overflow-y-auto py-2">
            {loadingList && <SidebarSkeleton />}

            {listError && (
              <div className="mx-3 mt-2 rounded-lg bg-red-500/10 px-3 py-2.5 text-xs text-red-700 ring-1 ring-red-500/20">
                {listError}
              </div>
            )}

            {!loadingList && !listError && filteredConversations.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800">
                  <IconChat className="h-6 w-6 text-slate-500" />
                </div>
                <p className="text-sm text-slate-600">No matching conversations</p>
                <p className="text-xs text-slate-500">Try another filter or search term</p>
              </div>
            )}

            <div className="space-y-px px-2">
              {filteredConversations.map((conv) => {
                const meta = statusMeta(conv.status);
                const isSelected = selectedId === conv.id;
                const isEscalated = conv.status === "ESCALATED";
                const unreadCount = unreadCounts[conv.id] ?? 0;

                return (
                  <button
                    type="button"
                    key={conv.id}
                    onClick={() => setSelectedId(conv.id)}
                    className={`group w-full rounded-lg border-l-2 p-3 text-left transition-all ${meta.cardBorder} ${
                      isSelected
                        ? "bg-blue-600/10 ring-1 ring-blue-500/30"
                        : "hover:bg-white/65"
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
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {guestDisplayName(conv.guest.name, conv.guest.phone_number)}
                          </p>
                          <div className="flex flex-shrink-0 items-center gap-1.5">
                            {/* Unread badge (P1-03) */}
                            {unreadCount > 0 && (
                              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] font-bold text-white">
                                {unreadCount}
                              </span>
                            )}
                            <span className="text-[10px] tabular-nums text-slate-500">
                              {relativeTime(conv.last_message_at)}
                            </span>
                          </div>
                        </div>

                        <p className="mt-0.5 truncate text-xs text-slate-600">
                          {truncate(conv.latest_message, 55)}
                        </p>

                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className={`rounded-full px-1.5 py-px text-[10px] font-semibold ${meta.badge}`}>
                            {meta.label}
                          </span>
                          {conv.escalation_reason && (
                            <span className={`truncate rounded-full px-1.5 py-px text-[10px] font-medium ${meta.reasonTag}`}>
                              {formatReason(conv.escalation_reason)}
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
          className={`glass-card flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl ${isMobileDetailOpen ? "flex" : "hidden md:flex"}`}
        >
          {/* Empty state */}
          {!selectedId && (
            <div className="flex h-full flex-col items-center justify-center gap-4 bg-white/45">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200 shadow-inner">
                <IconChat className="h-8 w-8 text-slate-400" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-700">No conversation selected</p>
                <p className="mt-1 text-sm text-slate-500">
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
                  type="button"
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
                    {isEditingName ? (
                      <div className="flex items-center gap-1">
                        <input
                          autoFocus
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") void onSaveName();
                            if (e.key === "Escape") setIsEditingName(false);
                          }}
                          placeholder="Enter customer name"
                          className="rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-300 w-44"
                        />
                        <button
                          type="button"
                          onClick={() => void onSaveName()}
                          disabled={isSavingName}
                          className="rounded-lg bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
                        >
                          {isSavingName ? "…" : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingName(false)}
                          className="rounded-lg px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h2 className="truncate text-sm font-semibold text-slate-900">
                          {detail ? guestDisplayName(detail.guest.name, detail.guest.phone_number) : "Loading…"}
                        </h2>
                        {detail && (
                          <button
                            type="button"
                            title="Edit customer name"
                            onClick={() => { setNameInput(detail.guest.name ?? ""); setIsEditingName(true); }}
                            className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition"
                          >
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                    {detail && !isEditingName && (
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
                      <span className={`rounded-full px-1.5 py-px font-medium capitalize ${statusMeta(detail.status).reasonTag}`}>
                        {formatReason(detail.escalation_reason)}
                      </span>
                    </p>
                  )}
                </div>

                {/* Admin: assign to staff */}
                {isAdmin && detail && (
                  <select
                    value={detail.assigned_staff_id ?? ""}
                    onChange={(e) => { if (e.target.value) void onAssign(e.target.value); }}
                    disabled={isAssigning}
                    aria-label="Assign conversation to staff member"
                    className="hidden rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:opacity-50 sm:block"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>{m.name || m.email}</option>
                    ))}
                  </select>
                )}

                {/* Admin: booking confirmed */}
                {isAdmin && detail?.status === "HUMAN_ACTIVE" && !(detail as ConversationDetail & { booking_confirmed?: boolean }).booking_confirmed && (
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(true)}
                    className="hidden items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 sm:flex"
                  >
                    Booking Confirmed
                  </button>
                )}
                {(detail as ConversationDetail & { booking_confirmed?: boolean })?.booking_confirmed && (
                  <span className="hidden items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700 sm:flex">
                    ✓ Booked
                  </span>
                )}

                {/* Action buttons */}
                <div className="flex flex-shrink-0 items-center gap-2">
                  {(detail?.status === "ESCALATED" || detail?.status === "ACTIVE_AI") && (
                    <button
                      type="button"
                      onClick={onTakeOver}
                      disabled={isTakingOver}
                      className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-slate-900/20 transition-all hover:bg-slate-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      <IconBolt className="h-3.5 w-3.5" />
                      {isTakingOver ? "Taking over…" : "Take Over"}
                    </button>
                  )}
                  {detail?.status === "HUMAN_ACTIVE" && !showResolveConfirm && (
                    <button
                      type="button"
                      onClick={() => setShowResolveConfirm(true)}
                      disabled={isResolving}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-600/25 transition-all hover:bg-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-emerald-400"
                    >
                      <IconCheck className="h-3.5 w-3.5" />
                      Resolve
                    </button>
                  )}
                  {detail?.status === "HUMAN_ACTIVE" && showResolveConfirm && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Mark as resolved?</span>
                      <button
                        type="button"
                        onClick={() => setShowResolveConfirm(false)}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowResolveConfirm(false); void onResolve(); }}
                        disabled={isResolving}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-emerald-600/25 transition-all hover:bg-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-emerald-400"
                      >
                        <IconCheck className="h-3 w-3" />
                        {isResolving ? "Resolving…" : "Confirm"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Re-escalation banner (P1-02) */}
              {reEscalationBanner && (
                <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2.5">
                  <p className="text-xs font-medium text-amber-800">{reEscalationBanner}</p>
                  <button
                    type="button"
                    onClick={() => setReEscalationBanner(null)}
                    className="text-xs text-amber-600 underline hover:text-amber-800"
                  >
                    Dismiss
                  </button>
                </div>
              )}

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
                      const isNote = isStaff && msg.is_note === true;
                      const isMe = isStaff && (msg.sender_id === currentUserId || !msg.sender_id);
                      const staffSender = isStaff && !isMe
                        ? teamMembers.find((m) => m.id === msg.sender_id)
                        : null;
                      const staffLabel = staffSender
                        ? (staffSender.name || staffSender.email)
                        : isStaff && !isMe
                          ? "Staff"
                          : null;
                      const isAI = msg.sender_type === "ai" ||
                        (msg.direction === "outbound" && msg.sender_type !== "staff");
                      const isGuest = !isStaff && !isAI;

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
                            className={`animate-fade-up flex ${isGuest ? "justify-start" : "justify-end"} mb-1`}
                          >
                            <div className="max-w-[78%] md:max-w-[62%]">
                              {/* Label */}
                              {/* Sender label */}
                              {isAI && (
                                <p className="mb-1 text-right text-[10px] font-bold uppercase tracking-wider text-sky-600">AI</p>
                              )}
                              {isNote && (
                                <p className="mb-1 text-right text-[10px] font-bold uppercase tracking-wider text-amber-600">
                                  {staffLabel ?? "You"} · Note
                                </p>
                              )}
                              {isStaff && !isNote && isMe && (
                                <p className="mb-1 text-right text-[10px] font-bold uppercase tracking-wider text-slate-600">You</p>
                              )}
                              {isStaff && !isNote && !isMe && staffLabel && (
                                <p className="mb-1 text-right text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                                  {staffLabel}
                                </p>
                              )}

                              {/* Bubble body */}
                              <div
                                className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                                  isNote
                                    ? "rounded-tr-md border border-dashed border-amber-300 bg-amber-50 text-amber-900"
                                    : isMe
                                      ? "rounded-tr-md bg-slate-900 text-white shadow-slate-900/20"
                                      : isStaff
                                        ? "rounded-tr-md bg-indigo-600 text-white shadow-indigo-600/20"
                                        : isAI
                                          ? "rounded-tr-md bg-sky-100 text-slate-800 ring-1 ring-sky-200"
                                          : "rounded-tl-md bg-white text-slate-800 ring-1 ring-inset ring-slate-200"
                                }`}
                              >
                                {msg.body}
                              </div>

                              {/* Claude draft — shown when AI had a draft but it wasn't delivered */}
                              {isGuest && msg.ai_draft_text && (
                                <details className="mt-1.5">
                                  <summary className="cursor-pointer select-none text-[10px] font-medium text-amber-500 hover:text-amber-400">
                                    Claude&apos;s draft (not delivered) ▾
                                  </summary>
                                  <div className="mt-1 rounded-xl bg-amber-50 px-3 py-2 text-xs italic text-amber-800 ring-1 ring-inset ring-amber-100">
                                    {msg.ai_draft_text}
                                  </div>
                                </details>
                              )}

                              {/* Time */}
                              <p
                                className={`mt-1 text-[10px] text-slate-400 ${isGuest ? "text-left" : "text-right"}`}
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
              {(detail?.status === "HUMAN_ACTIVE" || detail?.status === "ESCALATED") && (
                <div className="flex-shrink-0 border-t border-slate-200 bg-white px-4 py-3">
                  {detail?.status === "ESCALATED" && (
                    <p className="mb-2 text-xs text-amber-600">
                      Take over this conversation to send your reply.
                    </p>
                  )}

                  {/* Mode toggle (Reply / Note) — only when HUMAN_ACTIVE */}
                  {detail?.status === "HUMAN_ACTIVE" && (
                    <div className="mb-2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setIsNoteMode(false)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${!isNoteMode ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"}`}
                      >
                        Reply
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsNoteMode(true)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${isNoteMode ? "bg-amber-500 text-white" : "text-slate-500 hover:bg-slate-100"}`}
                      >
                        Add Note
                      </button>
                    </div>
                  )}

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!replyText.trim()) return;
                      if (isNoteMode) {
                        void onSendNote(replyText.trim());
                      } else if (detail?.status === "HUMAN_ACTIVE") {
                        void onSendReply(e);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        ref={composeInputRef}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={
                          detail?.status === "ESCALATED"
                            ? "Draft your reply…"
                            : isNoteMode
                            ? "Add an internal note (not sent to guest)…"
                            : "Type your reply to the guest…"
                        }
                        disabled={detail?.status === "ESCALATED"}
                        className={`flex-1 rounded-xl border px-4 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 disabled:cursor-text disabled:opacity-60 ${
                          isNoteMode
                            ? "border-amber-200 bg-amber-50 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                            : "border-slate-200 bg-slate-50 focus:border-slate-500 focus:bg-white focus:ring-4 focus:ring-slate-200"
                        }`}
                      />
                      <button
                        type="submit"
                        disabled={isSending || !replyText.trim() || detail?.status === "ESCALATED"}
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-all active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300 ${
                          isNoteMode
                            ? "bg-amber-500 shadow-amber-500/20 hover:bg-amber-600"
                            : "bg-slate-900 shadow-slate-900/20 hover:bg-slate-700"
                        }`}
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
                </div>
              )}
            </div>
          )}
        </section>
        </div>
      </ConversationPaneErrorBoundary>

      {/* ── Booking confirmation modal ──────────────────────────────────────── */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-sm animate-scale-in rounded-2xl p-6">
            <h3 className="text-base font-bold text-slate-900">Confirm Booking</h3>
            <p className="mt-1 text-sm text-slate-500">
              Mark this conversation as a confirmed booking and record the revenue.
            </p>
            <div className="mt-4">
              <label htmlFor="booking-amount" className="ui-label">Booking Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                <input
                  id="booking-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={bookingAmount}
                  onChange={(e) => setBookingAmount(e.target.value)}
                  placeholder="0.00"
                  className="ui-input pl-7"
                  autoFocus
                />
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => { setShowBookingModal(false); setBookingAmount(""); }}
                className="btn-secondary flex-1 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void onConfirmBooking()}
                disabled={!bookingAmount || parseFloat(bookingAmount) <= 0}
                className="flex-1 rounded-xl bg-emerald-600 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
