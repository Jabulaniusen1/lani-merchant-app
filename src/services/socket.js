import { io } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';

let socket = null;

export const connectSocket = (token) => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: token ? { token } : undefined,
    });

    socket.on('connect', () => console.log('🔌 Socket connected'));
    socket.on('disconnect', () => console.log('❌ Socket disconnected'));
    socket.on('connect_error', (err) => console.log('Socket error:', err.message));
  }
  return socket;
};

export const getSocket = () => socket;

export const joinMerchantRooms = (restaurantIds) => {
  const s = getSocket();
  if (s) {
    restaurantIds.forEach((id) => {
      s.emit('join_merchant_room', id);
    });
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
