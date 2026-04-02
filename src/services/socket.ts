import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';

let socket: Socket | null = null;

export const connectSocket = (token?: string): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: token ? { token } : undefined,
    });

    socket.on('connect', () => {});
    socket.on('disconnect', () => {});
    socket.on('connect_error', () => {});
  }
  return socket;
};

export const getSocket = (): Socket | null => socket;

export const joinMerchantRooms = (restaurantIds: string[]): void => {
  const s = getSocket();
  if (s) {
    restaurantIds.forEach((id) => {
      s.emit('join_merchant_room', id);
    });
  }
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
