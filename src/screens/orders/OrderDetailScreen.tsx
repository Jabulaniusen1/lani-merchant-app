import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Linking, Modal, TextInput, StyleSheet,
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
import useMerchantType from '../../hooks/useMerchantType';
import useOrderStore from '../../store/order.store';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { formatCurrency, formatOrderNumber, formatDate } from '../../utils/formatters';
import type { Order, OrderStatus } from '../../types';

export default function OrderDetailScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { updateOrderStatus } = useOrderStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const { isRestaurant } = useMerchantType();

  // Cancel sheet state
  const [showCancelSheet, setShowCancelSheet] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [additionalNote, setAdditionalNote] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Prep time sheet state
  const [showPrepSheet, setShowPrepSheet] = useState(false);
  const [selectedPrepTime, setSelectedPrepTime] = useState<number | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customPrepTime, setCustomPrepTime] = useState('');
  const [preparingSubmit, setPreparingSubmit] = useState(false);

  const CANCEL_REASONS = isRestaurant
    ? ['Item(s) out of stock', 'Restaurant closing early', 'Too busy to fulfil this order', 'Customer requested cancellation', 'Technical issue', 'Other']
    : ['Product(s) out of stock', 'Store closing early', 'Unable to process this order now', 'Customer requested cancellation', 'Technical issue', 'Other'];

  const PREP_TIMES = [10, 15, 20, 30, 45, 60];

  const fetchOrder = async (): Promise<void> => {
    try {
      const res = await getOrderDetailApi(id);
      const data = res.data.data as unknown as { order?: Order } | Order;
      const order = (data as { order?: Order }).order ?? (data as Order);
      setOrder(order);
    } catch {
      showToast({ type: 'error', message: 'Failed to load order details' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleUpdateStatus = async (nextStatus: OrderStatus, extra?: { cancelReason?: string; estimatedPrepTime?: number }): Promise<void> => {
    setUpdating(true);
    try {
      await updateOrderStatus(id, nextStatus, extra);
      setOrder((prev) => prev ? { ...prev, status: nextStatus } : prev);
      showToast({ type: 'success', message: 'Order status updated' });
    } catch {
      showToast({ type: 'error', message: 'Failed to update status' });
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelSubmit = async (): Promise<void> => {
    if (!selectedReason) return;
    const reason = additionalNote.trim()
      ? `${selectedReason} — ${additionalNote.trim()}`
      : selectedReason;
    setCancelling(true);
    try {
      await handleUpdateStatus('CANCELLED', { cancelReason: reason });
      setShowCancelSheet(false);
    } finally {
      setCancelling(false);
    }
  };

  const handlePrepSubmit = async (): Promise<void> => {
    const prepTime = showCustomInput ? parseInt(customPrepTime, 10) : selectedPrepTime;
    if (!prepTime || prepTime <= 0) return;
    setPreparingSubmit(true);
    try {
      await handleUpdateStatus('PREPARING', { estimatedPrepTime: prepTime });
      setShowPrepSheet(false);
    } finally {
      setPreparingSubmit(false);
    }
  };

  const getNextStatus = (status: OrderStatus): OrderStatus | null => {
    switch (status) {
      case 'PENDING':
      case 'CONFIRMED': return 'PREPARING';
      case 'PREPARING': return 'READY_FOR_PICKUP';
      default: return null;
    }
  };

  const getActionLabel = (status: OrderStatus): string => {
    switch (status) {
      case 'PENDING':
      case 'CONFIRMED': return isRestaurant ? 'Start Preparing' : 'Start Processing';
      case 'PREPARING': return isRestaurant ? 'Mark Ready for Pickup' : 'Mark Ready for Dispatch';
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

  const customer = order.customer ?? order.user;
  const customerName = customer?.firstName
    ? `${customer.firstName} ${customer.lastName ?? ''}`
    : (customer as { name?: string })?.name ?? 'Customer';
  const items = order.items ?? order.orderItems ?? [];
  const nextStatus = getNextStatus(order.status);
  const canCancel = order.status === 'PENDING' || order.status === 'CONFIRMED';
  const rider = order.rider ?? order.riderProfile;

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
          {customer?.phone && (
            <TouchableOpacity
              style={[styles.infoRow, { marginTop: 8 }]}
              onPress={() => Linking.openURL(`tel:${customer.phone}`)}
            >
              <Ionicons name="call-outline" size={16} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.primary }]}>{customer.phone}</Text>
            </TouchableOpacity>
          )}
          {order.note ? (
            <View style={styles.noteBox}>
              <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.primary} />
              <Text style={styles.noteText}>{order.note}</Text>
            </View>
          ) : null}
        </Card>

        {/* Order Items */}
        <Card style={styles.card} shadow="md">
          <Text style={styles.sectionTitle}>{isRestaurant ? 'Order Items' : 'Order Products'}</Text>
          {items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <View style={styles.itemLeft}>
                <Text style={styles.itemQty}>{item.quantity}x</Text>
                <Text style={styles.itemName}>{item.menuItem?.name ?? item.name}</Text>
              </View>
              <Text style={styles.itemPrice}>
                {formatCurrency((item.price ?? item.unitPrice ?? 0) * item.quantity)}
              </Text>
            </View>
          ))}
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
                  : `${(order.deliveryAddress as { street?: string }).street ?? ''}, ${(order.deliveryAddress as { city?: string }).city ?? ''}`}
              </Text>
            </View>
          </Card>
        )}

        {/* Rider Info */}
        {rider && (
          <Card style={styles.card} shadow="md">
            <Text style={styles.sectionTitle}>Rider Info</Text>
            <View style={styles.infoRow}>
              <Ionicons name="bicycle-outline" size={16} color={colors.navy} style={{ marginRight: 6 }} />
              <Text style={styles.infoText}>{rider.firstName} {rider.lastName}</Text>
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
                onPress={() => {
                  setSelectedReason('');
                  setAdditionalNote('');
                  setShowCancelSheet(true);
                }}
                loading={updating}
                style={styles.actionBtn}
              />
            )}
            {order.status === 'READY_FOR_PICKUP' ? (
              <View style={styles.waitingBanner}>
                <Text style={styles.waitingText}>Waiting for rider assignment...</Text>
              </View>
            ) : nextStatus ? (
              <Button
                label={getActionLabel(order.status)}
                variant="primary"
                onPress={() => {
                  const isStartPreparing = order.status === 'PENDING' || order.status === 'CONFIRMED';
                  if (isStartPreparing) {
                    setSelectedPrepTime(null);
                    setCustomPrepTime('');
                    setShowCustomInput(false);
                    setShowPrepSheet(true);
                  } else {
                    handleUpdateStatus(nextStatus);
                  }
                }}
                loading={updating}
                style={styles.actionBtn}
              />
            ) : null}
          </View>
        )}
      </ScrollView>

      {/* Cancel Reason Sheet */}
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
            <Text style={styles.sheetTitle}>Cancel Order</Text>
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

      {/* Prep Time Sheet */}
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
            <Text style={styles.sheetTitle}>
              {isRestaurant ? 'Start Preparing' : 'Start Processing'}
            </Text>
            <View style={styles.sheetDivider} />
            <Text style={styles.sheetSubtitle}>
              {isRestaurant ? 'How long will this take?' : 'How long until this order is ready?'}
            </Text>

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
                onPress={() => { setShowCustomInput(true); setSelectedPrepTime(null); }}
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
                label={isRestaurant ? 'Confirm — Start Preparing' : 'Confirm — Start Processing'}
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
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 10,
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    padding: 10,
  },
  noteText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#92400E', flex: 1, lineHeight: 18 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 36, maxHeight: '85%',
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.lightGray, alignSelf: 'center', marginBottom: 16,
  },
  sheetTitle: { fontFamily: 'Sora_700Bold', fontSize: 18, color: colors.navy, marginBottom: 12 },
  sheetDivider: { height: 1, backgroundColor: colors.lightGray, marginBottom: 14 },
  sheetSubtitle: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: '#374151', marginBottom: 12 },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
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
    borderWidth: 1.5, borderColor: colors.primary, borderRadius: 12, paddingHorizontal: 16,
  },
  customInput: { flex: 1, fontFamily: 'Sora_700Bold', fontSize: 20, color: colors.navy, paddingVertical: 12 },
  customInputSuffix: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.muted },
  prepNote: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted, textAlign: 'center', marginBottom: 4 },
});
