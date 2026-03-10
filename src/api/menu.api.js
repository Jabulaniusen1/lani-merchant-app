import client from './client';

export const getMenuApi = (restaurantId) =>
  client.get(`/restaurants/${restaurantId}/menu`);

export const addMenuItemApi = (restaurantId, data) =>
  client.post(`/restaurants/${restaurantId}/menu`, data);

export const updateMenuItemApi = (restaurantId, itemId, data) =>
  client.put(`/restaurants/${restaurantId}/menu/${itemId}`, data);

export const deleteMenuItemApi = (restaurantId, itemId) =>
  client.delete(`/restaurants/${restaurantId}/menu/${itemId}`);

export const toggleMenuItemAvailabilityApi = (restaurantId, itemId, isAvailable) =>
  client.put(`/restaurants/${restaurantId}/menu/${itemId}`, { isAvailable });

export const addCategoryApi = (restaurantId, name) =>
  client.post(`/restaurants/${restaurantId}/menu/categories`, { name });
