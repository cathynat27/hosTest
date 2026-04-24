import { AuthTokenError, getAuthHeaders, handleAuthFailure } from "@/lib/auth";
import { normalizeConversation } from "@/lib/conversation-runtime";
import { buildBackendUrl } from "@/lib/runtime-config";
import {
  AnalyticsDateRange,
  AnalyticsOverview,
  Automation,
  Conversation,
  ConversationDetail,
  CreateAutomationRequest,
  CreateInviteRequest,
  CreateInviteResponse,
  GuestProfile,
  InviteRole,
  InviteTokenValidation,
  LoginResponse,
  Message,
  OnboardHotelRequest,
  OnboardHotelResponse,
  RegisterRequest,
  RegisterFromInviteRequest,
  TeamMember,
} from "@/types";
const REQUEST_TIMEOUT_MS = 15_000;

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  requiresAuth?: boolean;
  extraHeaders?: Record<string, string>;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function extractErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const values = data as Record<string, unknown>;
  if (typeof values.error === "string") return values.error;
  if (typeof values.message === "string") return values.message;
  if (typeof values.detail === "string") return values.detail;
  return null;
}

function extractPayload<T>(data: unknown): T {
  if (data && typeof data === "object" && "data" in data) {
    return (data as { data: T }).data;
  }
  return data as T;
}

function ensureConversationShape(value: unknown): Conversation {
  if (!value || typeof value !== "object") {
    throw new Error("Backend response is invalid: conversation payload missing");
  }
  const record = value as Record<string, unknown>;
  if (typeof record.id !== "string" || !record.id.trim()) {
    throw new Error("Backend response is invalid: conversation fields are incomplete (id)");
  }
  return normalizeConversation(value);
}

function ensureMessageShape(value: unknown): Message {
  if (!value || typeof value !== "object") {
    throw new Error("Backend response is invalid: message payload missing");
  }

  const raw = value as Record<string, unknown>;
  if (!raw.id || !raw.conversation_id || !raw.body || !raw.sender_type || !raw.sent_at) {
    throw new Error("Backend response is invalid: message fields are incomplete");
  }

  const sender_type = raw.sender_type as Message["sender_type"];
  const direction: "inbound" | "outbound" =
    (raw.direction as "inbound" | "outbound") ?? (sender_type === "guest" ? "inbound" : "outbound");

  return {
    id: raw.id as string,
    conversation_id: raw.conversation_id as string,
    direction,
    sender_type,
    sender_id: typeof raw.sender_id === "string" ? raw.sender_id : null,
    body: raw.body as string,
    is_note: raw.is_note === true,
    ai_draft_text: typeof raw.ai_draft_text === "string" ? raw.ai_draft_text : undefined,
    sent_at: raw.sent_at as string,
  } satisfies Message;
}

function ensureConversationDetailShape(value: unknown): ConversationDetail {
  const conversation = ensureConversationShape(value);
  const maybeDetail = value as Partial<ConversationDetail>;
  if (!Array.isArray(maybeDetail.messages)) {
    throw new Error("Backend response is invalid: conversation detail messages missing");
  }

  return {
    ...conversation,
    messages: maybeDetail.messages.map((message) => ensureMessageShape(message)),
  };
}

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, requiresAuth = true, extraHeaders } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...extraHeaders,
  };

  if (requiresAuth) {
    try {
      Object.assign(headers, getAuthHeaders());
    } catch (err) {
      if (err instanceof AuthTokenError) {
        return handleAuthFailure(err.reason);
      }
      throw err;
    }
  }

  let response: Response;
  try {
    response = await fetch(buildBackendUrl(path), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Request timed out. Please check your connection and try again.");
    }

    throw new Error("Unable to reach the server. Please check your internet connection and try again.");
  } finally {
    clearTimeout(timeout);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  let responseBody: unknown = null;
  if (isJson) {
    try {
      responseBody = await response.json();
    } catch {
      responseBody = null;
    }
  }

  if (response.status === 401 && requiresAuth) {
    return handleAuthFailure("expired");
  }

  if (!response.ok) {
    const fallback = response.status >= 500
      ? "Server error. Please try again shortly."
      : "Request failed. Please try again.";
    const message = extractErrorMessage(responseBody) ?? fallback;
    throw new ApiError(message, response.status);
  }

  if (!isJson) {
    throw new Error("Server response format is invalid. Expected JSON.");
  }

  return extractPayload<T>(responseBody);
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  if (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === "true") {
    const { TEST_USERS } = await import("./dev-logins");
    const testUser = TEST_USERS.find((u) => u.email === email && u.password === password);
    if (testUser) {
      console.log(`DEV: Bypassing API for test user login: ${email}`);
      return {
        token: `dev-token-for-${testUser.role.toLowerCase()}`,
        user: {
          id: `dev-${testUser.role.toLowerCase()}`,
          email: testUser.email,
          role: testUser.role,
          hotelId: "dev-hotel",
        },
      };
    }
  }

  return apiRequest<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: { email, password },
    requiresAuth: false,
  });
}

