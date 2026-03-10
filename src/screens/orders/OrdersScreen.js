import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ScrollView,
  RefreshControl, Switch, StyleSheet,
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
import { getSocket } from '../../services/socket';
import useSocket from '../../hooks/useSocket';
import { showNewOrderNotification } from '../../services/notifications';
import { colors } from '../../theme/colors';
import { ORDER_FILTER_TABS } from '../../utils/constants';

export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orders, isLoading, activeFilter, fetchOrders, setFilter, addOrder, updateOrderInList, updateOrderStatus } = useOrderStore();
  const { activeRestaurant, toggleOpen, fetchRestaurants } = useRestaurantStore();
  const [refreshing, setRefreshing] = useState(false);
  const [togglingOpen, setTogglingOpen] = useState(false);
  const newOrderIds = useRef(new Set());
  useSocket(); // Join merchant socket rooms

  const restaurantId = activeRestaurant?.id;

  const loadOrders = useCallback(async () => {
    if (!restaurantId) return;
    const status = activeFilter === 'ALL' ? null : activeFilter;
    await fetchOrders(restaurantId, status);
  }, [restaurantId, activeFilter, fetchOrders]);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Socket.io listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewOrder = async (data) => {
      newOrderIds.current.add(data.id || data.orderId);
      addOrder(data);
      await showNewOrderNotification(data);
      showToast({ type: 'info', message: 'New order received! 🍽️' });
    };

    const handleOrderCancelled = (data) => {
      updateOrderInList(data.id || data.orderId, { status: 'CANCELLED' });
      showToast({ type: 'warning', message: 'Customer cancelled an order' });
    };

    const handleRiderAssigned = (data) => {
      updateOrderInList(data.orderId || data.id, { rider: data.rider, status: 'OUT_FOR_DELIVERY' });
      showToast({ type: 'info', message: 'Rider assigned to order' });
    };

    socket.on('new_order', handleNewOrder);
    socket.on('order_cancelled', handleOrderCancelled);
    socket.on('rider_assigned', handleRiderAssigned);

    return () => {
      socket.off('new_order', handleNewOrder);
      socket.off('order_cancelled', handleOrderCancelled);
      socket.off('rider_assigned', handleRiderAssigned);
    };
  }, [addOrder, updateOrderInList]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const handleToggleOpen = async () => {
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

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, status);
      showToast({ type: 'success', message: 'Order status updated' });
    } catch {
      showToast({ type: 'error', message: 'Failed to update order status' });
    }
  };

  const handleCancel = async (orderId) => {
    try {
      await updateOrderStatus(orderId, 'CANCELLED');
      showToast({ type: 'warning', message: 'Order cancelled' });
    } catch {
      showToast({ type: 'error', message: 'Failed to cancel order' });
    }
  };

  const filteredOrders = activeFilter === 'ALL'
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

      {/* Closed banner */}
      {activeRestaurant && !activeRestaurant.isOpen && (
        <View style={styles.closedBanner}>
          <Ionicons name="warning-outline" size={16} color={colors.warning} />
          <Text style={styles.closedBannerText}>
            Your restaurant is currently closed. Customers cannot place orders.
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

      {/* Orders list */}
      {isLoading && !refreshing ? (
        <View style={styles.listContent}>
          {[1, 2, 3].map((i) => <OrderCardSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
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
});
