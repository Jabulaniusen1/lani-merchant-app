import type { AxiosResponse } from 'axios';
import client from './client';
import type { ApiResponse, Restaurant } from '../types';

export const getMyRestaurantsApi = (): Promise<
  AxiosResponse<ApiResponse<{ restaurants: Restaurant[] }>>
> => client.get('/restaurants/merchant/me');

export const createRestaurantApi = (
  data: Partial<Restaurant>
): Promise<AxiosResponse<ApiResponse<{ restaurant: Restaurant }>>> =>
  client.post('/restaurants', data);

export const updateRestaurantApi = (
  id: string,
  data: Partial<Restaurant>
): Promise<AxiosResponse<ApiResponse<{ restaurant: Restaurant }>>> =>
  client.patch(`/restaurants/${id}`, data);

export const getRestaurantApi = (
  id: string
): Promise<AxiosResponse<ApiResponse<{ restaurant: Restaurant }>>> =>
  client.get(`/restaurants/${id}`);

export const toggleRestaurantOpenApi = (
  id: string,
  isOpen: boolean
): Promise<AxiosResponse<ApiResponse<{ restaurant: Restaurant }>>> =>
  client.patch(`/restaurants/${id}`, { isOpen });
