import { AuthTokenError, getAuthHeaders, handleAuthFailure } from "@/lib/auth";
import { buildBackendUrl } from "@/lib/runtime-config";
import {
  Conversation,
  ConversationDetail,
  CreateInviteRequest,
  CreateInviteResponse,
  InviteTokenValidation,
  LoginResponse,
  Message,
  OnboardHotelRequest,
  OnboardHotelResponse,
  RegisterRequest,
  RegisterFromInviteRequest,
} from "@/types";
const REQUEST_TIMEOUT_MS = 15_000;

type RequestOptions = {
  method?: "GET" | "POST";
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

  const item = value as Partial<Conversation>;
  if (!item.id || !item.status || !item.last_message_at || !item.created_at || !item.guest?.id || !item.guest?.phone_number) {
    throw new Error("Backend response is invalid: conversation fields are incomplete");
  }

  return item as Conversation;
}

function ensureMessageShape(value: unknown): Message {
  if (!value || typeof value !== "object") {
    throw new Error("Backend response is invalid: message payload missing");
  }

  const item = value as Partial<Message>;
  if (!item.id || !item.conversation_id || !item.body || !item.sender_type || !item.direction || !item.sent_at) {
    throw new Error("Backend response is invalid: message fields are incomplete");
  }

  return item as Message;
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
  if (
    typeof item.email !== "string" ||
    (item.role !== "ADMIN" && item.role !== "STAFF") ||
    typeof item.expiresAt !== "string"
  ) {
    throw new Error("Backend response is invalid: invite fields are incomplete");
  }

  return {
    email: item.email,
    role: item.role,
    expiresAt: item.expiresAt,
    message:
      typeof item.message === "string"
        ? item.message
        : "Invite sent successfully.",
  };
}

function ensureInviteValidationShape(value: unknown): InviteTokenValidation {
  if (!value || typeof value !== "object") {
    throw new Error("Backend response is invalid: invite validation payload missing");
  }

  const item = value as Record<string, unknown>;
  const hotel = item.hotel as Record<string, unknown> | undefined;

  if (
    typeof item.email !== "string" ||
    (item.role !== "ADMIN" && item.role !== "STAFF") ||
    typeof item.expiresAt !== "string" ||
    !hotel ||
    typeof hotel.id !== "string" ||
    typeof hotel.code !== "string" ||
    typeof hotel.name !== "string"
  ) {
    throw new Error("Backend response is invalid: invite validation fields are incomplete");
  }

  return {
    email: item.email,
    role: item.role,
    expiresAt: item.expiresAt,
    hotel: {
      id: hotel.id,
      code: hotel.code,
      name: hotel.name,
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

export async function takeoverConversation(id: string): Promise<Conversation> {
  return ensureConversationShape(await apiRequest<unknown>(`/api/conversations/${id}/takeover`, {
    method: "POST",
  }));
}

export async function replyToConversation(id: string, text: string): Promise<Message> {
  return ensureMessageShape(await apiRequest<unknown>(`/api/conversations/${id}/reply`, {
    method: "POST",
    body: { text },
  }));
}

export async function resolveConversation(id: string): Promise<Conversation> {
  return ensureConversationShape(await apiRequest<unknown>(`/api/conversations/${id}/resolve`, {
    method: "POST",
  }));
}
