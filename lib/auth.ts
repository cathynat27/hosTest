const TOKEN_KEY = "hoscover_jwt";

export class AuthTokenError extends Error {
  reason: "missing" | "expired";

  constructor(reason: "missing" | "expired") {
    super(reason === "missing" ? "Missing authentication token" : "Session expired. Please sign in again.");
    this.name = "AuthTokenError";
    this.reason = reason;
  }
}

function decodeJwtPayload(token: string): { exp?: number } | null {
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

export function handleAuthFailure(reason: "missing" | "expired" = "expired"): never {
  clearToken();

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
