import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SkeletonBox } from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import { showToast } from '../../components/common/Toast';
import useFinanceStore from '../../store/finance.store';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { Payout } from '../../types';

function getStatusColor(status: Payout['status']): string {
  switch (status) {
    case 'COMPLETED': return colors.success;
    case 'PROCESSING': return colors.primary;
    case 'PENDING': return colors.warning;
    case 'FAILED': return colors.error;
    default: return colors.muted;
  }
}

function getStatusBg(status: Payout['status']): string {
  switch (status) {
    case 'COMPLETED': return '#DCFCE7';
    case 'PROCESSING': return '#FFF3E8';
    case 'PENDING': return '#FFFBEB';
    case 'FAILED': return '#FEE2E2';
    default: return colors.lightGray;
  }
}

export default function PayoutHistoryScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { payouts, fetchPayouts } = useFinanceStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (): Promise<void> => {
    try {
      await fetchPayouts();
    } catch {
      showToast({ type: 'error', message: 'Failed to load payout history' });
    }
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: Payout }): React.JSX.Element => (
    <View style={[styles.card, shadows.sm as object]}>
      <View style={styles.cardTop}>
        <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.details}>
        {item.bankName && (
          <View style={styles.detailRow}>
            <Ionicons name="business-outline" size={14} color={colors.muted} />
            <Text style={styles.detailText}>{item.bankName}</Text>
          </View>
        )}
        {item.accountNumber && (
          <View style={styles.detailRow}>
            <Ionicons name="card-outline" size={14} color={colors.muted} />
            <Text style={styles.detailText}>****{item.accountNumber.slice(-4)}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={14} color={colors.muted} />
          <Text style={styles.detailText}>Requested: {formatDate(item.requestedAt)}</Text>
        </View>
        {item.processedAt && (
          <View style={styles.detailRow}>
            <Ionicons name="checkmark-circle-outline" size={14} color={colors.success} />
            <Text style={styles.detailText}>Processed: {formatDate(item.processedAt)}</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.navy} />
        </TouchableOpacity>
        <Text style={styles.title}>Payout History</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading && !refreshing ? (
        <View style={{ padding: 16, gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <SkeletonBox key={i} width="100%" height={100} style={{ borderRadius: 12 }} />
          ))}
        </View>
      ) : (
        <FlatList<Payout>
          data={payouts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="💸"
              title="No payouts yet"
              subtitle="Your payout requests will appear here."
            />
          }
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.softWhite },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: colors.lightGray,
  },
  title: { fontFamily: 'Sora_700Bold', fontSize: 18, color: colors.navy },
  list: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  amount: { fontFamily: 'Sora_700Bold', fontSize: 20, color: colors.navy },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontFamily: 'DMSans_600SemiBold', fontSize: 11, letterSpacing: 0.5 },
  details: { gap: 6 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#374151' },
});