export async function register(payload: RegisterRequest): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/api/auth/register", {
    method: "POST",
    body: {
      email: payload.email,
      password: payload.password,
      hotelId: payload.hotelId,
      role: payload.role ?? "STAFF",
    },
    requiresAuth: false,
  });
}

function ensureOnboardHotelShape(value: unknown): OnboardHotelResponse {
  if (!value || typeof value !== "object") {
    throw new Error("Backend response is invalid: onboarding payload missing");
  }

  const item = value as Record<string, unknown>;
  const hotelCode =
    typeof item.hotelCode === "string"
      ? item.hotelCode
      : typeof item.code === "string"
        ? item.code
        : null;
  const message =
    typeof item.message === "string"
      ? item.message
      : "Hotel onboarded successfully. Invite email has been sent to the admin.";

  if (!hotelCode) {
    throw new Error("Backend response is invalid: hotel code missing");
  }

  return { hotelCode, message };
}

function ensureCreateInviteShape(value: unknown): CreateInviteResponse {
  if (!value || typeof value !== "object") {
    throw new Error("Backend response is invalid: invite payload missing");
  }

  const item = value as Record<string, unknown>;
  const rawRole = typeof item.role === "string" ? item.role.toUpperCase() : "";
  const missing: string[] = [];
  if (typeof item.email !== "string" || !item.email) missing.push("email");
  if (rawRole !== "ADMIN" && rawRole !== "STAFF") missing.push("role");
  if (typeof item.expiresAt !== "string" || !item.expiresAt) missing.push("expiresAt");

  if (missing.length > 0) {
    throw new Error(`Backend response is invalid: invite fields are incomplete (${missing.join(", ")})`);
  }

  return {
    email: item.email as string,
    role: rawRole as InviteRole,
    expiresAt: item.expiresAt as string,
    message: typeof item.message === "string" ? item.message : "Invite sent successfully.",
  };
}

function ensureInviteValidationShape(value: unknown): InviteTokenValidation {
  if (!value || typeof value !== "object") {
    throw new Error("Backend response is invalid: invite validation payload missing");
  }

  const item = value as Record<string, unknown>;
  const hotel = item.hotel && typeof item.hotel === "object"
    ? (item.hotel as Record<string, unknown>)
    : undefined;

  const missing: string[] = [];
  if (typeof item.email !== "string" || !item.email) missing.push("email");
  if (typeof item.expiresAt !== "string" || !item.expiresAt) missing.push("expiresAt");
  if (!hotel) missing.push("hotel");
  else {
    if (typeof hotel.id !== "string") missing.push("hotel.id");
    if (typeof hotel.code !== "string") missing.push("hotel.code");
    if (typeof hotel.name !== "string") missing.push("hotel.name");
  }

  // Normalise role to uppercase so "staff" and "STAFF" both work
  const rawRole = typeof item.role === "string" ? item.role.toUpperCase() : "";
  if (rawRole !== "ADMIN" && rawRole !== "STAFF") missing.push("role");

  if (missing.length > 0) {
    throw new Error(`Backend response is invalid: invite fields are incomplete (${missing.join(", ")})`);
  }

  return {
    email: item.email as string,
    role: rawRole as InviteRole,
    expiresAt: item.expiresAt as string,
    hotel: {
      id: (hotel as Record<string, string>).id,
      code: (hotel as Record<string, string>).code,
      name: (hotel as Record<string, string>).name,
    },
  };
}

export async function onboardHotel(payload: OnboardHotelRequest): Promise<OnboardHotelResponse> {
  const secret = process.env.NEXT_PUBLIC_SUPERADMIN_SECRET;
  const extraHeaders: Record<string, string> = secret
    ? { "x-superadmin-secret": secret }
    : {};

  const response = await apiRequest<unknown>("/api/auth/onboard-hotel", {
    method: "POST",
    body: {
      ...payload,
      knowledge_text: payload.knowledge_text.trim() || undefined,
    },
    requiresAuth: false,
    extraHeaders,
  });
  return ensureOnboardHotelShape(response);
}

export async function createInvite(payload: CreateInviteRequest): Promise<CreateInviteResponse> {
  const response = await apiRequest<unknown>("/api/auth/invites", {
    method: "POST",
    body: {
      email: payload.email,
      role: payload.role ?? "STAFF",
    },
    requiresAuth: true,
  });
  return ensureCreateInviteShape(response);
}

export async function validateInviteToken(token: string): Promise<InviteTokenValidation> {
  const response = await apiRequest<unknown>(`/api/auth/invite/${encodeURIComponent(token)}`, {
    requiresAuth: false,
  });
  return ensureInviteValidationShape(response);
}

