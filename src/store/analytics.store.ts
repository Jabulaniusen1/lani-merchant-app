import { create } from 'zustand';
import {
  getOverviewStatsApi,
  getRevenueChartApi,
  getBestSellersApi,
  getPeakHoursApi,
} from '../api/analytics.api';
import type { OverviewStats, ChartDataPoint, BestSellerItem, PeakHour } from '../types';

interface AnalyticsState {
  overview: OverviewStats | null;
  chartData: ChartDataPoint[];
  bestSellers: BestSellerItem[];
  peakHours: PeakHour[];
  isLoading: boolean;
  error: string | null;
  fetchAll: (restaurantId: string, period?: string) => Promise<void>;
}

const useAnalyticsStore = create<AnalyticsState>((set) => ({
  overview: null,
  chartData: [],
  bestSellers: [],
  peakHours: [],
  isLoading: false,
  error: null,

  fetchAll: async (restaurantId: string, period = '7d'): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const days = period === '1d' ? 1 : period === '7d' ? 7 : 30;
      const [overview, chart, sellers, peak] = await Promise.all([
        getOverviewStatsApi(restaurantId, period),
        getRevenueChartApi(restaurantId, days),
        getBestSellersApi(restaurantId),
        getPeakHoursApi(restaurantId),
      ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const overviewRaw = overview.data.data as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const chartRaw = chart.data.data as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sellersRaw = sellers.data.data as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const peakRaw = peak.data.data as any;
      set({
        overview: overviewRaw,
        chartData: chartRaw.chartData ?? chartRaw.data ?? chartRaw ?? [],
        bestSellers: sellersRaw.bestSellers ?? sellersRaw.items ?? sellersRaw ?? [],
        peakHours: peakRaw.peakHours ?? peakRaw.hours ?? peakRaw ?? [],
      });
    } catch {
      set({ error: 'Failed to load analytics data' });
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useAnalyticsStore;
