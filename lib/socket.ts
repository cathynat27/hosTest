import { io, Socket } from "socket.io-client";

let socketInstance: Socket | null = null;

export function getSocket(token: string): Socket {
  if (!process.env.NEXT_PUBLIC_BACKEND_URL) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not configured");
  }

  if (!socketInstance) {
    socketInstance = io(process.env.NEXT_PUBLIC_BACKEND_URL, {
      auth: { token },
      autoConnect: false,
    });
  }

  if (!socketInstance.connected) {
    socketInstance.auth = { token };
    socketInstance.connect();
  }

  return socketInstance;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
  }
}
