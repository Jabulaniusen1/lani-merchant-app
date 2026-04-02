import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl,
  Modal, TextInput, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import RestaurantHeader from '../../components/restaurant/RestaurantHeader';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { showToast } from '../../components/common/Toast';
import useRestaurantStore from '../../store/restaurant.store';
import useMerchantType from '../../hooks/useMerchantType';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import type { Restaurant } from '../../types';

const BUSY_QUICK_MESSAGES = ['Very busy right now', 'Long wait time', 'Almost full capacity'];

export default function RestaurantScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { restaurants, isLoading, fetchRestaurants, toggleOpen, toggleBusyMode } = useRestaurantStore();
  const { isRestaurant, Store, store, Menu } = useMerchantType();
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Busy mode sheet state
  const [busySheetRestaurant, setBusySheetRestaurant] = useState<Restaurant | null>(null);
  const [busyMessage, setBusyMessage] = useState('');
  const [togglingBusy, setTogglingBusy] = useState(false);
  const storesLabel = isRestaurant ? 'Restaurants' : Store === 'Pharmacy' ? 'Pharmacies' : 'Supermarkets';
  const storesLabelLower = storesLabel.toLowerCase();

  useEffect(() => {
    fetchRestaurants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await fetchRestaurants();
    setRefreshing(false);
  };

  const handleToggleOpen = async (restaurant: Restaurant): Promise<void> => {
    try {
      await toggleOpen(restaurant.id, !restaurant.isOpen);
    } catch {
      showToast({ type: 'error', message: `Failed to update ${store} status` });
    }
  };

  const handleBusyToggle = (restaurant: Restaurant): void => {
    if (restaurant.isBusy) {
      // Disable immediately
      setTogglingBusy(true);
      toggleBusyMode(restaurant.id, false)
        .then(() => showToast({ type: 'success', message: 'Busy mode disabled' }))
        .catch(() => showToast({ type: 'error', message: 'Failed to update busy mode' }))
        .finally(() => setTogglingBusy(false));
    } else {
      // Show sheet to set message
      setBusyMessage('');
      setBusySheetRestaurant(restaurant);
    }
  };

  const handleEnableBusy = async (): Promise<void> => {
    if (!busySheetRestaurant) return;
    setTogglingBusy(true);
    try {
      await toggleBusyMode(busySheetRestaurant.id, true, busyMessage || undefined);
      showToast({ type: 'warning', message: 'Busy mode enabled' });
      setBusySheetRestaurant(null);
    } catch {
      showToast({ type: 'error', message: 'Failed to enable busy mode' });
    } finally {
      setTogglingBusy(false);
    }
  };

  if (isLoading && !refreshing) return <LoadingSpinner full />;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My {storesLabel}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {restaurants.length === 0 ? (
          <EmptyState
            icon="storefront-outline"
            title={`No ${storesLabelLower} yet`}
            subtitle={`Add your first ${store} to start receiving orders from customers.`}
            actionLabel={`Add ${Store}`}
            onAction={() => router.push('/(main)/restaurant/create')}
          />
        ) : (
          <>
            {restaurants.map((item) => (
              <View key={item.id} style={styles.restaurantItem}>
                {!item.isApproved && (
                  <View style={styles.pendingBanner}>
                    <Ionicons name="time-outline" size={15} color={colors.warning} />
                    <Text style={styles.pendingText}>
                      Pending admin approval. Your {store} will go live once approved.
                    </Text>
                  </View>
                )}

                {item.isApproved && !item.isOpen && (
                  <View style={styles.infoBanner}>
                    <Ionicons name="information-circle-outline" size={15} color={colors.muted} />
                    <Text style={styles.infoText}>Your {store} is currently closed.</Text>
                  </View>
                )}

                <RestaurantHeader
                  restaurant={item}
                  onToggleOpen={handleToggleOpen}
                />

                {/* Busy Mode Row — restaurants only */}
                {isRestaurant && <View style={[styles.busyRow, shadows.sm as object]}>
                  <View style={styles.busyLeft}>
                    <Ionicons name="hourglass-outline" size={18} color={item.isBusy ? colors.error : colors.muted} />
                    <View>
                      <Text style={styles.busyLabel}>Busy Mode</Text>
                      {item.isBusy && item.busyMessage ? (
                        <Text style={styles.busyMessageText} numberOfLines={1}>{item.busyMessage}</Text>
                      ) : null}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.busyToggle, item.isBusy ? styles.busyToggleOn : styles.busyToggleOff]}
                    onPress={() => handleBusyToggle(item)}
                    disabled={togglingBusy}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.busyToggleText, item.isBusy ? styles.busyToggleTextOn : styles.busyToggleTextOff]}>
                      {item.isBusy ? 'ON' : 'OFF'}
                    </Text>
                  </TouchableOpacity>
                </View>}

                <View style={styles.restaurantActions}>
                  <Button
                    label={`Edit ${Store}`}
                    variant="outline"
                    size="sm"
                    onPress={() => router.push(`/(main)/restaurant/edit/${item.id}`)}
                    style={styles.actionBtn}
                  />
                  <Button
                    label={`Manage ${Menu} →`}
                    variant="primary"
                    size="sm"
                    onPress={() => router.push('/(main)/menu')}
                    style={styles.actionBtn}
                  />
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, shadows.lg]}
        onPress={() => router.push('/(main)/restaurant/create')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Busy Mode Sheet */}
      <Modal
        visible={!!busySheetRestaurant}
        transparent
        animationType="slide"
        onRequestClose={() => setBusySheetRestaurant(null)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setBusySheetRestaurant(null)}
        >
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Enable Busy Mode</Text>
            <View style={styles.sheetDivider} />

            <Text style={styles.sheetLabel}>Let customers know why:</Text>
            <TextInput
              style={styles.messageInput}
              value={busyMessage}
              onChangeText={setBusyMessage}
              placeholder="Very busy right now, 45min wait..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={2}
              maxLength={100}
            />
            <Text style={styles.charCounter}>{busyMessage.length}/100</Text>

            <Text style={styles.quickLabel}>Quick options:</Text>
            <View style={styles.quickRow}>
              {BUSY_QUICK_MESSAGES.map((msg) => (
                <TouchableOpacity
                  key={msg}
                  style={[styles.quickPill, busyMessage === msg && styles.quickPillActive]}
                  onPress={() => setBusyMessage(msg)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.quickPillText, busyMessage === msg && styles.quickPillTextActive]}>
                    {msg}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.sheetActions}>
              <Button
                label="Cancel"
                variant="outline"
                size="sm"
                onPress={() => setBusySheetRestaurant(null)}
                style={{ flex: 1 }}
              />
              <Button
                label="Enable Busy Mode"
                variant="primary"
                size="sm"
                onPress={handleEnableBusy}
                loading={togglingBusy}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
  listContent: { padding: 16, paddingBottom: 100, flexGrow: 1 },
  restaurantItem: { marginBottom: 20 },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  pendingText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.warning,
    flex: 1,
    lineHeight: 20,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  infoText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted, flex: 1 },
  busyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
  },
  busyLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  busyLabel: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: colors.navy },
  busyMessageText: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted, marginTop: 2, maxWidth: 200 },
  busyToggle: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 999,
  },
  busyToggleOn: { backgroundColor: '#FEE2E2' },
  busyToggleOff: { backgroundColor: colors.lightGray },
  busyToggleText: { fontFamily: 'Sora_700Bold', fontSize: 12 },
  busyToggleTextOn: { color: colors.error },
  busyToggleTextOff: { color: colors.muted },
  restaurantActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  actionBtn: { flex: 1 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.lightGray, alignSelf: 'center', marginBottom: 16,
  },
  sheetTitle: { fontFamily: 'Sora_700Bold', fontSize: 18, color: colors.navy, marginBottom: 12 },
  sheetDivider: { height: 1, backgroundColor: colors.lightGray, marginBottom: 16 },
  sheetLabel: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: '#374151', marginBottom: 8 },
  messageInput: {
    borderWidth: 1.5, borderColor: colors.lightGray, borderRadius: 12,
    padding: 12, fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.navy,
    textAlignVertical: 'top', minHeight: 64, marginBottom: 16,
  },
  charCounter: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted, textAlign: 'right', marginTop: -12, marginBottom: 12 },
  quickLabel: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted, marginBottom: 8 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  quickPill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: colors.lightGray,
  },
  quickPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  quickPillText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted },
  quickPillTextActive: { color: '#fff' },
  sheetActions: { flexDirection: 'row', gap: 10 },
});
