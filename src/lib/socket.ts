import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (token?: string): Socket => {
  if (!socket) {
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 500,
      reconnectionDelayMax: 2000,
      timeout: 10000,
      transports: ['websocket', 'polling'],
      forceNew: false,
    });
  } else if (token && socket.disconnected) {
    socket.auth = { token };
    socket.connect();
  }
  return socket;
};
