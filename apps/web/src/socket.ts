import { io, Socket } from "socket.io-client";

const BASE_URL = import.meta.env.VITE_API_URL ?? window.location.origin;

let socket: Socket | null = null;

export function connectSocket(token: string) {
  socket = io(BASE_URL, {
    auth: { token }
  });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
