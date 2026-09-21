import { io } from "socket.io-client";

export const createChatSocket = (token) => {
  if (!token) return null;
  // Socket.IO is opt-in. The current deployed REST backend returns 404 for
  // /socket.io, so deriving a socket URL from the REST API creates a noisy
  // failed WebSocket handshake on every page.
  const configured = import.meta.env.VITE_SOCKET_URL?.trim();
  if (!configured) return null;
  return io(configured, {
    transports: ["websocket", "polling"],
    auth: { token },
    autoConnect: true,
    reconnection: false,
  });
};
