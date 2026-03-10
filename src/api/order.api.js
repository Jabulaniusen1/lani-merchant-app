import client from './client';

export const getRestaurantOrdersApi = (restaurantId, status = null) => {
  const params = status ? { status } : {};
  return client.get(`/orders/restaurant/${restaurantId}`, { params });
};

export const getOrderDetailApi = (orderId) =>
  client.get(`/orders/${orderId}`);

export const updateOrderStatusApi = (orderId, status) =>
  client.patch(`/orders/${orderId}/status`, { status });
