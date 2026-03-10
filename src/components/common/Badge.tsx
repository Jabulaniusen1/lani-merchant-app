import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import type { OrderStatus } from '../../types';

type BadgeColor = 'orange' | 'green' | 'red' | 'amber' | 'gray' | 'blue' | 'purple' | 'cyan';

interface ColorScheme {
  bg: string;
  text: string;
}

const colorMap: Record<BadgeColor, ColorScheme> = {
  orange: { bg: '#FFF3E8', text: colors.primary },
  green: { bg: '#DCFCE7', text: colors.success },
  red: { bg: '#FEE2E2', text: colors.error },
  amber: { bg: '#FEF3C7', text: colors.warning },
  gray: { bg: '#F3F4F6', text: colors.muted },
  blue: { bg: '#DBEAFE', text: colors.blue },
  purple: { bg: '#EDE9FE', text: colors.purple },
  cyan: { bg: '#CFFAFE', text: colors.cyan },
};

interface BadgeProps {
  label: string | undefined;
  color?: BadgeColor;
  style?: ViewStyle;
}

export default function Badge({ label, color = 'gray', style }: BadgeProps): React.JSX.Element {
  const scheme = colorMap[color] ?? colorMap.gray;
  return (
    <View style={[styles.badge, { backgroundColor: scheme.bg }, style]}>
      <Text style={[styles.text, { color: scheme.text }]}>{label?.toUpperCase()}</Text>
    </View>
  );
}

export function getStatusColor(status: OrderStatus | string): BadgeColor {
  switch (status) {
    case 'PENDING': return 'amber';
    case 'CONFIRMED': return 'blue';
    case 'PREPARING': return 'orange';
    case 'READY_FOR_PICKUP': return 'purple';
    case 'OUT_FOR_DELIVERY': return 'cyan';
    case 'DELIVERED': return 'green';
    case 'CANCELLED': return 'red';
    default: return 'gray';
  }
}

export function getStatusLabel(status: OrderStatus | string): string {
  switch (status) {
    case 'READY_FOR_PICKUP': return 'READY';
    case 'OUT_FOR_DELIVERY': return 'OUT FOR DELIVERY';
    default: return status;
  }
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: 'Sora_700Bold',
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