export async function registerFromInvite(payload: RegisterFromInviteRequest): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/api/auth/register-from-invite", {
    method: "POST",
    body: payload,
    requiresAuth: false,
  });
}

export async function getConversations(): Promise<Conversation[]> {
  const response = await apiRequest<unknown[]>("/api/conversations");
  if (!Array.isArray(response)) {
    throw new Error("Backend response is invalid: expected a conversations list");
  }

  return response.map((conversation) => ensureConversationShape(conversation));
}

export async function getConversationById(id: string): Promise<ConversationDetail> {
  return ensureConversationDetailShape(await apiRequest<unknown>(`/api/conversations/${id}`));
}

export async function takeoverConversation(id: string): Promise<unknown> {
  return apiRequest<unknown>(`/api/conversations/${id}/takeover`, {
    method: "POST",
  });
}

export async function replyToConversation(id: string, text: string): Promise<Message> {
  return ensureMessageShape(await apiRequest<unknown>(`/api/conversations/${id}/reply`, {
    method: "POST",
    body: { text },
  }));
}

export async function resolveConversation(id: string): Promise<unknown> {
  return apiRequest<unknown>(`/api/conversations/${id}/resolve`, {
    method: "POST",
  });
}

export async function assignConversation(id: string, staffId: string): Promise<unknown> {
  return apiRequest<unknown>(`/api/conversations/${id}/assign`, {
    method: "POST",
    body: { staff_id: staffId },
  });
}

export async function setConversationStatus(id: string, status: "open" | "pending" | "resolved"): Promise<unknown> {
  return apiRequest<unknown>(`/api/conversations/${id}/status`, {
    method: "PUT",
    body: { status },
  });
}

export async function sendNote(id: string, text: string): Promise<Message> {
  return ensureMessageShape(await apiRequest<unknown>(`/api/conversations/${id}/reply`, {
    method: "POST",
    body: { text, is_note: true },
  }));
}

export async function confirmBooking(id: string, amount: number): Promise<unknown> {
  return apiRequest<unknown>(`/api/conversations/${id}/booking`, {
    method: "POST",
    body: { amount },
  });
}

// ─── Automations ─────────────────────────────────────────────────────────────

export async function getAutomations(): Promise<Automation[]> {
  const response = await apiRequest<unknown[]>("/api/automations");
  if (!Array.isArray(response)) {
    throw new Error("Backend response is invalid: expected an automations list");
  }
  return response as Automation[];
}

export async function createAutomation(payload: CreateAutomationRequest): Promise<Automation> {
  return apiRequest<Automation>("/api/automations", {
    method: "POST",
    body: payload,
  });
}

export async function updateAutomation(id: string, payload: Partial<CreateAutomationRequest>): Promise<Automation> {
  return apiRequest<Automation>(`/api/automations/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export async function toggleAutomation(id: string): Promise<Automation> {
  return apiRequest<Automation>(`/api/automations/${id}/toggle`, {
    method: "PUT",
  });
}

export async function deleteAutomation(id: string): Promise<void> {
  await apiRequest<unknown>(`/api/automations/${id}`, {
    method: "DELETE",
  });
}

// ─── Guests ───────────────────────────────────────────────────────────────────

export async function getGuests(search?: string): Promise<GuestProfile[]> {
  const path = search ? `/api/guests?search=${encodeURIComponent(search)}` : "/api/guests";
  const response = await apiRequest<unknown[]>(path);
  if (!Array.isArray(response)) {
    throw new Error("Backend response is invalid: expected a guests list");
  }
  return response as GuestProfile[];
}

export async function getGuestById(id: string): Promise<GuestProfile> {
  return apiRequest<GuestProfile>(`/api/guests/${id}`);
}

export async function updateGuest(id: string, payload: { name?: string; email?: string; notes?: string }): Promise<GuestProfile> {
  return apiRequest<GuestProfile>(`/api/guests/${id}`, {
    method: "PUT",
    body: payload,
  });
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export async function getAnalyticsOverview(range: AnalyticsDateRange = "last_7_days"): Promise<AnalyticsOverview> {
  return apiRequest<AnalyticsOverview>(`/api/analytics/overview?range=${range}`);
}

// ─── Team ─────────────────────────────────────────────────────────────────────

export async function getTeamMembers(): Promise<TeamMember[]> {
  const response = await apiRequest<unknown[]>("/api/team");
  if (!Array.isArray(response)) {
    throw new Error("Backend response is invalid: expected a team list");
  }
  return response as TeamMember[];
}

export async function deactivateTeamMember(id: string): Promise<TeamMember> {
  return apiRequest<TeamMember>(`/api/team/${id}/deactivate`, {
    method: "POST",
  });
}

export async function changeTeamMemberRole(id: string, role: "ADMIN" | "STAFF"): Promise<TeamMember> {
  return apiRequest<TeamMember>(`/api/team/${id}/role`, {
    method: "POST",
    body: { role },
  });
}
