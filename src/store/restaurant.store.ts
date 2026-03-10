import { create } from 'zustand';
import {
  getMyRestaurantsApi,
  createRestaurantApi,
  updateRestaurantApi,
} from '../api/restaurant.api';
import { toggleBusyModeApi } from '../api/analytics.api';
import type { Restaurant } from '../types';

interface RestaurantState {
  restaurants: Restaurant[];
  activeRestaurant: Restaurant | null;
  isLoading: boolean;
  fetchRestaurants: () => Promise<void>;
  setActiveRestaurant: (restaurant: Restaurant) => void;
  createRestaurant: (data: Partial<Restaurant>) => Promise<Restaurant>;
  updateRestaurant: (id: string, data: Partial<Restaurant>) => Promise<Restaurant>;
  toggleOpen: (id: string, isOpen: boolean) => Promise<unknown>;
  toggleBusyMode: (id: string, isBusy: boolean, busyMessage?: string) => Promise<void>;
}

const useRestaurantStore = create<RestaurantState>((set, get) => ({
  restaurants: [],
  activeRestaurant: null,
  isLoading: false,

  fetchRestaurants: async (): Promise<void> => {
    set({ isLoading: true });
    try {
      const res = await getMyRestaurantsApi();
      const restaurants: Restaurant[] =
        res.data.data?.restaurants ?? (res.data.data as unknown as Restaurant[]) ?? [];
      set({ restaurants });
      if (!get().activeRestaurant && restaurants.length > 0) {
        set({ activeRestaurant: restaurants[0] });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  setActiveRestaurant: (restaurant: Restaurant): void => set({ activeRestaurant: restaurant }),

  createRestaurant: async (data: Partial<Restaurant>): Promise<Restaurant> => {
    const res = await createRestaurantApi(data);
    const restaurant: Restaurant =
      res.data.data?.restaurant ?? (res.data.data as unknown as Restaurant);
    set((state) => ({
      restaurants: [...state.restaurants, restaurant],
      activeRestaurant: state.activeRestaurant ?? restaurant,
    }));
    return restaurant;
  },

  updateRestaurant: async (id: string, data: Partial<Restaurant>): Promise<Restaurant> => {
    const res = await updateRestaurantApi(id, data);
    const updated: Restaurant =
      res.data.data?.restaurant ?? (res.data.data as unknown as Restaurant);
    set((state) => ({
      restaurants: state.restaurants.map((r) => (r.id === id ? updated : r)),
      activeRestaurant:
        state.activeRestaurant?.id === id ? updated : state.activeRestaurant,
    }));
    return updated;
  },

  toggleOpen: async (id: string, isOpen: boolean): Promise<unknown> => {
    const res = await updateRestaurantApi(id, { isOpen });
    const updated = res.data.data;
    set((state) => ({
      restaurants: state.restaurants.map((r) => (r.id === id ? { ...r, isOpen } : r)),
      activeRestaurant:
        state.activeRestaurant?.id === id
          ? { ...state.activeRestaurant, isOpen }
          : state.activeRestaurant,
    }));
    return updated;
  },

  toggleBusyMode: async (id: string, isBusy: boolean, busyMessage?: string): Promise<void> => {
    await toggleBusyModeApi(id, isBusy, busyMessage);
    set((state) => ({
      restaurants: state.restaurants.map((r) =>
        r.id === id
          ? { ...r, isBusy, busyMessage: isBusy ? (busyMessage ?? null) : null }
          : r
      ),
      activeRestaurant:
        state.activeRestaurant?.id === id
          ? { ...state.activeRestaurant, isBusy, busyMessage: isBusy ? (busyMessage ?? null) : null }
          : state.activeRestaurant,
    }));
  },
}));

export default useRestaurantStore;
