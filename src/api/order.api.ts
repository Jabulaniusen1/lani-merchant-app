import type { AxiosResponse } from 'axios';
import client from './client';
import type { ApiResponse, Order, OrderStatus } from '../types';

export const getRestaurantOrdersApi = (
  restaurantId: string,
  status: OrderStatus | null = null
): Promise<AxiosResponse<ApiResponse<{ orders: Order[] }>>> => {
  const params: { status?: OrderStatus } = status ? { status } : {};
  return client.get(`/orders/restaurant/${restaurantId}`, { params });
};

export const getOrderDetailApi = (
  orderId: string
): Promise<AxiosResponse<ApiResponse<Order>>> =>
  client.get(`/orders/${orderId}`);

export const updateOrderStatusApi = (
  orderId: string,
  status: OrderStatus
): Promise<AxiosResponse<ApiResponse<{ order: Order }>>> =>
  client.patch(`/orders/${orderId}/status`, { status });
