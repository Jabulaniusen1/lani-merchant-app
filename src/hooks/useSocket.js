import { useEffect } from 'react';
import { getSocket, joinMerchantRooms } from '../services/socket';
import useRestaurantStore from '../store/restaurant.store';

export default function useSocket() {
  const { restaurants } = useRestaurantStore();

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !restaurants.length) return;

    // Join merchant rooms for each restaurant
    const ids = restaurants.map((r) => r.id);
    joinMerchantRooms(ids);
  }, [restaurants]);

  return getSocket();
}
