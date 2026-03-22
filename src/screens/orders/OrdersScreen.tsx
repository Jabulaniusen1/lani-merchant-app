import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ScrollView,
  RefreshControl, StyleSheet, Modal, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import OrderCard from '../../components/orders/OrderCard';
import { OrderCardSkeleton } from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import { showToast } from '../../components/common/Toast';
import useOrderStore from '../../store/order.store';
import useRestaurantStore from '../../store/restaurant.store';
import useMerchantType from '../../hooks/useMerchantType';
import { getSocket } from '../../services/socket';
import useSocket from '../../hooks/useSocket';
import { showNewOrderNotification } from '../../services/notifications';
import { colors } from '../../theme/colors';
import { ORDER_FILTER_TABS } from '../../utils/constants';
import type { Order, OrderStatus, NewOrderPayload, OrderCancelledPayload, OrderConfirmedPayload, RiderAssignedPayload } from '../../types';

export default function OrdersScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orders, isLoading, activeFilter, fetchOrders, setFilter, addOrder, updateOrderInList, updateOrderStatus } = useOrderStore();
  const { restaurants, activeRestaurant, toggleOpen, toggleBusyMode, fetchRestaurants } = useRestaurantStore();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [togglingOpen, setTogglingOpen] = useState<boolean>(false);
  const [setupChecked, setSetupChecked] = useState<boolean>(false);
  const [showSetupPrompt, setShowSetupPrompt] = useState<boolean>(false);
  const { Store, store, isRestaurant } = useMerchantType();
  const newOrderIds = useRef<Set<string>>(new Set());
  useSocket();

  const restaurantId = activeRestaurant?.id;

  const loadOrders = useCallback(async (): Promise<void> => {
    if (!restaurantId) return;
    const status = activeFilter === 'ALL' ? null : (activeFilter as OrderStatus);
    await fetchOrders(restaurantId, status);
  }, [restaurantId, activeFilter, fetchOrders]);

  useEffect(() => {
    fetchRestaurants().then(() => {
      setSetupChecked(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (setupChecked && restaurants.length === 0) {
      setShowSetupPrompt(true);
    }
  }, [setupChecked, restaurants.length]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Socket.io listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewOrder = async (data: NewOrderPayload & Partial<Order>): Promise<void> => {
      const id = (data as { id?: string }).id ?? (data as { orderId?: string }).orderId ?? '';
      newOrderIds.current.add(id);
      addOrder(data as Order);
      await showNewOrderNotification(data as NewOrderPayload);
      showToast({ type: 'info', message: 'New order received!' });
    };

    const handleOrderCancelled = (data: OrderCancelledPayload): void => {
      const id = data.id ?? data.orderId ?? '';
      updateOrderInList(id, { status: 'CANCELLED' });
      showToast({ type: 'warning', message: 'Customer cancelled an order' });
    };

    const handleOrderConfirmed = (data: OrderConfirmedPayload): void => {
      const id = data.orderId ?? data.id ?? '';
      updateOrderInList(id, { status: 'CONFIRMED' });
      showToast({ type: 'success', message: 'Payment received — order confirmed!' });
    };

    const handleRiderAssigned = (data: RiderAssignedPayload): void => {
      const id = data.orderId ?? data.id ?? '';
      updateOrderInList(id, { rider: data.rider, status: 'OUT_FOR_DELIVERY' });
      showToast({ type: 'info', message: 'Rider assigned to order' });
    };

    socket.on('new_order', handleNewOrder);
    socket.on('order_confirmed', handleOrderConfirmed);
    socket.on('order_cancelled', handleOrderCancelled);
    socket.on('rider_assigned', handleRiderAssigned);

    return () => {
      socket.off('new_order', handleNewOrder);
      socket.off('order_confirmed', handleOrderConfirmed);
      socket.off('order_cancelled', handleOrderCancelled);
      socket.off('rider_assigned', handleRiderAssigned);
    };
  }, [addOrder, updateOrderInList]);

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const handleToggleOpen = async (): Promise<void> => {
    if (!activeRestaurant) return;
    setTogglingOpen(true);
    try {
      await toggleOpen(activeRestaurant.id, !activeRestaurant.isOpen);
    } catch {
      showToast({ type: 'error', message: 'Failed to update restaurant status' });
    } finally {
      setTogglingOpen(false);
    }
  };

  const handleDisableBusyMode = async (): Promise<void> => {
    if (!activeRestaurant) return;
    try {
      await toggleBusyMode(activeRestaurant.id, false);
      showToast({ type: 'success', message: 'Busy mode disabled' });
    } catch {
      showToast({ type: 'error', message: 'Failed to disable busy mode' });
    }
  };

  const handleUpdateStatus = async (
    orderId: string,
    status: OrderStatus,
    extra?: { cancelReason?: string; estimatedPrepTime?: number }
  ): Promise<void> => {
    try {
      await updateOrderStatus(orderId, status, extra);
      showToast({ type: 'success', message: 'Order status updated' });
    } catch {
      showToast({ type: 'error', message: 'Failed to update order status' });
    }
  };

  const handleCancel = async (orderId: string, cancelReason: string): Promise<void> => {
    try {
      await updateOrderStatus(orderId, 'CANCELLED', { cancelReason });
      showToast({ type: 'warning', message: 'Order cancelled' });
    } catch {
      showToast({ type: 'error', message: 'Failed to cancel order' });
    }
  };

  const filteredOrders =
    activeFilter === 'ALL'
      ? orders
      : orders.filter((o) => o.status === activeFilter);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Orders</Text>
          {activeRestaurant && (
            <Text style={styles.restaurantName}>{activeRestaurant.name}</Text>
          )}
        </View>
        {activeRestaurant && (
          <TouchableOpacity
            style={[styles.toggle, activeRestaurant.isOpen ? styles.toggleOpen : styles.toggleClosed]}
            onPress={handleToggleOpen}
            disabled={togglingOpen}
            activeOpacity={0.8}
          >
            <View style={[styles.toggleDot, activeRestaurant.isOpen ? styles.dotOpen : styles.dotClosed]} />
            <Text style={[styles.toggleText, { color: activeRestaurant.isOpen ? colors.success : colors.error }]}>
              {activeRestaurant.isOpen ? 'OPEN' : 'CLOSED'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Busy Mode Banner — restaurants only */}
      {isRestaurant && activeRestaurant?.isBusy && (
        <TouchableOpacity
          style={styles.busyBanner}
          onPress={handleDisableBusyMode}
          activeOpacity={0.85}
        >
          <View style={styles.busyBannerLeft}>
            <View style={styles.busyDot} />
            <Text style={styles.busyBannerText}>BUSY MODE ON — New orders are paused</Text>
          </View>
          <Text style={styles.busyBannerTap}>Tap to disable</Text>
        </TouchableOpacity>
      )}

      {/* Closed banner */}
      {activeRestaurant && !activeRestaurant.isOpen && (
        <View style={styles.closedBanner}>
          <Ionicons name="warning-outline" size={16} color={colors.warning} />
          <Text style={styles.closedBannerText}>
            Your {store} is currently closed. Customers cannot place orders.
          </Text>
        </View>
      )}

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {ORDER_FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={styles.tab}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.tabText, activeFilter === tab && styles.tabTextActive]}>
              {tab === 'READY_FOR_PICKUP' ? 'READY' : tab}
            </Text>
            {activeFilter === tab && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Setup prompt modal */}
      <Modal
        visible={showSetupPrompt}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowSetupPrompt(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            {/* Icon */}
            <View style={styles.modalIconWrap}>
              <Text style={styles.modalIcon}>🏪</Text>
            </View>

            <Text style={styles.modalTitle}>Complete Your Setup</Text>
            <Text style={styles.modalSubtitle}>
              You're almost there! Set up your {store} to start receiving orders on Lanieats.
            </Text>

            {/* Checklist */}
            <View style={styles.checklist}>
              <View style={styles.checkRow}>
                <View style={[styles.checkCircle, styles.checkDone]}>
                  <Ionicons name="checkmark" size={13} color="#fff" />
                </View>
                <Text style={styles.checkLabelDone}>Account created</Text>
              </View>
              <View style={styles.checkConnector} />
              <View style={styles.checkRow}>
                <View style={[styles.checkCircle, styles.checkPending]}>
                  <Ionicons name="storefront-outline" size={13} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.checkLabel}>Set up your store</Text>
                  <Text style={styles.checkLabelHint}>Add your store details to go live</Text>
                </View>
              </View>
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={styles.setupBtn}
              onPress={() => {
                setShowSetupPrompt(false);
                router.push('/(auth)/create-restaurant');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.setupBtnText}>Set Up My Store</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.laterBtn}
              onPress={() => setShowSetupPrompt(false)}
            >
              <Text style={styles.laterBtnText}>I'll do this later</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Orders list */}
      {isLoading && !refreshing ? (
        <View style={styles.listContent}>
          {[1, 2, 3].map((i) => <OrderCardSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList<Order>
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="📋"
              title="No orders yet"
              subtitle={
                activeFilter === 'ALL'
                  ? 'New orders will appear here in real-time.'
                  : `No ${activeFilter.toLowerCase()} orders.`
              }
            />
          }
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              isNew={newOrderIds.current.has(item.id)}
              onPress={() => router.push(`/(main)/orders/${item.id}`)}
              onUpdateStatus={handleUpdateStatus}
              onCancel={handleCancel}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.softWhite },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  title: { fontFamily: 'Sora_700Bold', fontSize: 22, color: colors.navy },
  restaurantName: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted, marginTop: 2 },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 6,
  },
  toggleOpen: { backgroundColor: '#DCFCE7' },
  toggleClosed: { backgroundColor: '#FEE2E2' },
  toggleDot: { width: 8, height: 8, borderRadius: 4 },
  dotOpen: { backgroundColor: colors.success },
  dotClosed: { backgroundColor: colors.error },
  toggleText: { fontFamily: 'Sora_700Bold', fontSize: 12 },
  busyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1F2937',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  busyBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  busyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error },
  busyBannerText: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#fff' },
  busyBannerTap: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FEF3C7',
  },
  closedBannerText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.warning,
    flex: 1,
  },
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  tabsContent: { paddingHorizontal: 12, paddingBottom: 0 },
  tab: { paddingHorizontal: 12, paddingVertical: 12, alignItems: 'center' },
  tabText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: colors.muted,
    letterSpacing: 0.5,
  },
  tabTextActive: { color: colors.primary, fontFamily: 'DMSans_600SemiBold' },
  tabUnderline: {
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
    width: '100%',
    marginTop: 6,
  },
  listContent: { padding: 16, flexGrow: 1 },
  // Setup prompt modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 40,
  },
  modalIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#FFF3E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    alignSelf: 'center',
  },
  modalIcon: { fontSize: 32 },
  modalTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 22,
    color: colors.navy,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  checklist: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 0,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkConnector: {
    width: 2,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginLeft: 15,
    marginVertical: 4,
  },
  checkCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: { backgroundColor: colors.success },
  checkPending: { backgroundColor: '#FFF3E8', borderWidth: 1.5, borderColor: colors.primary },
  checkLabelDone: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: colors.success,
    textDecorationLine: 'line-through',
  },
  checkLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: colors.navy,
  },
  checkLabelHint: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: colors.muted,
    marginTop: 1,
  },
  setupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 17,
    marginBottom: 12,
  },
  setupBtnText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 16,
    color: '#fff',
  },
  laterBtn: { alignItems: 'center', paddingVertical: 8 },
  laterBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: colors.muted,
  },
});
