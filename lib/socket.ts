import { io, Socket } from "socket.io-client";
import { getAuthHeaders } from "@/lib/auth";
import { getBackendBaseUrl } from "@/lib/runtime-config";

let socketInstance: Socket | null = null;

function getSocketAuthToken(): string {
  const { Authorization } = getAuthHeaders();
  return Authorization.replace(/^Bearer\s+/i, "");
}

function isAuthErrorMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("unauthorized") ||
    lower.includes("forbidden") ||
    lower.includes("invalid token") ||
    lower.includes("jwt") ||
    lower.includes("auth")
  );
}

export function isSocketAuthError(error: unknown): boolean {
  if (typeof error === "string") {
    return isAuthErrorMessage(error);
  }

  if (error && typeof error === "object") {
    const maybeError = error as { message?: string; description?: string; data?: unknown };
    if (typeof maybeError.message === "string" && isAuthErrorMessage(maybeError.message)) {
      return true;
    }
    if (typeof maybeError.description === "string" && isAuthErrorMessage(maybeError.description)) {
      return true;
    }
    if (typeof maybeError.data === "string" && isAuthErrorMessage(maybeError.data)) {
      return true;
    }
  }

  return false;
}

export function getSocket(): Socket {
  const backendUrl = getBackendBaseUrl();

  if (!socketInstance) {
    socketInstance = io(backendUrl, {
      auth: { token: getSocketAuthToken() },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 10_000,
      transports: ["websocket", "polling"],
    });
  }

  if (!socketInstance.connected) {
    socketInstance.auth = { token: getSocketAuthToken() };
    socketInstance.connect();
  }

  return socketInstance;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
