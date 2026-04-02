import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/common/Card';
import { SkeletonBox } from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import { showToast } from '../../components/common/Toast';
import useAnalyticsStore from '../../store/analytics.store';
import useRestaurantStore from '../../store/restaurant.store';
import useMerchantType from '../../hooks/useMerchantType';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { formatCurrency } from '../../utils/formatters';
import type { BestSellerItem, PeakHour, ChartDataPoint } from '../../types';

type Period = '1d' | '7d' | '30d';
const PERIODS: { label: string; value: Period }[] = [
  { label: '1 Day', value: '1d' },
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
];

const RANK_COLORS = ['#F59E0B', '#9CA3AF', '#B45309'];

export default function AnalyticsScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { restaurants, activeRestaurant, setActiveRestaurant } = useRestaurantStore();
  const { overview, chartData, bestSellers, peakHours, isLoading, error, fetchAll } = useAnalyticsStore();
  const { Items, store } = useMerchantType();
  const [period, setPeriod] = useState<Period>('7d');
  const [refreshing, setRefreshing] = useState(false);

  const selectedRestaurant = activeRestaurant ?? restaurants[0] ?? null;

  const load = useCallback(async () => {
    if (!selectedRestaurant) return;
    try {
      await fetchAll(selectedRestaurant.id, period);
    } catch {
      showToast({ type: 'error', message: 'Failed to load analytics' });
    }
  }, [selectedRestaurant, period, fetchAll]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRestaurant?.id, period]);

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const peakHour = peakHours.reduce<PeakHour | null>(
    (max, h) => (!max || h.orders > max.orders ? h : max),
    null
  );

  const maxPeakOrders = peakHour?.orders ?? 1;
  const maxChartRevenue = chartData.length > 0 ? Math.max(...chartData.map((d) => d.revenue)) : 1;
  const maxSellerSales = bestSellers.length > 0 ? bestSellers[0].totalQuantitySold : 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Restaurant Selector */}
        {restaurants.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow} contentContainerStyle={styles.pillContent}>
            {restaurants.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={[styles.pill, selectedRestaurant?.id === r.id && styles.pillActive]}
                onPress={() => setActiveRestaurant(r)}
                activeOpacity={0.8}
              >
                <Text style={[styles.pillText, selectedRestaurant?.id === r.id && styles.pillTextActive]}>
                  {r.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Period Selector */}
        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.value}
              style={[styles.periodBtn, period === p.value && styles.periodBtnActive]}
              onPress={() => setPeriod(p.value)}
              activeOpacity={0.8}
            >
              <Text style={[styles.periodBtnText, period === p.value && styles.periodBtnTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {!selectedRestaurant ? (
          <EmptyState icon="bar-chart-outline" title={`No ${store} selected`} subtitle={`Add a ${store} to view analytics.`} />
        ) : error && !isLoading ? (
          <View style={styles.errorState}>
            <Ionicons name="warning-outline" size={32} color={colors.warning} />
            <Text style={styles.errorText}>Failed to load analytics data</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={load} activeOpacity={0.8}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Overview Cards */}
            <Text style={styles.sectionTitle}>Overview</Text>
            {isLoading && !refreshing ? (
              <View style={styles.overviewGrid}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <SkeletonBox key={i} width="48%" height={80} style={{ borderRadius: 12 }} />
                ))}
              </View>
            ) : overview ? (
              <View style={styles.overviewGrid}>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(() => { const changes = (overview as any).changes ?? {}; return (
                  <>
                    <OverviewCard label="Orders" value={String(overview.totalOrders)} icon="receipt-outline" change={changes.orders} />
                    <OverviewCard label="Revenue" value={formatCurrency(overview.revenue)} icon="wallet-outline" highlight change={changes.revenue} />
                    <OverviewCard label="Delivered" value={String(overview.deliveredOrders ?? '-')} icon="checkmark-circle-outline" change={changes.deliveredOrders} />
                    <OverviewCard label="Cancelled" value={String(overview.cancelledOrders)} icon="close-circle-outline" change={changes.cancelledOrders} />
                    <OverviewCard label="Avg Order" value={formatCurrency(overview.avgOrderValue)} icon="trending-up-outline" change={changes.avgOrderValue} />
                    <OverviewCard label="Completion" value={`${overview.completionRate}%`} icon="stats-chart-outline" change={changes.completionRate} />
                  </>
                ); })()}
              </View>
            ) : null}

            {/* Revenue Chart */}
            <Card style={styles.card} shadow="sm">
              <Text style={styles.cardTitle}>Revenue</Text>
              {chartData.length > 0 && (
                <Text style={styles.chartTotalLabel}>
                  Total: {formatCurrency(chartData.reduce((s, d) => s + d.revenue, 0))}
                </Text>
              )}
              {isLoading && !refreshing ? (
                <SkeletonBox width="100%" height={120} style={{ borderRadius: 8, marginTop: 12 }} />
              ) : chartData.length === 0 ? (
                <Text style={styles.noDataText}>No revenue data yet</Text>
              ) : (
                <View style={styles.barChart}>
                  <View style={styles.barsContainer}>
                    {chartData.map((d, i) => {
                      const pct = maxChartRevenue > 0 ? (d.revenue / maxChartRevenue) : 0;
                      return (
                        <View key={i} style={styles.barWrapper}>
                          <Text style={styles.barOrderCount}>{d.orders > 0 ? d.orders : ''}</Text>
                          <View style={styles.barTrack}>
                            <View style={[styles.bar, { height: Math.max(4, pct * 100) }]} />
                          </View>
                          <Text style={styles.barLabel}>{d.label}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </Card>

            {/* Best Sellers */}
            <Card style={styles.card} shadow="sm">
              <Text style={styles.cardTitle}>Top {Items}</Text>
              {isLoading && !refreshing ? (
                [1, 2, 3].map((i) => (
                  <SkeletonBox key={i} width="100%" height={50} style={{ borderRadius: 8, marginBottom: 8 }} />
                ))
              ) : bestSellers.length === 0 ? (
                <Text style={styles.noDataText}>No sales data yet</Text>
              ) : (
                bestSellers.slice(0, 5).map((item, i) => (
                  <BestSellerRow key={item.menuItemId ?? item.name ?? i} item={item} rank={i} maxSales={maxSellerSales} />
                ))
              )}
            </Card>

            {/* Peak Hours */}
            <Card style={styles.card} shadow="sm">
              <Text style={styles.cardTitle}>Busiest Hours</Text>
              {isLoading && !refreshing ? (
                <SkeletonBox width="100%" height={100} style={{ borderRadius: 8 }} />
              ) : peakHours.length === 0 ? (
                <Text style={styles.noDataText}>No peak hours data yet</Text>
              ) : (
                <>
                  <View style={styles.peakChart}>
                    {peakHours.map((h) => {
                      const pct = maxPeakOrders > 0 ? h.orders / maxPeakOrders : 0;
                      const isPeak = h.hour === peakHour?.hour;
                      return (
                        <View key={h.hour} style={styles.peakBarWrapper}>
                          <View style={styles.peakBarTrack}>
                            <View
                              style={[
                                styles.peakBar,
                                { height: Math.max(4, pct * 80) },
                                isPeak ? styles.peakBarActive : styles.peakBarMuted,
                              ]}
                            />
                          </View>
                          {(h.hour % 4 === 0) && (
                            <Text style={styles.peakLabel}>{h.label}</Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                  {peakHour && (
                    <View style={styles.peakInsight}>
                      <Ionicons name="time-outline" size={16} color={colors.primary} />
                      <Text style={styles.peakInsightText}>
                        Your busiest time: {peakHour.label}. Plan your staffing around this time.
                      </Text>
                    </View>
                  )}
                </>
              )}
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function OverviewCard({ label, value, icon, highlight, change }: { label: string; value: string; icon: React.ComponentProps<typeof Ionicons>['name']; highlight?: boolean; change?: number }): React.JSX.Element {
  return (
    <View style={[styles.overviewCard, shadows.sm as object, highlight && styles.overviewCardHighlight]}>
      <Ionicons name={icon} size={20} color={highlight ? colors.primary : colors.muted} />
      <Text style={[styles.overviewValue, highlight && styles.overviewValueHighlight]}>{value}</Text>
      <Text style={styles.overviewLabel}>{label}</Text>
      {change != null && !isNaN(change) && (
        <View style={styles.trendRow}>
          <Ionicons
            name={change >= 0 ? 'trending-up-outline' : 'trending-down-outline'}
            size={13}
            color={change >= 0 ? colors.success : colors.error}
          />
          <Text style={[styles.trendText, { color: change >= 0 ? colors.success : colors.error }]}>
            {Math.abs(change).toFixed(1)}%
          </Text>
        </View>
      )}
    </View>
  );
}

function BestSellerRow({ item, rank, maxSales }: { item: BestSellerItem; rank: number; maxSales: number }): React.JSX.Element {
  const pct = maxSales > 0 ? item.totalQuantitySold / maxSales : 0;
  return (
    <View style={styles.sellerRow}>
      <Text style={[styles.sellerMedal, { color: RANK_COLORS[rank] ?? colors.muted }]}>#{rank + 1}</Text>
      <View style={{ flex: 1 }}>
        <View style={styles.sellerTopRow}>
          <Text style={styles.sellerName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.sellerRevenue}>{formatCurrency(item.totalRevenue)}</Text>
        </View>
        <View style={styles.sellerMeta}>
          <Text style={styles.sellerSold}>{item.totalQuantitySold} sold</Text>
          {item.price != null && (
            <Text style={styles.sellerPrice}>{formatCurrency(item.price)} each</Text>
          )}
          {item.orderCount != null && (
            <Text style={styles.sellerOrders}>in {item.orderCount} orders</Text>
          )}
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${pct * 100}%` }, rank === 0 && styles.progressBarGold]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.softWhite },
  header: {
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.lightGray,
  },
  title: { fontFamily: 'Sora_700Bold', fontSize: 22, color: colors.navy },
  content: { padding: 16, paddingBottom: 40 },
  pillRow: { marginBottom: 12 },
  pillContent: { gap: 8, paddingHorizontal: 0 },
  pill: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: colors.lightGray,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.muted },
  pillTextActive: { color: '#fff' },
  periodRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  periodBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 10, backgroundColor: '#fff',
    borderWidth: 1.5, borderColor: colors.lightGray, alignItems: 'center',
  },
  periodBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  periodBtnText: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.muted },
  periodBtnTextActive: { color: '#fff' },
  sectionTitle: { fontFamily: 'Sora_600SemiBold', fontSize: 15, color: colors.navy, marginBottom: 10 },
  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  overviewCard: {
    width: '48%', backgroundColor: '#fff', borderRadius: 12, padding: 14,
    alignItems: 'flex-start', gap: 4,
  },
  overviewCardHighlight: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  overviewValue: { fontFamily: 'Sora_700Bold', fontSize: 18, color: colors.navy },
  overviewValueHighlight: { color: colors.primary },
  overviewLabel: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  trendText: { fontFamily: 'DMSans_500Medium', fontSize: 11 },
  card: { marginBottom: 14 },
  cardTitle: { fontFamily: 'Sora_600SemiBold', fontSize: 15, color: colors.navy, marginBottom: 4 },
  chartTotalLabel: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted, marginBottom: 8 },
  barChart: { marginTop: 8 },
  barsContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 130 },
  barWrapper: { flex: 1, alignItems: 'center' },
  barTrack: { width: '100%', height: 100, justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: '80%', backgroundColor: colors.primary, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  barLabel: { fontFamily: 'DMSans_400Regular', fontSize: 9, color: colors.muted, marginTop: 4, textAlign: 'center' },
  barOrderCount: { fontFamily: 'DMSans_400Regular', fontSize: 9, color: colors.muted, marginBottom: 2 },
  sellerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  sellerMedal: { fontSize: 20, width: 28, textAlign: 'center' },
  sellerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  sellerName: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: colors.navy, flex: 1 },
  sellerRevenue: { fontFamily: 'Sora_700Bold', fontSize: 13, color: colors.navy, marginLeft: 8 },
  sellerMeta: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 6 },
  sellerSold: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted },
  sellerPrice: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted },
  sellerOrders: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted },
  progressTrack: { height: 6, backgroundColor: colors.lightGray, borderRadius: 3, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#FFC999', borderRadius: 3 },
  progressBarGold: { backgroundColor: colors.primary },
  peakChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 100, marginBottom: 12 },
  peakBarWrapper: { flex: 1, alignItems: 'center' },
  peakBarTrack: { height: 80, justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
  peakBar: { width: '80%', borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  peakBarActive: { backgroundColor: colors.primary },
  peakBarMuted: { backgroundColor: '#FFC999' },
  peakLabel: { fontFamily: 'DMSans_400Regular', fontSize: 8, color: colors.muted, marginTop: 2 },
  peakInsight: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#FFF3E8', borderRadius: 10, padding: 12,
  },
  peakInsightText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.navy, flex: 1, lineHeight: 20 },
  noDataText: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.muted, textAlign: 'center', paddingVertical: 20 },
  errorState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  errorText: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.muted },
  retryBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 24 },
  retryText: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: '#fff' },
});
