import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Badge, { getStatusColor, getStatusLabel } from '../common/Badge';
import Button from '../common/Button';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { formatCurrency, formatOrderNumber, formatRelativeTime } from '../../utils/formatters';
import type { Order, OrderStatus } from '../../types';

interface OrderCardProps {
  order: Order;
  onPress?: () => void;
  onUpdateStatus?: (orderId: string, status: OrderStatus) => void;
  onCancel?: (orderId: string) => void;
  isNew?: boolean;
}

function getNextStatus(status: OrderStatus): OrderStatus | null {
  switch (status) {
    case 'PENDING':
    case 'CONFIRMED': return 'PREPARING';
    case 'PREPARING': return 'READY_FOR_PICKUP';
    default: return null;
  }
}

function getActionLabel(status: OrderStatus): string {
  switch (status) {
    case 'PENDING':
    case 'CONFIRMED': return 'Start Preparing →';
    case 'PREPARING': return 'Mark Ready for Pickup →';
    default: return 'Update →';
  }
}

export default function OrderCard({
  order,
  onPress,
  onUpdateStatus,
  onCancel,
  isNew,
}: OrderCardProps): React.JSX.Element {
  const slideAnim = useRef(new Animated.Value(isNew ? -60 : 0)).current;
  const opacityAnim = useRef(new Animated.Value(isNew ? 0 : 1)).current;

  useEffect(() => {
    if (isNew) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 70,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isNew, slideAnim, opacityAnim]);

  const { status } = order;
  const canCancel = status === 'PENDING' || status === 'CONFIRMED';
  const nextStatus = getNextStatus(status);

  const items = order.items ?? order.orderItems ?? [];
  const customer = order.customer ?? order.user;
  const customerName = customer?.firstName
    ? `${customer.firstName} ${customer.lastName ?? ''}`
    : (customer as { name?: string })?.name ?? 'Customer';

  return (
    <Animated.View
      style={[
        styles.card,
        shadows.md,
        { transform: [{ translateY: slideAnim }], opacity: opacityAnim },
      ]}
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.orderNum}>{formatOrderNumber(order.id)}</Text>
          <View style={styles.headerRight}>
            <Text style={styles.time}>{formatRelativeTime(order.createdAt)}</Text>
            <Badge label={getStatusLabel(status)} color={getStatusColor(status)} />
          </View>
        </View>

        <View style={styles.divider} />

        {/* Customer */}
        <View style={styles.row}>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={14} color={colors.muted} />
            <Text style={styles.infoText}>{customerName}</Text>
          </View>
          {customer?.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={14} color={colors.muted} />
              <Text style={styles.infoText}>{customer.phone}</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Items */}
        <View style={styles.items}>
          {items.slice(0, 3).map((item, i) => (
            <Text key={i} style={styles.itemText}>
              {item.quantity}x {item.menuItem?.name ?? item.name}
            </Text>
          ))}
          {items.length > 3 && (
            <Text style={styles.moreItems}>+{items.length - 3} more items</Text>
          )}
        </View>

        <View style={styles.divider} />

        {/* Pricing */}
        <View style={styles.pricing}>
          <Text style={styles.pricingText}>
            Subtotal: {formatCurrency(order.subtotal ?? 0)}
          </Text>
          <Text style={styles.pricingText}>
            Delivery: {formatCurrency(order.deliveryFee ?? 0)}
          </Text>
          <Text style={styles.total}>Total: {formatCurrency(order.total ?? order.totalAmount ?? 0)}</Text>
        </View>

        {/* Address */}
        {order.deliveryAddress && (
          <>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={14} color={colors.muted} />
              <Text style={styles.addressText} numberOfLines={1}>
                {typeof order.deliveryAddress === 'string'
                  ? order.deliveryAddress
                  : (order.deliveryAddress as { street?: string; address?: string }).street ??
                    (order.deliveryAddress as { address?: string }).address ??
                    ''}
              </Text>
            </View>
          </>
        )}
      </TouchableOpacity>

      {/* Actions */}
      {status !== 'DELIVERED' && status !== 'CANCELLED' && status !== 'OUT_FOR_DELIVERY' && (
        <>
          <View style={styles.divider} />
          <View style={styles.actions}>
            {canCancel && (
              <Button
                label="Cancel"
                variant="outline"
                size="sm"
                onPress={() => onCancel?.(order.id)}
                style={styles.actionBtn}
              />
            )}
            {status === 'READY_FOR_PICKUP' ? (
              <View style={styles.waitingRow}>
                <View style={styles.pulseDot} />
                <Text style={styles.waitingText}>Waiting for rider...</Text>
              </View>
            ) : nextStatus ? (
              <Button
                label={getActionLabel(status)}
                variant="primary"
                size="sm"
                onPress={() => onUpdateStatus?.(order.id, nextStatus)}
                style={[styles.actionBtn, !canCancel && { flex: 1 }]}
              />
            ) : null}
          </View>
        </>
      )}

      {status === 'DELIVERED' && (
        <View style={styles.deliveredBanner}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={styles.deliveredText}>Delivered</Text>
        </View>
      )}

      {status === 'OUT_FOR_DELIVERY' && (
        <View style={styles.deliveredBanner}>
          <Text style={styles.deliveredText}>Out for delivery</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderNum: {
    fontFamily: 'Sora_700Bold',
    fontSize: 16,
    color: colors.navy,
  },
  time: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: colors.muted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.lightGray,
    marginVertical: 10,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#374151' },
  addressText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#374151', flex: 1 },
  items: { gap: 3 },
  itemText: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.navy },
  moreItems: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted, marginTop: 2 },
  pricing: { gap: 2 },
  pricingText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#6B7280' },
  total: { fontFamily: 'Sora_700Bold', fontSize: 15, color: colors.navy, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  actionBtn: { flex: 1 },
  waitingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.warning,
  },
  waitingText: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.warning },
  deliveredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  deliveredText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: colors.success,
  },
});
