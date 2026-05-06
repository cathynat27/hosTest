import { io, Socket } from "socket.io-client";
import { getToken } from "@/lib/auth";
import { getBackendBaseUrl } from "@/lib/runtime-config";

let socketInstance: Socket | null = null;

/**
 * Returns the bare JWT for socket auth, or null when there is no valid session.
 * Returns null (not throws) so callers can redirect cleanly instead of crashing.
 */
function getSocketAuthToken(): string | null {
  const token = getToken();
  if (!token) return null;
  // Check expiry without triggering handleAuthFailure — let the caller decide
  // how to handle the missing session (e.g. redirect vs. show error).
  return token;
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

/**
 * Returns a connected Socket, or **null** when there is no valid session.
 * Throws only for genuine configuration problems (e.g. missing backend URL).
 *
 * Callers should treat null as "no session → redirect to login" and a thrown
 * error as "bad config → show an error message".
 */
export function getSocket(): Socket | null {
  const token = getSocketAuthToken();

  // No token → no session. Return null so the caller can redirect cleanly.
  if (!token) return null;

  const backendUrl = getBackendBaseUrl(); // may throw on bad config

  if (!socketInstance) {
    socketInstance = io(backendUrl, {
      auth: { token },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 10_000,
      transports: ["websocket", "polling"],
    });

    // Set up error handlers on initialization
    socketInstance.on('connect_error', (error) => {
      console.error('[socket] Connection error event:', error);
    });

    socketInstance.on('error', (error) => {
      console.error('[socket] Socket error event:', error);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('[socket] Disconnected:', reason);
    });
  }

  if (!socketInstance.connected) {
    // Refresh the token in case it was renewed since last connect
    const freshToken = getSocketAuthToken();
    if (!freshToken) {
      // Token disappeared between the two checks — treat as no session
      return null;
    }
    socketInstance.auth = { token: freshToken };
    console.log('[socket] Connecting with fresh token (length: ' + freshToken.length + ')');
    
    // Add error handlers before connecting
    socketInstance.once('connect_error', (error) => {
      console.error('[socket] Connection error:', error);
    });
    
    socketInstance.once('error', (error) => {
      console.error('[socket] Socket error:', error);
    });
    
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
