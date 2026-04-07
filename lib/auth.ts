const TOKEN_KEY = "hoscover_jwt";

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

export function getAuthHeaders(): { Authorization: string } {
  const token = getToken();
  if (!token) {
    throw new Error("No auth token found");
  }

  return { Authorization: `Bearer ${token}` };
}
