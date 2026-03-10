import client from './client';

export const getMyRestaurantsApi = () =>
  client.get('/restaurants/merchant/me');

export const createRestaurantApi = (data) =>
  client.post('/restaurants', data);

export const updateRestaurantApi = (id, data) =>
  client.patch(`/restaurants/${id}`, data);

export const getRestaurantApi = (id) =>
  client.get(`/restaurants/${id}`);

export const toggleRestaurantOpenApi = (id, isOpen) =>
  client.patch(`/restaurants/${id}`, { isOpen });
