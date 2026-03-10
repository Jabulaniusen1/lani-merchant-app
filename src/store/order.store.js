import { create } from 'zustand';
import { getRestaurantOrdersApi, updateOrderStatusApi, getOrderDetailApi } from '../api/order.api';

const useOrderStore = create((set, get) => ({
  orders: [],
  activeFilter: 'ALL',
  isLoading: false,
  newOrderCount: 0,

  fetchOrders: async (restaurantId, status = null) => {
    set({ isLoading: true });
    try {
      const res = await getRestaurantOrdersApi(restaurantId, status);
      const orders = res.data.data?.orders || res.data.data || [];
      set({ orders });
      // Count pending + confirmed for badge
      const pendingCount = orders.filter(
        (o) => o.status === 'PENDING' || o.status === 'CONFIRMED'
      ).length;
      set({ newOrderCount: pendingCount });
    } finally {
      set({ isLoading: false });
    }
  },

  setFilter: (filter) => set({ activeFilter: filter }),

  addOrder: (order) => {
    set((state) => {
      const orders = [order, ...state.orders];
      const newOrderCount = orders.filter(
        (o) => o.status === 'PENDING' || o.status === 'CONFIRMED'
      ).length;
      return { orders, newOrderCount };
    });
  },

  updateOrderStatus: async (orderId, status) => {
    await updateOrderStatusApi(orderId, status);
    set((state) => {
      const orders = state.orders.map((o) =>
        o.id === orderId ? { ...o, status } : o
      );
      const newOrderCount = orders.filter(
        (o) => o.status === 'PENDING' || o.status === 'CONFIRMED'
      ).length;
      return { orders, newOrderCount };
    });
  },

  updateOrderInList: (orderId, data) => {
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, ...data } : o
      ),
    }));
  },

  removeOrder: (orderId) => {
    set((state) => ({
      orders: state.orders.filter((o) => o.id !== orderId),
    }));
  },

  clearNewOrderCount: () => set({ newOrderCount: 0 }),
}));

export default useOrderStore;
