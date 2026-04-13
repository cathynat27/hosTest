import { AuthUser } from "@/types";

const TOKEN_KEY = "hoscover_jwt";
const USER_KEY = "hoscover_user";

export class AuthTokenError extends Error {
  reason: "missing" | "expired";

  constructor(reason: "missing" | "expired") {
    super(reason === "missing" ? "Missing authentication token" : "Session expired. Please sign in again.");
    this.name = "AuthTokenError";
    this.reason = reason;
  }
}

export function decodeJwtPayload(token: string): { exp?: number } | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, "=");
    const decoded = atob(padded);
    return JSON.parse(decoded) as { exp?: number };
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  const nowSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowSeconds;
}

export function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(TOKEN_KEY);
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    if (
      !parsed ||
      typeof parsed.id !== "string" ||
      typeof parsed.email !== "string" ||
      (parsed.role !== "ADMIN" && parsed.role !== "STAFF") ||
      typeof parsed.hotelId !== "string"
    ) {
      return null;
    }
    return {
      id: parsed.id,
      email: parsed.email,
      role: parsed.role,
      hotelId: parsed.hotelId,
    };
  } catch {
    return null;
  }
}

export function setCurrentUser(user: AuthUser): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearCurrentUser(): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(USER_KEY);
}

export function setAuthSession(token: string, user: AuthUser): void {
  setToken(token);
  setCurrentUser(user);
}

export function clearAuthSession(): void {
  clearToken();
  clearCurrentUser();
}

export function handleAuthFailure(reason: "missing" | "expired" = "expired"): never {
  clearAuthSession();

  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    const target = reason === "missing" ? "/login?reason=missing-token" : "/login?reason=session-expired";
    window.location.assign(target);
  }

  throw new AuthTokenError(reason);
}

export function getAuthHeaders(): { Authorization: string } {
  const token = getToken();
  if (!token) {
    return handleAuthFailure("missing");
  }

  if (isTokenExpired(token)) {
    return handleAuthFailure("expired");
  }

  return { Authorization: `Bearer ${token}` };
}
