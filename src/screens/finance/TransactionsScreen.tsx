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
import type { Transaction } from '../../types';

export default function TransactionsScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { transactions, pagination, isLoadingTransactions, fetchTransactions } = useFinanceStore();
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchTransactions(1).catch(() =>
      showToast({ type: 'error', message: 'Failed to load transactions' })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await fetchTransactions(1);
    setRefreshing(false);
  };

  const loadMore = async (): Promise<void> => {
    if (!pagination || pagination.page >= pagination.totalPages || loadingMore) return;
    setLoadingMore(true);
    await fetchTransactions(pagination.page + 1);
    setLoadingMore(false);
  };

  const renderItem = ({ item }: { item: Transaction }): React.JSX.Element => (
    <View style={[styles.card, shadows.sm as object]}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderNum}>
          #{(item.orderId ?? item.id).slice(-4).toUpperCase()}
        </Text>
        <View style={styles.paidBadge}>
          <Ionicons name="checkmark-circle" size={12} color={colors.success} />
          <Text style={styles.paidText}>PAID</Text>
        </View>
        <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
      </View>

      {item.customerName && (
        <Text style={styles.customerName}>{item.customerName}</Text>
      )}
      {item.restaurantName && (
        <Text style={styles.restaurantName}>{item.restaurantName}</Text>
      )}
      {item.items && (
        <Text style={styles.itemsText} numberOfLines={2}>
          {typeof item.items === 'string'
            ? item.items
            : (item.items as unknown as Array<{ quantity?: number; menuItem?: { name?: string }; name?: string }>)
                .map((i) => `${i.quantity ?? 1}x ${i.menuItem?.name ?? i.name ?? ''}`)
                .join(', ')}
        </Text>
      )}

      <View style={styles.divider} />

      <View style={styles.financials}>
        <Row label="Order Total:" value={formatCurrency(item.orderTotal)} />
        <Row
          label="Your Earning:"
          value={formatCurrency(item.merchantEarning)}
          valueStyle={styles.earningValue}
        />
        <Row
          label="Platform Fee:"
          value={formatCurrency(item.platformFee)}
          valueStyle={styles.feeValue}
        />
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.navy} />
        </TouchableOpacity>
        <Text style={styles.title}>Transactions</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoadingTransactions && transactions.length === 0 && !refreshing ? (
        <View style={{ padding: 16, gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <SkeletonBox key={i} width="100%" height={120} style={{ borderRadius: 12 }} />
          ))}
        </View>
      ) : (
        <FlatList<Transaction>
          data={transactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="card-outline"
              title="No transactions yet"
              subtitle="Completed orders with earnings will appear here."
            />
          }
          ListFooterComponent={
            pagination && pagination.page < pagination.totalPages ? (
              <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMore} disabled={loadingMore}>
                <Text style={styles.loadMoreText}>
                  {loadingMore ? 'Loading...' : 'Load more'}
                </Text>
              </TouchableOpacity>
            ) : null
          }
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

function Row({ label, value, valueStyle }: { label: string; value: string; valueStyle?: object }): React.JSX.Element {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#374151' }}>{label}</Text>
      <Text style={[{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: colors.navy }, valueStyle]}>
        {value}
      </Text>
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  orderNum: { fontFamily: 'Sora_700Bold', fontSize: 15, color: colors.navy },
  paidBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#DCFCE7', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2,
  },
  paidText: { fontFamily: 'DMSans_600SemiBold', fontSize: 10, color: colors.success, letterSpacing: 0.5 },
  date: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted, marginLeft: 'auto' },
  customerName: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: '#374151' },
  restaurantName: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted },
  itemsText: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#6B7280', marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.lightGray, marginVertical: 10 },
  financials: { gap: 2 },
  earningValue: { color: colors.success },
  feeValue: { color: colors.muted },
  loadMoreBtn: {
    alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 24,
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: colors.lightGray,
    marginTop: 8, marginBottom: 16,
  },
  loadMoreText: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: colors.primary },
});
