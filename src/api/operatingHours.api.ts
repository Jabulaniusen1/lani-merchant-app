import type { AxiosResponse } from 'axios';
import client from './client';
import type { ApiResponse } from '../types';

export interface DayHours {
  day: number;       // 0=Sun … 6=Sat
  isOpen: boolean;
  openTime: string;  // "HH:MM"
  closeTime: string; // "HH:MM"
}

export const getOperatingHoursApi = (
  restaurantId: string,
): Promise<AxiosResponse<ApiResponse<{ hours: DayHours[] }>>> =>
  client.get(`/restaurants/${restaurantId}/hours`);

export const setOperatingHoursApi = (
  restaurantId: string,
  hours: DayHours[],
): Promise<AxiosResponse<ApiResponse<{ hours: DayHours[] }>>> =>
  client.put(`/restaurants/${restaurantId}/hours`, { hours });
