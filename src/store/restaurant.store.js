import { create } from 'zustand';
import { getMyRestaurantsApi, createRestaurantApi, updateRestaurantApi } from '../api/restaurant.api';

const useRestaurantStore = create((set, get) => ({
  restaurants: [],
  activeRestaurant: null,
  isLoading: false,

  fetchRestaurants: async () => {
    set({ isLoading: true });
    try {
      const res = await getMyRestaurantsApi();
      const restaurants = res.data.data?.restaurants || res.data.data || [];
      set({ restaurants });
      // Set first restaurant as active if none selected
      if (!get().activeRestaurant && restaurants.length > 0) {
        set({ activeRestaurant: restaurants[0] });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  setActiveRestaurant: (restaurant) => set({ activeRestaurant: restaurant }),

  createRestaurant: async (data) => {
    const res = await createRestaurantApi(data);
    const restaurant = res.data.data?.restaurant || res.data.data;
    set((state) => ({
      restaurants: [...state.restaurants, restaurant],
      activeRestaurant: state.activeRestaurant || restaurant,
    }));
    return restaurant;
  },

  updateRestaurant: async (id, data) => {
    const res = await updateRestaurantApi(id, data);
    const updated = res.data.data?.restaurant || res.data.data;
    set((state) => ({
      restaurants: state.restaurants.map((r) => (r.id === id ? updated : r)),
      activeRestaurant:
        state.activeRestaurant?.id === id ? updated : state.activeRestaurant,
    }));
    return updated;
  },

  toggleOpen: async (id, isOpen) => {
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
}));

export default useRestaurantStore;
