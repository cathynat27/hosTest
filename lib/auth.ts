import { AuthUser } from "@/types";

const TOKEN_KEY = "hoscover_jwt";
const USER_KEY = "hoscover_user";

// ── Cookie helpers ────────────────────────────────────────────────────────────

function setJwtCookie(value: string): void {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 7; // 7 days
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(value)}; path=/; SameSite=Lax; max-age=${maxAge}`;
}

function clearJwtCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_KEY}=; path=/; SameSite=Lax; max-age=0`;
}

function getJwtFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split("; ");
  const match = cookies.find((row) => row.startsWith(`${TOKEN_KEY}=`));
  
  if (!match) {
    console.log(`[auth] Cookie ${TOKEN_KEY} not found in:`, document.cookie.slice(0, 50) + "...");
    return null;
  }
  try {
    const val = decodeURIComponent(match.split("=")[1]);
    console.log(`[auth] Cookie ${TOKEN_KEY} found (length: ${val.length})`);
    return val;
  } catch {
    return null;
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export class AuthTokenError extends Error {
  reason: "missing" | "expired";

  constructor(reason: "missing" | "expired") {
    super(
      reason === "missing"
        ? "Missing authentication token"
        : "Session expired. Please sign in again."
    );
    this.name = "AuthTokenError";
    this.reason = reason;
  }
}

// ── JWT utils ─────────────────────────────────────────────────────────────────

export function decodeJwtPayload(token: string): { exp?: number } | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, "=");
    return JSON.parse(atob(padded)) as { exp?: number };
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  // Never expire dev tokens
  if (token.startsWith("dev-token-")) return false;

  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  const now = Math.floor(Date.now() / 1000);
  const gracePeriod = 60;
  const expired = payload.exp <= now - gracePeriod;
  if (expired) {
    console.log(`[auth] Token expired: exp=${payload.exp}, now=${now}, diff=${payload.exp - now}`);
  }
  return expired;
}

// ── Token storage — cookie-first so session survives port changes ─────────────

export function getToken(): string | null {
  if (typeof window === "undefined") return null;

  // Prefer cookie (survives port changes, readable by middleware)
  const cookieToken = getJwtFromCookie();
  if (cookieToken) {
    // Keep localStorage in sync in case something reads it directly
    localStorage.setItem(TOKEN_KEY, cookieToken);
    return cookieToken;
  }

  // Fall back to localStorage (e.g. cookie was cleared manually)
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  setJwtCookie(token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  clearJwtCookie();
}

// ── User storage ──────────────────────────────────────────────────────────────

export function getCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

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
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearCurrentUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_KEY);
}

// ── Session helpers ───────────────────────────────────────────────────────────

export function setAuthSession(token: string, user: AuthUser): void {
  setToken(token);
  setCurrentUser(user);
}

export function clearAuthSession(): void {
  clearToken();
  clearCurrentUser();
}

/**
 * Clears the session and redirects to login.
 * Does NOT throw — callers should return after this.
 */
export function handleAuthFailure(reason: "missing" | "expired" = "expired"): void {
  console.warn(`[auth] Session failure (${reason}). Redirecting to login.`);
  clearAuthSession();

  if (typeof window === "undefined") return;
  if (window.location.pathname === "/login") return; // already there, don't loop

  const target =
    reason === "missing"
      ? "/login?reason=missing-token"
      : "/login?reason=session-expired";

  window.location.assign(target);
}

/**
 * Returns auth headers, or throws AuthTokenError if the token is missing/expired.
 *
 * @example
 * const headers = getAuthHeaders();
 */
export function getAuthHeaders(): { Authorization: string } {
  const token = getToken();

  if (!token) {
    throw new AuthTokenError("missing");
  }

  if (isTokenExpired(token)) {
    throw new AuthTokenError("expired");
  }

  return { Authorization: `Bearer ${token}` };
}