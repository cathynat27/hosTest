import { clearToken, getAuthHeaders } from "@/lib/auth";
import {
  Conversation,
  ConversationDetail,
  LoginResponse,
  Message,
} from "@/types";
import { TEST_USERS } from "./dev-logins";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const ENABLE_DEV_LOGINS = process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === "true";

type RequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  requiresAuth?: boolean;
};

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, requiresAuth = true } = options;

  if (!BASE_URL) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not configured");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (requiresAuth) {
    Object.assign(headers, getAuthHeaders());
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    clearToken();
    if (typeof window !== "undefined") {
      window.location.assign("/login");
    }
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const errorJson = (await response.json()) as { error?: string };
      if (errorJson.error) {
        message = errorJson.error;
      }
    } catch {
      // Ignore parse errors and keep default message.
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  if (ENABLE_DEV_LOGINS) {
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

export async function getConversations(): Promise<Conversation[]> {
  return apiRequest<Conversation[]>("/api/conversations");
}

export async function getConversationById(id: string): Promise<ConversationDetail> {
  return apiRequest<ConversationDetail>(`/api/conversations/${id}`);
}

export async function takeoverConversation(id: string): Promise<Conversation> {
  return apiRequest<Conversation>(`/api/conversations/${id}/takeover`, {
    method: "POST",
  });
}

export async function replyToConversation(id: string, text: string): Promise<Message> {
  return apiRequest<Message>(`/api/conversations/${id}/reply`, {
    method: "POST",
    body: { text },
  });
}

export async function resolveConversation(id: string): Promise<Conversation> {
  return apiRequest<Conversation>(`/api/conversations/${id}/resolve`, {
    method: "POST",
  });
}
