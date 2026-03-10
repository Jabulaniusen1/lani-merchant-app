import type { AxiosResponse } from 'axios';
import client from './client';
import type { ApiResponse, OverviewStats, ChartDataPoint, BestSellerItem, PeakHour } from '../types';

export const getOverviewStatsApi = (
  restaurantId: string,
  period = '7d'
): Promise<AxiosResponse<ApiResponse<OverviewStats>>> =>
  client.get(`/analytics/${restaurantId}/overview?period=${period}`);

export const getRevenueChartApi = (
  restaurantId: string,
  days = 7
): Promise<AxiosResponse<ApiResponse<{ chartData: ChartDataPoint[] }>>> =>
  client.get(`/analytics/${restaurantId}/revenue?days=${days}`);

export const getBestSellersApi = (
  restaurantId: string
): Promise<AxiosResponse<ApiResponse<{ bestSellers: BestSellerItem[] }>>> =>
  client.get(`/analytics/${restaurantId}/best-sellers?limit=10`);

export const getPeakHoursApi = (
  restaurantId: string
): Promise<AxiosResponse<ApiResponse<{ peakHours: PeakHour[] }>>> =>
  client.get(`/analytics/${restaurantId}/peak-hours`);

export const toggleBusyModeApi = (
  restaurantId: string,
  isBusy: boolean,
  busyMessage?: string
): Promise<AxiosResponse<ApiResponse<{ restaurant: { isBusy: boolean; busyMessage: string | null } }>>> =>
  client.patch(`/restaurants/${restaurantId}/busy`, { isBusy, busyMessage });
