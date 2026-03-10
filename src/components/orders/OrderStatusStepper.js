import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

const STEPS = [
  { key: 'PENDING', label: 'Placed' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PREPARING', label: 'Preparing' },
  { key: 'READY_FOR_PICKUP', label: 'Ready' },
  { key: 'OUT_FOR_DELIVERY', label: 'On the way' },
  { key: 'DELIVERED', label: 'Delivered' },
];

const ORDER = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED'];

export default function OrderStatusStepper({ status }) {
  const currentIdx = ORDER.indexOf(status);
  if (status === 'CANCELLED') {
    return (
      <View style={styles.container}>
        <View style={styles.cancelledBadge}>
          <Text style={styles.cancelledText}>Order Cancelled</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {STEPS.map((step, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isFuture = idx > currentIdx;

        return (
          <View key={step.key} style={styles.step}>
            <View style={styles.stepLeft}>
              <View
                style={[
                  styles.dot,
                  isCompleted && styles.dotCompleted,
                  isCurrent && styles.dotCurrent,
                  isFuture && styles.dotFuture,
                ]}
              />
              {idx < STEPS.length - 1 && (
                <View
                  style={[
                    styles.line,
                    isCompleted && styles.lineCompleted,
                  ]}
                />
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                isCompleted && styles.labelCompleted,
                isCurrent && styles.labelCurrent,
                isFuture && styles.labelFuture,
              ]}
            >
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 0,
  },
  stepLeft: {
    alignItems: 'center',
    width: 20,
    marginRight: 12,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  dotCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dotCurrent: {
    backgroundColor: '#fff',
    borderColor: colors.primary,
    borderWidth: 3,
  },
  dotFuture: {
    backgroundColor: '#fff',
    borderColor: colors.muted,
  },
  line: {
    width: 2,
    height: 28,
    backgroundColor: colors.lightGray,
    marginVertical: 2,
  },
  lineCompleted: {
    backgroundColor: colors.primary,
  },
  stepLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    paddingTop: 0,
    lineHeight: 14,
    paddingBottom: 16,
  },
  labelCompleted: { color: colors.primary, fontFamily: 'DMSans_500Medium' },
  labelCurrent: { color: colors.navy, fontFamily: 'Sora_600SemiBold' },
  labelFuture: { color: colors.muted },
  cancelledBadge: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelledText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 14,
    color: colors.error,
  },
});
