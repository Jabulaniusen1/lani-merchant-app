import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Linking, StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Badge, { getStatusColor, getStatusLabel } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import OrderStatusStepper from '../../components/orders/OrderStatusStepper';
import { showToast } from '../../components/common/Toast';
import { getOrderDetailApi } from '../../api/order.api';
import useOrderStore from '../../store/order.store';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { formatCurrency, formatOrderNumber, formatDate } from '../../utils/formatters';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { updateOrderStatus } = useOrderStore();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await getOrderDetailApi(id);
      setOrder(res.data.data);
    } catch {
      showToast({ type: 'error', message: 'Failed to load order details' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleUpdateStatus = async (nextStatus) => {
    setUpdating(true);
    try {
      await updateOrderStatus(id, nextStatus);
      setOrder((prev) => ({ ...prev, status: nextStatus }));
      showToast({ type: 'success', message: 'Order status updated' });
    } catch {
      showToast({ type: 'error', message: 'Failed to update status' });
    } finally {
      setUpdating(false);
    }
  };

  const getNextStatus = (status) => {
    switch (status) {
      case 'PENDING':
      case 'CONFIRMED': return 'PREPARING';
      case 'PREPARING': return 'READY_FOR_PICKUP';
      default: return null;
    }
  };

  const getActionLabel = (status) => {
    switch (status) {
      case 'PENDING':
      case 'CONFIRMED': return 'Start Preparing';
      case 'PREPARING': return 'Mark Ready for Pickup';
      default: return '';
    }
  };

  if (loading) return <LoadingSpinner full />;

  if (!order) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.navy} />
        </TouchableOpacity>
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  const customer = order.customer || order.user || {};
  const customerName = customer.firstName
    ? `${customer.firstName} ${customer.lastName}`
    : customer.name || 'Customer';
  const items = order.items || order.orderItems || [];
  const nextStatus = getNextStatus(order.status);
  const canCancel = order.status === 'PENDING' || order.status === 'CONFIRMED';
  const rider = order.rider || order.riderProfile;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.navy} />
        </TouchableOpacity>
        <View>
          <Text style={styles.orderNum}>{formatOrderNumber(order.id)}</Text>
        </View>
        <Badge label={getStatusLabel(order.status)} color={getStatusColor(order.status)} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Customer Info */}
        <Card style={styles.card} shadow="md">
          <Text style={styles.sectionTitle}>Customer</Text>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={16} color={colors.muted} />
            <Text style={styles.infoText}>{customerName}</Text>
          </View>
          {customer.phone && (
            <TouchableOpacity
              style={[styles.infoRow, { marginTop: 8 }]}
              onPress={() => Linking.openURL(`tel:${customer.phone}`)}
            >
              <Ionicons name="call-outline" size={16} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.primary }]}>{customer.phone}</Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Order Items */}
        <Card style={styles.card} shadow="md">
          <Text style={styles.sectionTitle}>Order Items</Text>
          {items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <View style={styles.itemLeft}>
                <Text style={styles.itemQty}>{item.quantity}x</Text>
                <Text style={styles.itemName}>{item.menuItem?.name || item.name}</Text>
              </View>
              <Text style={styles.itemPrice}>
                {formatCurrency((item.price || item.unitPrice || 0) * item.quantity)}
              </Text>
            </View>
          ))}
        </Card>

        {/* Price Breakdown */}
        <Card style={styles.card} shadow="md">
          <Text style={styles.sectionTitle}>Price Breakdown</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>{formatCurrency(order.subtotal || 0)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery Fee</Text>
            <Text style={styles.priceValue}>{formatCurrency(order.deliveryFee || 0)}</Text>
          </View>
          {order.serviceCharge > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Service Charge</Text>
              <Text style={styles.priceValue}>{formatCurrency(order.serviceCharge)}</Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(order.total || order.totalAmount || 0)}</Text>
          </View>
        </Card>

        {/* Delivery Address */}
        {order.deliveryAddress && (
          <Card style={styles.card} shadow="md">
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color={colors.muted} />
              <Text style={styles.infoText}>
                {typeof order.deliveryAddress === 'string'
                  ? order.deliveryAddress
                  : `${order.deliveryAddress.street || ''}, ${order.deliveryAddress.city || ''}`}
              </Text>
            </View>
          </Card>
        )}

        {/* Rider Info */}
        {rider && (
          <Card style={styles.card} shadow="md">
            <Text style={styles.sectionTitle}>Rider Info</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoText}>🏍️ {rider.firstName} {rider.lastName}</Text>
            </View>
            {rider.phone && (
              <TouchableOpacity
                style={[styles.infoRow, { marginTop: 8 }]}
                onPress={() => Linking.openURL(`tel:${rider.phone}`)}
              >
                <Ionicons name="call-outline" size={16} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.primary }]}>{rider.phone}</Text>
              </TouchableOpacity>
            )}
          </Card>
        )}

        {/* Timestamps */}
        <Card style={styles.card} shadow="md">
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={14} color={colors.muted} />
            <Text style={styles.timestampText}>Ordered: {formatDate(order.createdAt)}</Text>
          </View>
          {order.confirmedAt && (
            <View style={[styles.infoRow, { marginTop: 6 }]}>
              <Ionicons name="checkmark-circle-outline" size={14} color={colors.success} />
              <Text style={styles.timestampText}>Confirmed: {formatDate(order.confirmedAt)}</Text>
            </View>
          )}
        </Card>

        {/* Status Stepper */}
        <Card style={styles.card} shadow="md">
          <Text style={styles.sectionTitle}>Order Progress</Text>
          <OrderStatusStepper status={order.status} />
        </Card>

        {/* Actions */}
        {(nextStatus || canCancel) && (
          <View style={styles.actions}>
            {canCancel && (
              <Button
                label="Cancel Order"
                variant="outline"
                onPress={() => handleUpdateStatus('CANCELLED')}
                loading={updating}
                style={styles.actionBtn}
              />
            )}
            {order.status === 'READY_FOR_PICKUP' ? (
              <View style={styles.waitingBanner}>
                <Text style={styles.waitingText}>⏳ Waiting for rider assignment...</Text>
              </View>
            ) : nextStatus ? (
              <Button
                label={getActionLabel(order.status)}
                variant="primary"
                onPress={() => handleUpdateStatus(nextStatus)}
                loading={updating}
                style={styles.actionBtn}
              />
            ) : null}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.softWhite },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    ...shadows.sm,
  },
  backBtn: { padding: 4 },
  orderNum: { fontFamily: 'Sora_700Bold', fontSize: 18, color: colors.navy },
  content: { padding: 16, paddingBottom: 40 },
  card: { marginBottom: 14 },
  sectionTitle: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 14,
    color: colors.navy,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: '#374151' },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  itemQty: { fontFamily: 'Sora_700Bold', fontSize: 13, color: colors.primary, width: 26 },
  itemName: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.navy, flex: 1 },
  itemPrice: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: colors.navy },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceLabel: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: '#6B7280' },
  priceValue: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: colors.navy },
  divider: { height: 1, backgroundColor: colors.lightGray, marginVertical: 8 },
  totalLabel: { fontFamily: 'Sora_700Bold', fontSize: 15, color: colors.navy },
  totalValue: { fontFamily: 'Sora_700Bold', fontSize: 15, color: colors.primary },
  timestampText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#6B7280' },
  actions: { gap: 12, marginTop: 4 },
  actionBtn: {},
  waitingBanner: {
    backgroundColor: '#FFFBEB',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  waitingText: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: colors.warning },
  errorText: { fontFamily: 'DMSans_400Regular', fontSize: 16, color: colors.muted, textAlign: 'center', marginTop: 40 },
});
