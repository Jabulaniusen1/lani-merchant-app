import type { AxiosResponse } from 'axios';
import client from './client';
import type { ApiResponse, MenuItem, MenuCategory } from '../types';

export interface MenuData {
  categories?: MenuCategory[];
  menuItems?: MenuItem[];
  items?: MenuItem[];
}

export const getMenuApi = (
  restaurantId: string
): Promise<AxiosResponse<ApiResponse<MenuData | MenuItem[]>>> =>
  client.get(`/restaurants/${restaurantId}/menu`);

export const addMenuItemApi = (
  restaurantId: string,
  data: Partial<MenuItem>
): Promise<AxiosResponse<ApiResponse<{ menuItem: MenuItem }>>> =>
  client.post(`/restaurants/${restaurantId}/menu`, data);

export const updateMenuItemApi = (
  restaurantId: string,
  itemId: string,
  data: Partial<MenuItem>
): Promise<AxiosResponse<ApiResponse<{ menuItem: MenuItem }>>> =>
  client.put(`/restaurants/${restaurantId}/menu/${itemId}`, data);

export const deleteMenuItemApi = (
  restaurantId: string,
  itemId: string
): Promise<AxiosResponse<ApiResponse<unknown>>> =>
  client.delete(`/restaurants/${restaurantId}/menu/${itemId}`);

export const toggleMenuItemAvailabilityApi = (
  restaurantId: string,
  itemId: string,
  isAvailable: boolean
): Promise<AxiosResponse<ApiResponse<{ menuItem: MenuItem }>>> =>
  client.put(`/restaurants/${restaurantId}/menu/${itemId}`, { isAvailable });

export const addCategoryApi = (
  restaurantId: string,
  name: string
): Promise<AxiosResponse<ApiResponse<{ category: MenuCategory }>>> =>
  client.post(`/restaurants/${restaurantId}/menu/categories`, { name });
