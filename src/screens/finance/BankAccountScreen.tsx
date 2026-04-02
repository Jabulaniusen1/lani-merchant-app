import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  Modal, ActivityIndicator, ScrollView, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/common/Button';
import { showToast } from '../../components/common/Toast';
import { getBanksApi, verifyAccountApi, saveBankAccountApi } from '../../api/finance.api';
import useFinanceStore from '../../store/finance.store';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import type { Bank } from '../../types';

type Step = 'select_bank' | 'enter_account' | 'confirm';

let _cachedBanks: Bank[] | null = null;

export default function BankAccountScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setBankAccount } = useFinanceStore();

  const [step, setStep] = useState<Step>('select_bank');
  const [banks, setBanks] = useState<Bank[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifiedName, setVerifiedName] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [verifyError, setVerifyError] = useState('');

  useEffect(() => {
    if (_cachedBanks) {
      setBanks(_cachedBanks);
      setLoadingBanks(false);
      return;
    }
    getBanksApi()
      .then((res) => {
        const list = res.data.data.banks ?? [];
        _cachedBanks = list;
        setBanks(list);
      })
      .catch(() => showToast({ type: 'error', message: 'Failed to load banks' }))
      .finally(() => setLoadingBanks(false));
  }, []);

  const filteredBanks = banks.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectBank = (bank: Bank): void => {
    setSelectedBank(bank);
    setStep('enter_account');
    setAccountNumber('');
    setVerifiedName('');
    setVerifyError('');
  };

  const handleAccountChange = async (text: string): Promise<void> => {
    const digits = text.replace(/\D/g, '').slice(0, 10);
    setAccountNumber(digits);
    setVerifiedName('');
    setVerifyError('');

    if (digits.length === 10 && selectedBank) {
      setVerifying(true);
      try {
        const res = await verifyAccountApi(digits, selectedBank.code);
        setVerifiedName(res.data.data.accountName);
        setStep('confirm');
      } catch {
        setVerifyError('Could not verify this account. Check the number and try again.');
      } finally {
        setVerifying(false);
      }
    }
  };

  const handleSave = async (): Promise<void> => {
    if (!selectedBank || !verifiedName || !accountNumber) return;
    setSaving(true);
    try {
      const res = await saveBankAccountApi({
        accountName: verifiedName,
        accountNumber,
        bankName: selectedBank.name,
        bankCode: selectedBank.code,
      });
      setBankAccount(res.data.data.bankAccount);
      showToast({ type: 'success', message: 'Bank account saved!' });
      router.back();
    } catch {
      showToast({ type: 'error', message: 'Failed to save bank account' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = (): void => {
    setStep('enter_account');
    setAccountNumber('');
    setVerifiedName('');
    setVerifyError('');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.navy} />
        </TouchableOpacity>
        <Text style={styles.title}>Bank Account</Text>
        <View style={{ width: 24 }} />
      </View>

      {step === 'select_bank' && (
        <View style={{ flex: 1 }}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color={colors.muted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search banks..."
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          {loadingBanks ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={filteredBanks}
              keyExtractor={(item) => item.code}
              contentContainerStyle={styles.bankList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.bankItem}
                  onPress={() => handleSelectBank(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.bankItemText}>{item.name}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>
      )}

      {(step === 'enter_account' || step === 'confirm') && selectedBank && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.accountContent}>
            {/* Selected bank chip */}
            <TouchableOpacity
              style={styles.selectedBankChip}
              onPress={() => setStep('select_bank')}
              activeOpacity={0.8}
            >
              <Text style={styles.selectedBankText}>{selectedBank.name}</Text>
              <Ionicons name="pencil-outline" size={14} color={colors.primary} />
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Account Number</Text>
            <View style={styles.accountInputWrapper}>
              <TextInput
                style={styles.accountInput}
                value={accountNumber}
                onChangeText={handleAccountChange}
                keyboardType="numeric"
                maxLength={10}
                placeholder="Enter 10-digit account number"
                placeholderTextColor={colors.muted}
              />
              {verifying && (
                <ActivityIndicator color={colors.primary} style={styles.inputLoader} />
              )}
            </View>
            {verifying && (
              <Text style={styles.verifyingText}>Verifying account...</Text>
            )}
            {verifyError ? (
              <Text style={styles.errorText}>{verifyError}</Text>
            ) : null}

            {step === 'confirm' && verifiedName ? (
              <View style={[styles.verifiedCard, shadows.sm as object]}>
                <View style={styles.verifiedHeader}>
                  <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                  <Text style={styles.verifiedTitle}>Account Verified</Text>
                </View>
                <Text style={styles.verifiedName}>{verifiedName}</Text>
                <Text style={styles.verifiedDetails}>
                  {selectedBank.name} — {accountNumber}
                </Text>
                <Text style={styles.confirmQuestion}>Is this your account? Confirm to save.</Text>
                <View style={styles.confirmActions}>
                  <Button
                    label="No, Try Again"
                    variant="outline"
                    size="sm"
                    onPress={handleReset}
                    style={{ flex: 1 }}
                  />
                  <Button
                    label="Yes, Save Account ✓"
                    variant="primary"
                    size="sm"
                    onPress={handleSave}
                    loading={saving}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: colors.navy,
    paddingVertical: 12,
  },
  bankList: { paddingHorizontal: 16, paddingBottom: 40 },
  bankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  bankItemText: { fontFamily: 'DMSans_500Medium', fontSize: 15, color: colors.navy },
  separator: { height: 1, backgroundColor: colors.lightGray },
  accountContent: { padding: 20 },
  selectedBankChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#FFF3E8',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 24,
  },
  selectedBankText: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: colors.primary },
  inputLabel: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: colors.navy, marginBottom: 8 },
  accountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  accountInput: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 18,
    color: colors.navy,
    paddingVertical: 14,
    letterSpacing: 2,
  },
  inputLoader: { marginLeft: 8 },
  verifyingText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.muted,
    marginTop: 8,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.error,
    marginTop: 8,
  },
  verifiedCard: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  verifiedHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  verifiedTitle: { fontFamily: 'Sora_600SemiBold', fontSize: 16, color: colors.success },
  verifiedName: { fontFamily: 'Sora_700Bold', fontSize: 18, color: colors.navy, marginBottom: 4 },
  verifiedDetails: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.muted, marginBottom: 12 },
  confirmQuestion: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#374151', marginBottom: 16 },
  confirmActions: { flexDirection: 'row', gap: 10 },
});
