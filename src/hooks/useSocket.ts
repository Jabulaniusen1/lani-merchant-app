import { useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import { getSocket, joinMerchantRooms } from '../services/socket';
import useRestaurantStore from '../store/restaurant.store';

export default function useSocket(): Socket | null {
  const { restaurants } = useRestaurantStore();

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !restaurants.length) return;

    const ids = restaurants.map((r) => r.id);
    joinMerchantRooms(ids);
  }, [restaurants]);

  return getSocket();
}
