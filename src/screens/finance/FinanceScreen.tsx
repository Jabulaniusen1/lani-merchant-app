import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/common/Card';
import { SkeletonBox } from '../../components/common/SkeletonLoader';
import { showToast } from '../../components/common/Toast';
import useFinanceStore from '../../store/finance.store';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { formatCurrency, formatDate } from '../../utils/formatters';

function maskAccount(accountNumber: string): string {
  return '****' + accountNumber.slice(-4);
}

export default function FinanceScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { earnings, transactions, bankAccount, isLoading, refreshAll, fetchTransactions } = useFinanceStore();
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      await Promise.all([refreshAll(), fetchTransactions(1)]);
    } catch {
      showToast({ type: 'error', message: 'Failed to load finance data' });
    }
  }, [refreshAll, fetchTransactions]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const availableBalance = earnings?.availableBalance ?? 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Finance</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Balance Card */}
        <View style={[styles.balanceCard, shadows.lg]}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          {isLoading && !refreshing ? (
            <SkeletonBox width={160} height={44} style={{ marginVertical: 8, borderRadius: 8 }} />
          ) : (
            <Text style={styles.balanceAmount}>{formatCurrency(availableBalance)}</Text>
          )}
          {earnings && (
            <View style={styles.balanceStats}>
              <Text style={styles.balanceStat}>Total Earned: {formatCurrency(earnings.totalEarned)}</Text>
              <Text style={styles.balanceStat}>Total Paid Out: {formatCurrency(earnings.totalPaidOut)}</Text>
            </View>
          )}
          <View style={styles.balanceActions}>
            <TouchableOpacity
              style={[styles.balanceBtn, styles.balanceBtnPrimary]}
              onPress={() => router.push('/(main)/finance/payout-request')}
              activeOpacity={0.85}
            >
              <Text style={styles.balanceBtnTextPrimary}>Request Payout →</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.balanceBtn, styles.balanceBtnOutline]}
              onPress={() => router.push('/(main)/finance/payout-history')}
              activeOpacity={0.85}
            >
              <Text style={styles.balanceBtnTextOutline}>View History</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Period Stats */}
        {isLoading && !refreshing ? (
          <View style={styles.statsRow}>
            {[1, 2, 3].map((i) => (
              <SkeletonBox key={i} width="31%" height={80} style={{ borderRadius: 12 }} />
            ))}
          </View>
        ) : earnings ? (
          <View style={styles.statsRow}>
            <StatCard label="Today" amount={earnings.today.revenue} orders={earnings.today.orders} />
            <StatCard label="This Week" amount={earnings.thisWeek.revenue} orders={earnings.thisWeek.orders} />
            <StatCard label="This Month" amount={earnings.thisMonth.revenue} orders={earnings.thisMonth.orders} />
          </View>
        ) : null}

        {/* Bank Account Card */}
        <Card style={styles.card} shadow="sm">
          <Text style={styles.sectionTitle}>Bank Account</Text>
          {isLoading && !refreshing ? (
            <SkeletonBox width="100%" height={56} style={{ borderRadius: 8 }} />
          ) : bankAccount ? (
            <View style={styles.bankRow}>
              <View style={styles.bankInfo}>
                <View style={styles.bankVerifiedRow}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={styles.bankName}>{bankAccount.bankName}</Text>
                  <Text style={styles.bankNumber}>— {maskAccount(bankAccount.accountNumber)}</Text>
                </View>
                <Text style={styles.bankAccountName}>{bankAccount.accountName}</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(main)/finance/bank-account')} activeOpacity={0.7}>
                <Text style={styles.changeLink}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.noBankCard}
              onPress={() => router.push('/(main)/finance/bank-account')}
              activeOpacity={0.8}
            >
              <View style={styles.noBankRow}>
                <Ionicons name="warning-outline" size={18} color={colors.warning} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.noBankTitle}>No bank account added</Text>
                  <Text style={styles.noBankSubtitle}>Add your bank account to request payouts</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.warning} />
              </View>
            </TouchableOpacity>
          )}
        </Card>

        {/* Recent Transactions */}
        <Card style={styles.card} shadow="sm">
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => router.push('/(main)/finance/transactions')} activeOpacity={0.7}>
              <Text style={styles.viewAllLink}>View all →</Text>
            </TouchableOpacity>
          </View>

          {isLoading && !refreshing ? (
            [1, 2, 3].map((i) => (
              <SkeletonBox key={i} width="100%" height={60} style={{ borderRadius: 8, marginBottom: 8 }} />
            ))
          ) : transactions.length === 0 ? (
            <Text style={styles.emptyText}>No transactions yet.</Text>
          ) : (
            transactions.slice(0, 5).map((tx) => (
              <View key={tx.id} style={styles.txRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txOrderNum}>#{tx.orderId?.slice(-4).toUpperCase()}</Text>
                  {tx.restaurantName && (
                    <Text style={styles.txRestaurant} numberOfLines={1}>{tx.restaurantName}</Text>
                  )}
                  <Text style={styles.txDate}>{formatDate(tx.createdAt)}</Text>
                </View>
                <Text style={styles.txAmount}>{formatCurrency(tx.merchantEarning)}</Text>
              </View>
            ))
          )}
        </Card>

        <Text style={styles.securityNote}>
          <Ionicons name="lock-closed-outline" size={12} color={colors.muted} />
          {' '}Your account details are encrypted and processed securely via Paystack
        </Text>
      </ScrollView>
    </View>
  );
}

function StatCard({ label, amount, orders }: { label: string; amount: number; orders: number }): React.JSX.Element {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statAmount}>{formatCurrency(amount)}</Text>
      <Text style={styles.statOrders}>{orders} orders</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.softWhite },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  title: { fontFamily: 'Sora_700Bold', fontSize: 22, color: colors.navy },
  content: { padding: 16, paddingBottom: 40 },
  balanceCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
  balanceLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  balanceAmount: {
    fontFamily: 'Sora_700Bold',
    fontSize: 40,
    color: '#fff',
    marginBottom: 12,
  },
  balanceStats: { gap: 4, marginBottom: 20 },
  balanceStat: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  balanceActions: { flexDirection: 'row', gap: 10 },
  balanceBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  balanceBtnPrimary: { backgroundColor: '#fff' },
  balanceBtnOutline: { backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  balanceBtnTextPrimary: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: colors.primary },
  balanceBtnTextOutline: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: '#fff' },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    ...shadows.sm as object,
  },
  statLabel: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.muted, marginBottom: 4 },
  statAmount: { fontFamily: 'Sora_700Bold', fontSize: 14, color: colors.navy },
  statOrders: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.muted, marginTop: 2 },
  card: { marginBottom: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontFamily: 'Sora_600SemiBold', fontSize: 15, color: colors.navy, marginBottom: 12 },
  viewAllLink: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.primary },
  bankRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bankInfo: { flex: 1, gap: 3 },
  bankVerifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bankName: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: colors.navy },
  bankNumber: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.muted },
  bankAccountName: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#374151' },
  changeLink: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.primary },
  noBankCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  noBankRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  noBankTitle: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: colors.warning },
  noBankSubtitle: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.warning, marginTop: 2 },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  txOrderNum: { fontFamily: 'Sora_700Bold', fontSize: 13, color: colors.navy },
  txRestaurant: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#374151', marginTop: 1 },
  txDate: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.muted, marginTop: 1 },
  txAmount: { fontFamily: 'Sora_700Bold', fontSize: 15, color: colors.success },
  emptyText: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.muted, textAlign: 'center', paddingVertical: 16 },
  securityNote: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
});
