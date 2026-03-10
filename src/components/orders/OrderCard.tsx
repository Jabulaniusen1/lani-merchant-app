import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  Modal, ScrollView, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Badge, { getStatusColor, getStatusLabel } from '../common/Badge';
import Button from '../common/Button';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { formatCurrency, formatOrderNumber, formatRelativeTime } from '../../utils/formatters';
import type { Order, OrderStatus } from '../../types';

const CANCEL_REASONS = [
  'Item(s) out of stock',
  'Restaurant closing early',
  'Too busy to fulfil this order',
  'Customer requested cancellation',
  'Technical issue',
  'Other',
];

const PREP_TIMES = [10, 15, 20, 30, 45, 60];

interface OrderCardProps {
  order: Order;
  onPress?: () => void;
  onUpdateStatus?: (orderId: string, status: OrderStatus, extra?: { cancelReason?: string; estimatedPrepTime?: number }) => void;
  onCancel?: (orderId: string, cancelReason: string) => void;
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

function formatReadyTime(prepMinutes: number): string {
  const ready = new Date(Date.now() + prepMinutes * 60 * 1000);
  return ready.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
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

  // Cancel bottom sheet state
  const [showCancelSheet, setShowCancelSheet] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [additionalNote, setAdditionalNote] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Prep time bottom sheet state
  const [showPrepSheet, setShowPrepSheet] = useState(false);
  const [selectedPrepTime, setSelectedPrepTime] = useState<number | null>(null);
  const [customPrepTime, setCustomPrepTime] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [preparingSubmit, setPreparingSubmit] = useState(false);

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
  const isStartPreparing = status === 'PENDING' || status === 'CONFIRMED';

  const items = order.items ?? order.orderItems ?? [];
  const customer = order.customer ?? order.user;
  const customerName = customer?.firstName
    ? `${customer.firstName} ${customer.lastName ?? ''}`
    : (customer as { name?: string })?.name ?? 'Customer';

  const effectivePrepTime = order.estimatedPrepTime;

  // Cancel flow
  const handleCancelPress = (): void => {
    setSelectedReason('');
    setAdditionalNote('');
    setShowCancelSheet(true);
  };

  const handleCancelSubmit = async (): Promise<void> => {
    if (!selectedReason) return;
    const reason = additionalNote.trim()
      ? `${selectedReason} — ${additionalNote.trim()}`
      : selectedReason;
    setCancelling(true);
    try {
      if (onCancel) {
        await onCancel(order.id, reason);
      } else {
        await onUpdateStatus?.(order.id, 'CANCELLED', { cancelReason: reason });
      }
      setShowCancelSheet(false);
    } finally {
      setCancelling(false);
    }
  };

  // Prep time flow
  const handlePrepPress = (): void => {
    setSelectedPrepTime(null);
    setCustomPrepTime('');
    setShowCustomInput(false);
    setShowPrepSheet(true);
  };

  const handlePrepSubmit = async (): Promise<void> => {
    const prepTime = showCustomInput
      ? parseInt(customPrepTime, 10)
      : selectedPrepTime;
    if (!prepTime || prepTime <= 0) return;
    setPreparingSubmit(true);
    try {
      await onUpdateStatus?.(order.id, 'PREPARING', { estimatedPrepTime: prepTime });
      setShowPrepSheet(false);
    } finally {
      setPreparingSubmit(false);
    }
  };

  const handleNextStatus = (): void => {
    if (!nextStatus) return;
    if (isStartPreparing) {
      handlePrepPress();
    } else {
      onUpdateStatus?.(order.id, nextStatus);
    }
  };

  return (
    <>
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

          {/* Prep time indicator */}
          {status === 'PREPARING' && effectivePrepTime && (
            <>
              <View style={styles.divider} />
              <View style={styles.prepTimeRow}>
                <Ionicons name="timer-outline" size={14} color={colors.primary} />
                <Text style={styles.prepTimeText}>
                  Ready by ~{formatReadyTime(effectivePrepTime)} ({effectivePrepTime} min)
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
                  onPress={handleCancelPress}
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
                  onPress={handleNextStatus}
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

      {/* ── Cancel Reason Bottom Sheet ─────────────────────────── */}
      <Modal
        visible={showCancelSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCancelSheet(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowCancelSheet(false)}
        >
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Cancel Order {formatOrderNumber(order.id)}</Text>
            <View style={styles.sheetDivider} />
            <Text style={styles.sheetSubtitle}>Why are you cancelling?</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.reasonsScroll}>
              {CANCEL_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={styles.reasonRow}
                  onPress={() => {
                    setSelectedReason(reason);
                    if (reason !== 'Other') setAdditionalNote('');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.radio, selectedReason === reason && styles.radioSelected]}>
                    {selectedReason === reason && <View style={styles.radioDot} />}
                  </View>
                  <Text style={[styles.reasonText, selectedReason === reason && styles.reasonTextSelected]}>
                    {reason}
                  </Text>
                </TouchableOpacity>
              ))}

              <TextInput
                style={styles.noteInput}
                placeholder="Additional notes (optional)..."
                placeholderTextColor={colors.muted}
                value={additionalNote}
                onChangeText={setAdditionalNote}
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.sheetActions}>
              <Button
                label="Keep Order"
                variant="outline"
                size="sm"
                onPress={() => setShowCancelSheet(false)}
                style={{ flex: 1 }}
              />
              <Button
                label="Cancel Order"
                variant="danger"
                size="sm"
                onPress={handleCancelSubmit}
                loading={cancelling}
                disabled={!selectedReason}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Prep Time Bottom Sheet ────────────────────────────── */}
      <Modal
        visible={showPrepSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPrepSheet(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowPrepSheet(false)}
        >
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Start Preparing — {formatOrderNumber(order.id)}</Text>
            <View style={styles.sheetDivider} />
            <Text style={styles.sheetSubtitle}>How long will this take?</Text>

            <View style={styles.prepGrid}>
              {PREP_TIMES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.prepPill,
                    !showCustomInput && selectedPrepTime === t && styles.prepPillSelected,
                  ]}
                  onPress={() => {
                    setSelectedPrepTime(t);
                    setShowCustomInput(false);
                    setCustomPrepTime('');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.prepPillText, !showCustomInput && selectedPrepTime === t && styles.prepPillTextSelected]}>
                    {t} min
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.prepPill, showCustomInput && styles.prepPillSelected]}
                onPress={() => {
                  setShowCustomInput(true);
                  setSelectedPrepTime(null);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.prepPillText, showCustomInput && styles.prepPillTextSelected]}>Custom</Text>
              </TouchableOpacity>
            </View>

            {showCustomInput && (
              <View style={styles.customInputRow}>
                <TextInput
                  style={styles.customInput}
                  value={customPrepTime}
                  onChangeText={(t) => setCustomPrepTime(t.replace(/\D/g, ''))}
                  keyboardType="numeric"
                  placeholder="Enter minutes"
                  placeholderTextColor={colors.muted}
                  autoFocus
                />
                <Text style={styles.customInputSuffix}>min</Text>
              </View>
            )}

            <Text style={styles.prepNote}>Customer and rider will see this estimate.</Text>

            <View style={styles.sheetActions}>
              <Button
                label="Cancel"
                variant="outline"
                size="sm"
                onPress={() => setShowPrepSheet(false)}
                style={{ flex: 1 }}
              />
              <Button
                label="Confirm — Start Preparing"
                variant="primary"
                size="sm"
                onPress={handlePrepSubmit}
                loading={preparingSubmit}
                disabled={showCustomInput ? !customPrepTime : !selectedPrepTime}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
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
  prepTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  prepTimeText: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.primary },
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
  // Sheet styles
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
    maxHeight: '85%',
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.lightGray, alignSelf: 'center', marginBottom: 16,
  },
  sheetTitle: { fontFamily: 'Sora_700Bold', fontSize: 18, color: colors.navy, marginBottom: 12 },
  sheetDivider: { height: 1, backgroundColor: colors.lightGray, marginBottom: 14 },
  sheetSubtitle: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: '#374151', marginBottom: 12 },
  reasonsScroll: { maxHeight: 300 },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: colors.lightGray,
    alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  reasonText: { fontFamily: 'DMSans_400Regular', fontSize: 15, color: '#374151', flex: 1 },
  reasonTextSelected: { fontFamily: 'DMSans_600SemiBold', color: colors.navy },
  noteInput: {
    borderWidth: 1.5, borderColor: colors.lightGray, borderRadius: 12,
    padding: 12, fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.navy,
    textAlignVertical: 'top', minHeight: 72, marginTop: 12, marginBottom: 4,
  },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  prepGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  prepPill: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1.5, borderColor: colors.lightGray, backgroundColor: '#fff',
  },
  prepPillSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  prepPillText: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: colors.muted },
  prepPillTextSelected: { color: '#fff' },
  customInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12,
    borderWidth: 1.5, borderColor: colors.primary, borderRadius: 12,
    paddingHorizontal: 16,
  },
  customInput: {
    flex: 1, fontFamily: 'Sora_700Bold', fontSize: 20,
    color: colors.navy, paddingVertical: 12,
  },
  customInputSuffix: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.muted },
  prepNote: {
    fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted,
    textAlign: 'center', marginBottom: 4,
  },
});
