import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/common/Button';
import { showToast } from '../../components/common/Toast';
import { requestPayoutApi } from '../../api/finance.api';
import useFinanceStore from '../../store/finance.store';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { formatCurrency } from '../../utils/formatters';

const MIN_PAYOUT = 1000;

function maskAccount(accountNumber: string): string {
  return '****' + accountNumber.slice(-4);
}

export default function PayoutRequestScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { earnings, bankAccount, fetchEarnings, fetchBankAccount } = useFinanceStore();
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [payoutResult, setPayoutResult] = useState<{ amount: number } | null>(null);

  useEffect(() => {
    fetchEarnings();
    fetchBankAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const availableBalance = earnings?.availableBalance ?? 0;
  const amountNum = parseInt(amount.replace(/\D/g, ''), 10) || 0;
  const remainingBalance = availableBalance - amountNum;
  const isValid = amountNum >= MIN_PAYOUT && amountNum <= availableBalance && !!bankAccount;

  const handleAmountChange = (text: string): void => {
    const digits = text.replace(/\D/g, '');
    setAmount(digits);
  };

  const handleWithdrawAll = (): void => {
    setAmount(String(availableBalance));
  };

  const handleSubmit = async (): Promise<void> => {
    if (!isValid) return;
    setSubmitting(true);
    try {
      await requestPayoutApi(amountNum);
      setPayoutResult({ amount: amountNum });
      setSuccess(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to request payout';
      showToast({ type: 'error', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  if (success && payoutResult) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="arrow-back" size={24} color={colors.navy} />
          </TouchableOpacity>
          <Text style={styles.title}>Payout Requested</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.successContent}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>Payout Requested!</Text>
          <Text style={styles.successAmount}>{formatCurrency(payoutResult.amount)}</Text>
          <Text style={styles.successSubtitle}>will be transferred to</Text>
          {bankAccount && (
            <Text style={styles.successBank}>
              {bankAccount.accountName} — {bankAccount.bankName} {maskAccount(bankAccount.accountNumber)}
            </Text>
          )}
          <View style={styles.processingCard}>
            <Ionicons name="time-outline" size={16} color={colors.muted} />
            <Text style={styles.processingText}>Processing time: 1–3 business days</Text>
          </View>
          <View style={styles.successActions}>
            <Button
              label="View Payout History"
              variant="outline"
              onPress={() => router.replace('/(main)/finance/payout-history')}
              fullWidth
            />
            <Button
              label="Back to Finance"
              variant="primary"
              onPress={() => router.replace('/(main)/finance')}
              fullWidth
              style={{ marginTop: 10 }}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.navy} />
        </TouchableOpacity>
        <Text style={styles.title}>Request Payout</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Balance */}
          <View style={styles.balanceSection}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>{formatCurrency(availableBalance)}</Text>
          </View>

          {availableBalance === 0 ? (
            <View style={styles.noBalanceBanner}>
              <Ionicons name="information-circle-outline" size={18} color={colors.muted} />
              <Text style={styles.noBalanceText}>No balance available to withdraw</Text>
            </View>
          ) : !bankAccount ? (
            <TouchableOpacity
              style={styles.noBankBanner}
              onPress={() => router.push('/(main)/finance/bank-account')}
              activeOpacity={0.8}
            >
              <Ionicons name="warning-outline" size={18} color={colors.warning} />
              <Text style={styles.noBankText}>You need to add a bank account first →</Text>
            </TouchableOpacity>
          ) : (
            <>
              {/* Amount Input */}
              <View style={styles.amountSection}>
                <Text style={styles.inputLabel}>Withdrawal Amount</Text>
                <View style={styles.amountRow}>
                  <View style={[styles.amountInput, shadows.sm as object]}>
                    <Text style={styles.currencyPrefix}>₦</Text>
                    <TextInput
                      style={styles.amountTextInput}
                      value={amount}
                      onChangeText={handleAmountChange}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={colors.muted}
                    />
                  </View>
                  <TouchableOpacity style={styles.withdrawAllBtn} onPress={handleWithdrawAll} activeOpacity={0.8}>
                    <Text style={styles.withdrawAllText}>All</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.minNote}>Minimum withdrawal: {formatCurrency(MIN_PAYOUT)}</Text>
              </View>

              {/* Bank Account Card */}
              <View style={[styles.bankCard, shadows.sm as object]}>
                <Text style={styles.bankCardLabel}>Sending to:</Text>
                <View style={styles.bankCardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bankCardName}>{bankAccount.bankName} — {maskAccount(bankAccount.accountNumber)}</Text>
                    <Text style={styles.bankCardAccountName}>{bankAccount.accountName}</Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push('/(main)/finance/bank-account')} activeOpacity={0.7}>
                    <Text style={styles.changeLink}>Change →</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Summary */}
              {amountNum > 0 && (
                <View style={[styles.summaryCard, shadows.sm as object]}>
                  <SummaryRow label="Withdrawal Amount" value={formatCurrency(amountNum)} />
                  <SummaryRow label="Processing Fee" value={formatCurrency(0)} />
                  <View style={styles.summaryDivider} />
                  <SummaryRow label="You Will Receive" value={formatCurrency(amountNum)} bold />
                  <SummaryRow
                    label="Remaining Balance"
                    value={formatCurrency(remainingBalance >= 0 ? remainingBalance : 0)}
                    error={remainingBalance < 0}
                  />
                </View>
              )}

              <Button
                label="Request Payout"
                variant="primary"
                onPress={handleSubmit}
                loading={submitting}
                disabled={!isValid}
                fullWidth
                style={{ marginTop: 24 }}
              />
              {amountNum > 0 && amountNum < MIN_PAYOUT && (
                <Text style={styles.validationError}>Minimum withdrawal is {formatCurrency(MIN_PAYOUT)}</Text>
              )}
              {amountNum > availableBalance && (
                <Text style={styles.validationError}>Amount exceeds available balance</Text>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function SummaryRow({ label, value, bold, error }: { label: string; value: string; bold?: boolean; error?: boolean }): React.JSX.Element {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, bold && styles.summaryValueBold, error && styles.summaryValueError]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  title: { fontFamily: 'Sora_700Bold', fontSize: 18, color: colors.navy },
  content: { padding: 20, paddingBottom: 60 },
  balanceSection: { alignItems: 'center', paddingVertical: 24 },
  balanceLabel: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.muted },
  balanceAmount: { fontFamily: 'Sora_700Bold', fontSize: 36, color: colors.navy, marginTop: 4 },
  noBalanceBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.lightGray, borderRadius: 10, padding: 14,
  },
  noBalanceText: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.muted },
  noBankBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFFBEB', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#FEF3C7',
  },
  noBankText: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: colors.warning, flex: 1 },
  amountSection: { marginBottom: 20 },
  inputLabel: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: colors.navy, marginBottom: 10 },
  amountRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  amountInput: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: colors.lightGray,
    paddingHorizontal: 16,
  },
  currencyPrefix: { fontFamily: 'Sora_700Bold', fontSize: 20, color: colors.navy, marginRight: 4 },
  amountTextInput: { flex: 1, fontFamily: 'Sora_700Bold', fontSize: 24, color: colors.navy, paddingVertical: 14 },
  withdrawAllBtn: {
    backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14,
  },
  withdrawAllText: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#fff' },
  minNote: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted, marginTop: 6 },
  bankCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: colors.lightGray, marginBottom: 16,
  },
  bankCardLabel: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted, marginBottom: 8 },
  bankCardRow: { flexDirection: 'row', alignItems: 'center' },
  bankCardName: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: colors.navy },
  bankCardAccountName: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#374151', marginTop: 2 },
  changeLink: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.primary },
  summaryCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: colors.lightGray,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryLabel: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: '#374151' },
  summaryValue: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: colors.navy },
  summaryValueBold: { fontFamily: 'Sora_700Bold', color: colors.navy },
  summaryValueError: { color: colors.error },
  summaryDivider: { height: 1, backgroundColor: colors.lightGray, marginVertical: 6 },
  validationError: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.error, textAlign: 'center', marginTop: 8 },
  // Success
  successContent: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  successIcon: { marginBottom: 16 },
  successTitle: { fontFamily: 'Sora_700Bold', fontSize: 24, color: colors.navy, marginBottom: 8 },
  successAmount: { fontFamily: 'Sora_700Bold', fontSize: 36, color: colors.primary, marginBottom: 4 },
  successSubtitle: { fontFamily: 'DMSans_400Regular', fontSize: 15, color: colors.muted },
  successBank: { fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: colors.navy, marginTop: 6, marginBottom: 20, textAlign: 'center' },
  processingCard: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.lightGray, borderRadius: 10, padding: 12, marginBottom: 32,
  },
  processingText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted },
  successActions: { width: '100%' },
});
