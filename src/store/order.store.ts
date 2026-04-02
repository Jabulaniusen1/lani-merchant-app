import { create } from 'zustand';
import {
  getRestaurantOrdersApi,
  updateOrderStatusApi,
} from '../api/order.api';
import type { Order, OrderStatus } from '../types';

type FilterTab = 'ALL' | OrderStatus;

interface OrderState {
  orders: Order[];
  activeFilter: FilterTab;
  isLoading: boolean;
  newOrderCount: number;
  fetchOrders: (restaurantId: string, status?: OrderStatus | null) => Promise<void>;
  setFilter: (filter: FilterTab) => void;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, extra?: { cancelReason?: string; estimatedPrepTime?: number }) => Promise<void>;
  updateOrderInList: (orderId: string, data: Partial<Order>) => void;
  removeOrder: (orderId: string) => void;
  clearNewOrderCount: () => void;
}

const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  activeFilter: 'ALL',
  isLoading: false,
  newOrderCount: 0,

  fetchOrders: async (
    restaurantId: string,
    status: OrderStatus | null = null
  ): Promise<void> => {
    set({ isLoading: true });
    try {
      const res = await getRestaurantOrdersApi(restaurantId, status);
      const orders: Order[] =
        res.data.data?.orders ?? (res.data.data as unknown as Order[]) ?? [];
      set({ orders });
      const pendingCount = orders.filter(
        (o) => o.status === 'PENDING' || o.status === 'CONFIRMED'
      ).length;
      set({ newOrderCount: pendingCount });
    } catch {
      // ignore — keep existing orders
    } finally {
      set({ isLoading: false });
    }
  },

  setFilter: (filter: FilterTab): void => set({ activeFilter: filter }),

  addOrder: (order: Order): void => {
    set((state) => {
      const orders = [order, ...state.orders];
      const newOrderCount = orders.filter(
        (o) => o.status === 'PENDING' || o.status === 'CONFIRMED'
      ).length;
      return { orders, newOrderCount };
    });
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus, extra?: { cancelReason?: string; estimatedPrepTime?: number }): Promise<void> => {
    await updateOrderStatusApi(orderId, status, extra);
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

  updateOrderInList: (orderId: string, data: Partial<Order>): void => {
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, ...data } : o
      ),
    }));
  },

  removeOrder: (orderId: string): void => {
    set((state) => ({
      orders: state.orders.filter((o) => o.id !== orderId),
    }));
  },

  clearNewOrderCount: (): void => set({ newOrderCount: 0 }),
}));

export default useOrderStore;
